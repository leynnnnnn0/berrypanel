<?php

namespace App\Services\Hosting;

use App\Models\Site;
use Illuminate\Support\Facades\File;
use RuntimeException;

class SitePathResolver
{
    public function root(Site $site): string
    {
        $users = realpath((string) config('berrypanel.users_root'));
        $root = realpath((string) $site->root_path);
        if (! $users || ! $root || ! str_starts_with($root, rtrim($users, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR)) {
            throw new RuntimeException('Project directory is outside the hosting root.');
        }

        return $root;
    }

    public function directory(Site $site, ?string $relative): string
    {
        $root = $this->root($site);
        $relative = trim($relative ?: '/', '/');
        $candidate = $relative === '' ? $root : $root.DIRECTORY_SEPARATOR.$relative;
        $real = realpath($candidate);
        if (! $real || ! File::isDirectory($real) || ($real !== $root && ! str_starts_with($real, $root.DIRECTORY_SEPARATOR))) {
            throw new RuntimeException('Configured project directory is invalid or escapes the project.');
        }

        return $real;
    }

    public function validateApplicationDirectories(Site $site): array
    {
        $backend = $this->directory($site, $site->backend_directory);
        $frontend = $this->directory($site, $site->frontend_directory);
        $missing = [];
        foreach (['artisan', 'composer.json'] as $file) {
            if (! File::isFile($backend.'/'.$file)) {
                $missing[] = $file;
            }
        }
        if ($missing) {
            throw new RuntimeException('Invalid Laravel backend directory: missing '.implode(' and ', $missing).'.');
        }
        if (! File::isFile($frontend.'/package.json')) {
            throw new RuntimeException('Invalid Node.js frontend directory: missing package.json.');
        }
        $public = $this->directory($site, $site->laravel_public_directory);

        return compact('backend', 'frontend', 'public');
    }

    public function validateLaravelDirectories(Site $site): array
    {
        $backend = $this->directory($site, $site->backend_directory);
        $missing = [];
        foreach (['artisan', 'composer.json'] as $file) {
            if (! File::isFile($backend.'/'.$file)) {
                $missing[] = $file;
            }
        }
        if ($missing) {
            throw new RuntimeException('Invalid Laravel directory: missing '.implode(' and ', $missing).'.');
        }
        $public = $this->directory($site, $site->laravel_public_directory);

        return compact('backend', 'public');
    }
}
