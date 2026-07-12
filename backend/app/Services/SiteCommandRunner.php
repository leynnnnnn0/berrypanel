<?php

namespace App\Services;

use App\Models\Site;
use Illuminate\Support\Facades\File;
use RuntimeException;
use Symfony\Component\Process\Process;

class SiteCommandRunner
{
    public function __construct(
        private readonly SiteEnvironmentService $environment,
        private readonly SiteProvisioner $provisioner,
    ) {
    }

    /**
     * Run one approved command inside a provisioned site folder.
     *
     * This intentionally does not expose a shell. Every command is mapped to an
     * argv array so user input cannot add pipes, redirects, or extra commands.
     */
    public function run(Site $site, string $input): array
    {
        $siteRoot = $this->validatedSiteRoot($site);
        $normalized = $this->normalize($input);
        $command = $this->commandFor($site, $normalized);

        $process = new Process(
            $this->withExecutionUser($site, $command),
            $siteRoot,
            $this->toolEnvironment()
        );
        $process->setTimeout(900);
        $process->run();

        if ($process->isSuccessful()) {
            $this->refreshSiteRuntime($site, $siteRoot, $normalized);
        }

        $output = trim($process->getOutput().PHP_EOL.$process->getErrorOutput());

        return [
            'command' => $normalized,
            'exit_code' => $process->getExitCode(),
            'successful' => $process->isSuccessful(),
            'output' => $output !== '' ? $output : 'Command finished with no output.',
            'ran_at' => now()->toIso8601String(),
        ];
    }

    private function commandFor(Site $site, string $input): array
    {
        $branch = $site->repository_branch ?: 'main';

        $commands = [
            'composer install' => ['composer', 'install'],
            'composer install --no-dev --optimize-autoloader' => ['composer', 'install', '--no-dev', '--optimize-autoloader'],
            'npm install' => ['npm', 'install'],
            'npm install --include=dev --production=false --no-audit --no-fund' => ['npm', 'install', '--include=dev', '--production=false', '--no-audit', '--no-fund'],
            'npm run build' => ['npm', 'run', 'build'],
            'php artisan key:generate' => ['php', 'artisan', 'key:generate'],
            'php artisan key:generate --force' => ['php', 'artisan', 'key:generate', '--force'],
            'php artisan migrate' => ['php', 'artisan', 'migrate'],
            'php artisan migrate --force' => ['php', 'artisan', 'migrate', '--force'],
            'php artisan migrate:fresh --seed' => ['php', 'artisan', 'migrate:fresh', '--seed'],
            'php artisan migrate:fresh --seed --force' => ['php', 'artisan', 'migrate:fresh', '--seed', '--force'],
            'php artisan db:seed' => ['php', 'artisan', 'db:seed'],
            'php artisan db:seed --force' => ['php', 'artisan', 'db:seed', '--force'],
            'php artisan storage:link' => ['php', 'artisan', 'storage:link'],
            'php artisan optimize:clear' => ['php', 'artisan', 'optimize:clear'],
            'php artisan config:clear' => ['php', 'artisan', 'config:clear'],
            'php artisan cache:clear' => ['php', 'artisan', 'cache:clear'],
            'php artisan route:clear' => ['php', 'artisan', 'route:clear'],
            'php artisan view:clear' => ['php', 'artisan', 'view:clear'],
            'php artisan config:cache' => ['php', 'artisan', 'config:cache'],
            'php artisan route:cache' => ['php', 'artisan', 'route:cache'],
            'php artisan queue:restart' => ['php', 'artisan', 'queue:restart'],
            'php artisan down' => ['php', 'artisan', 'down'],
            'php artisan up' => ['php', 'artisan', 'up'],
            'php artisan about' => ['php', 'artisan', 'about'],
            'tail laravel.log' => ['tail', '-n', '80', 'storage/logs/laravel.log'],
            'tail -n 80 storage/logs/laravel.log' => ['tail', '-n', '80', 'storage/logs/laravel.log'],
            "git pull origin {$branch}" => ['git', 'pull', 'origin', $branch],
        ];

        if (! array_key_exists($input, $commands)) {
            return $this->artisanCommand($input);
        }

        return $commands[$input];
    }

    private function artisanCommand(string $input): array
    {
        if (! str_starts_with($input, 'php artisan ')) {
            throw new RuntimeException('That command is not available in this console.');
        }

        if (preg_match('/[;&|`<>\n\r]|\$\(|\.\.\//', $input)) {
            throw new RuntimeException('Shell chaining, substitution, redirection, and directory traversal are not allowed.');
        }

        $arguments = preg_split('/\s+/', $input) ?: [];

        if (count($arguments) < 3 || ! preg_match('/^[a-z][a-z0-9:_-]*$/i', $arguments[2])) {
            throw new RuntimeException('Enter a valid Laravel Artisan command.');
        }

        foreach (array_slice($arguments, 3) as $argument) {
            if (! preg_match('/^[-a-zA-Z0-9_.,:=\/]+$/', $argument)) {
                throw new RuntimeException('Artisan command arguments can only contain safe letters, numbers, and option characters.');
            }
        }

        $longRunning = ['queue:work', 'queue:listen', 'horizon', 'reverb:start', 'schedule:work', 'serve', 'tinker'];

        if (in_array($arguments[2], $longRunning, true)) {
            throw new RuntimeException('This is a persistent application service. Enable it from Keep your application running instead.');
        }

        return $arguments;
    }

    private function validatedSiteRoot(Site $site): string
    {
        if (! $site->root_path || ! File::isDirectory($site->root_path)) {
            throw new RuntimeException('This site folder does not exist on the server.');
        }

        $usersRoot = realpath((string) config('berrypanel.users_root'));
        $siteRoot = realpath($site->root_path);

        if (! $usersRoot || ! $siteRoot || ! str_starts_with($siteRoot, $usersRoot.DIRECTORY_SEPARATOR)) {
            throw new RuntimeException('This site folder is outside the BerryPanel users directory.');
        }

        return $siteRoot;
    }

    private function withExecutionUser(Site $site, array $command): array
    {
        $site->loadMissing('user');

        $linuxUsername = $site->user?->linux_username;

        if (! config('berrypanel.site_command_use_sudo') || ! $linuxUsername) {
            return $command;
        }

        if (! preg_match('/^[a-z][a-z0-9_-]{2,31}$/', $linuxUsername)) {
            throw new RuntimeException('The Linux username for this site is invalid.');
        }

        if ($this->currentProcessUser() === $linuxUsername) {
            return $command;
        }

        return array_merge(['sudo', '-u', $linuxUsername, '--'], $command);
    }

    private function toolEnvironment(): array
    {
        $toolHome = storage_path('app/berrypanel/tool-home');

        File::ensureDirectoryExists($toolHome.'/composer-cache');
        File::ensureDirectoryExists($toolHome.'/npm-cache');

        return [
            'COMPOSER_ALLOW_SUPERUSER' => '1',
            'COMPOSER_HOME' => $toolHome,
            'COMPOSER_CACHE_DIR' => $toolHome.'/composer-cache',
            'HOME' => $toolHome,
            'npm_config_cache' => $toolHome.'/npm-cache',
            'PATH' => getenv('PATH') ?: '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
        ];
    }

    private function refreshSiteRuntime(Site $site, string $siteRoot, string $command): void
    {
        $variables = $this->provisioner->readEnvironmentFile($siteRoot) ?? [];
        $warnings = $this->warningsAfterSuccessfulCommand(
            $site->deployment_warnings ?? [],
            $command
        );

        $site->forceFill([
            'env_variables' => $variables,
            'deployment_warnings' => $warnings,
            'status' => $this->environment->statusFor($variables, $warnings),
        ])->save();
    }

    private function warningsAfterSuccessfulCommand(array $warnings, string $command): array
    {
        $resolvedPrefixes = match (true) {
            str_starts_with($command, 'composer install') => ['Composer install failed.'],
            str_starts_with($command, 'npm install') => ['Node dependency install failed.'],
            $command === 'npm run build' => ['Frontend build failed.'],
            $command === 'php artisan storage:link' => ['Laravel storage link failed.'],
            default => [],
        };

        if ($resolvedPrefixes === []) {
            return $warnings;
        }

        return array_values(array_filter($warnings, function (string $warning) use ($resolvedPrefixes) {
            foreach ($resolvedPrefixes as $prefix) {
                if (str_starts_with($warning, $prefix)) {
                    return false;
                }
            }

            return true;
        }));
    }

    private function normalize(string $input): string
    {
        $normalized = preg_replace('/\s+/', ' ', trim($input)) ?? '';

        if ($normalized === '') {
            throw new RuntimeException('Type a command first.');
        }

        return $normalized;
    }

    private function currentProcessUser(): ?string
    {
        if (function_exists('posix_geteuid') && function_exists('posix_getpwuid')) {
            $user = posix_getpwuid(posix_geteuid());

            return is_array($user) ? ($user['name'] ?? null) : null;
        }

        return get_current_user() ?: null;
    }
}
