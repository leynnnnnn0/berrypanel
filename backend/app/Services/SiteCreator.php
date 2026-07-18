<?php

namespace App\Services;

use App\Models\Site;
use App\Models\User;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use RuntimeException;

class SiteCreator
{
    public function __construct(
        private readonly SiteProvisioner $provisioner,
        private readonly NginxSiteProvisioner $nginx,
        private readonly SiteEnvironmentService $environment,
        private readonly SystemUserProvisioner $systemUsers,
    ) {}

    public function createQueued(User $user, array $data): Site
    {
        $slug = Str::slug($data['name']);

        if (Site::where('user_id', $user->id)->where('slug', $slug)->exists()) {
            throw new RuntimeException('You already have a site with this name.');
        }

        $this->systemUsers->ensure($user);

        if (! preg_match('/^[a-z][a-z0-9_-]{2,31}$/', (string) $user->linux_username)) {
            throw new RuntimeException('The user does not have a valid Linux username.');
        }

        $root = rtrim((string) config('berrypanel.users_root'), '/')
            .'/'.$user->linux_username.'/sites/'.$slug;

        if (File::exists($root) && count(File::files($root)) + count(File::directories($root)) > 0) {
            throw new RuntimeException("BerryPanel cannot deploy {$slug} because the site folder already exists and is not empty.");
        }

        File::ensureDirectoryExists($root, 0775, true);
        $this->systemUsers->claimSite($user, $root);
        $localUrl = $this->siteHost($slug);

        return Site::create([
            'user_id' => $user->id,
            'name' => $data['name'],
            'slug' => $slug,
            'stack' => 'Laravel / Inertia',
            'php_version' => $data['php_version'] ?? '8.4',
            'status' => 'queued',
            'root_path' => $root,
            'public_path' => $root.'/public',
            'local_url' => $localUrl,
            'repository_url' => $data['repository_url'],
            'repository_branch' => $data['repository_branch'] ?? 'main',
            'backend_directory' => $data['backend_directory'] ?? '/',
            'frontend_directory' => $data['frontend_directory'] ?? '/',
            'laravel_public_directory' => $data['laravel_public_directory'] ?? '/public',
            'node_version' => $data['node_version'] ?? '20',
            'package_manager' => $data['package_manager'] ?? 'npm',
            'node_install_command' => $data['node_install_command'] ?? 'npm ci',
            'node_build_command' => $data['node_build_command'] ?? 'npm run build',
            'node_start_command' => $data['node_start_command'] ?? 'npm run start',
            'domain' => $data['domain'] ?? $localUrl,
            'ssl_enabled' => false,
            'migrate_on_deploy' => false,
            'build_on_deploy' => true,
            'restart_services_on_deploy' => true,
            'deployment_timeout' => 900,
        ]);
    }

    public function create(User $user, array $data): Site
    {
        $slug = Str::slug($data['name']);

        if (Site::where('user_id', $user->id)->where('slug', $slug)->exists()) {
            throw new RuntimeException('You already have a site with this name.');
        }

        $this->systemUsers->ensure($user);

        $branch = $data['repository_branch'] ?? 'main';
        $phpVersion = $data['php_version'] ?? '8.4';
        $localUrl = $this->siteHost($slug);
        $paths = [];

        try {
            $paths = $this->provisioner->provision($user, $slug, $data['repository_url'], $branch, $localUrl);
            $this->systemUsers->claimSite($user, $paths['root_path']);
            $this->nginx->provision($slug, $localUrl, $paths['public_path'], $phpVersion);
        } catch (RuntimeException $exception) {
            if (isset($paths['root_path'])) {
                $this->provisioner->deletePath($paths['root_path']);
            }

            throw $exception;
        }

        return Site::create([
            'user_id' => $user->id,
            'name' => $data['name'],
            'slug' => $slug,
            'stack' => 'Laravel / Inertia',
            'php_version' => $phpVersion,
            'status' => $this->environment->statusForProvisionResult($paths),
            'root_path' => $paths['root_path'],
            'public_path' => $paths['public_path'],
            'local_url' => $localUrl,
            'repository_url' => $data['repository_url'],
            'repository_branch' => $branch,
            'backend_directory' => $data['backend_directory'] ?? '/',
            'frontend_directory' => $data['frontend_directory'] ?? '/',
            'laravel_public_directory' => $data['laravel_public_directory'] ?? '/public',
            'node_version' => $data['node_version'] ?? '20',
            'package_manager' => $data['package_manager'] ?? 'npm',
            'node_install_command' => $data['node_install_command'] ?? 'npm ci',
            'node_build_command' => $data['node_build_command'] ?? 'npm run build',
            'node_start_command' => $data['node_start_command'] ?? 'npm run start',
            'domain' => $data['domain'] ?? $localUrl,
            'env_variables' => $paths['env_variables'] ?? null,
            'deployment_warnings' => $paths['deployment_warnings'] ?? [],
        ]);
    }

    private function siteHost(string $slug): string
    {
        $suffix = trim((string) config('berrypanel.site_domain_suffix'));
        $serverIp = trim((string) config('berrypanel.server_ip'));

        if ($suffix === '' && filter_var($serverIp, FILTER_VALIDATE_IP)) {
            $suffix = "{$serverIp}.nip.io";
        }

        if ($suffix === '') {
            $suffix = 'berrypanel.local';
        }

        $suffix = preg_replace('#^https?://#', '', $suffix) ?? $suffix;
        $suffix = trim($suffix, " \t\n\r\0\x0B.");

        return "{$slug}.{$suffix}";
    }
}
