<?php

namespace App\Services;

use App\Models\Site;
use Illuminate\Support\Facades\File;
use RuntimeException;
use Symfony\Component\Process\Process;

class SiteEnvironmentFileStore
{
    public function read(Site $site): ?string
    {
        if (! is_string($site->root_path) || ! File::isDirectory($site->root_path)) {
            return null;
        }

        $envPath = $this->envPath($site);

        if (! File::exists($envPath)) {
            return null;
        }

        if (! $this->usesIsolatedUser()) {
            return (string) File::get($envPath);
        }

        return $this->runAsSiteUser($site, ['cat', $envPath], captureOutput: true);
    }

    public function write(Site $site, string $content): void
    {
        $envPath = $this->envPath($site);

        if (! $this->usesIsolatedUser()) {
            File::put($envPath, $content, true);

            return;
        }

        $temporaryPath = $envPath.'.berrypanel-'.bin2hex(random_bytes(8));

        try {
            // Write to a private temporary file first so a failed update never
            // leaves the application's active environment file half-written.
            $this->runAsSiteUser($site, ['tee', $temporaryPath], $content);
            $this->runAsSiteUser($site, ['chmod', '600', $temporaryPath]);
            $this->grantPhpFpmReadAccess($site, $temporaryPath);
            $this->runAsSiteUser($site, ['mv', '-f', $temporaryPath, $envPath]);
        } catch (\Throwable $exception) {
            $this->removeTemporaryFile($site, $temporaryPath);

            throw $exception;
        }
    }

    private function grantPhpFpmReadAccess(Site $site, string $path): void
    {
        $phpFpmUser = trim((string) config('berrypanel.php_fpm_user', 'www-data'));

        if (! preg_match('/^[a-z_][a-z0-9_-]*$/i', $phpFpmUser)) {
            throw new RuntimeException('BerryPanel cannot safely grant PHP access to this environment file.');
        }

        $this->runAsSiteUser($site, ['setfacl', '-m', "u:{$phpFpmUser}:r--", $path]);
    }

    private function removeTemporaryFile(Site $site, string $path): void
    {
        try {
            $this->runAsSiteUser($site, ['rm', '-f', $path]);
        } catch (\Throwable) {
            // Preserve the original failure. The temporary filename is random,
            // remains private, and is never used as the active .env file.
        }
    }

    private function envPath(Site $site): string
    {
        $site->loadMissing('user');

        $username = (string) $site->user?->linux_username;
        $sitePath = is_string($site->root_path) ? $site->root_path : '';

        if (! preg_match('/^[a-z][a-z0-9_-]{2,31}$/', $username)) {
            throw new RuntimeException('This site does not have a valid application username.');
        }

        if ($sitePath === '' || ! File::isDirectory($sitePath)) {
            throw new RuntimeException('BerryPanel cannot find this site folder.');
        }

        $usersRoot = realpath((string) config('berrypanel.users_root'));
        $resolvedSitePath = realpath($sitePath);
        $expectedSitesRoot = $usersRoot ? $usersRoot.DIRECTORY_SEPARATOR.$username.DIRECTORY_SEPARATOR.'sites'.DIRECTORY_SEPARATOR : null;

        if (! $usersRoot || ! $resolvedSitePath || ! $expectedSitesRoot || ! str_starts_with($resolvedSitePath, $expectedSitesRoot)) {
            throw new RuntimeException('BerryPanel refused to access an environment file outside this account’s workspace.');
        }

        return $resolvedSitePath.DIRECTORY_SEPARATOR.'.env';
    }

    private function usesIsolatedUser(): bool
    {
        return (bool) config('berrypanel.system_user_provisioning_enabled');
    }

    protected function runAsSiteUser(
        Site $site,
        array $command,
        ?string $input = null,
        bool $captureOutput = false,
    ): string {
        $username = (string) $site->user?->linux_username;
        $process = new Process(array_merge(['sudo', '-u', $username, '--'], $command));
        $process->setTimeout(30);

        if ($input !== null) {
            $process->setInput($input);
        }

        if (! $captureOutput) {
            $process->disableOutput();
        }

        $process->run();

        if (! $process->isSuccessful()) {
            throw new RuntimeException('BerryPanel could not securely access this application environment.');
        }

        return $captureOutput ? $process->getOutput() : '';
    }
}
