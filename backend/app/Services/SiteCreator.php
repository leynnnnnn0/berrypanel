<?php

namespace App\Services;

use App\Models\Site;
use App\Models\User;
use Illuminate\Support\Str;
use RuntimeException;

class SiteCreator
{
    public function __construct(
        private readonly SiteProvisioner $provisioner,
        private readonly NginxSiteProvisioner $nginx,
        private readonly SiteEnvironmentService $environment,
    ) {}

    public function create(User $user, array $data): Site
    {
        $slug = Str::slug($data['name']);

        if (Site::where('user_id', $user->id)->where('slug', $slug)->exists()) {
            throw new RuntimeException('You already have a site with this name.');
        }

        if (! $user->linux_username) {
            $user->forceFill(['linux_username' => 'user_'.$user->id])->save();
        }

        $branch = $data['repository_branch'] ?? 'main';
        $phpVersion = $data['php_version'] ?? '8.4';
        $localUrl = $this->siteHost($slug);
        $paths = [];

        try {
            $paths = $this->provisioner->provision($user, $slug, $data['repository_url'], $branch, $localUrl);
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
