<?php

namespace App\Services;

use App\Models\Site;
use App\Models\User;
use Illuminate\Support\Facades\File;
use RuntimeException;

class SiteProvisioner
{
    public function provision(User $user, string $siteSlug): array
    {
        $linuxUsername = $user->linux_username;

        if (! is_string($linuxUsername) || ! preg_match('/^[a-z][a-z0-9_-]{2,31}$/', $linuxUsername)) {
            throw new RuntimeException('The user does not have a valid Linux username.');
        }

        if (! preg_match('/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/', $siteSlug)) {
            throw new RuntimeException('The site name is not safe for a Linux path.');
        }

        $usersRoot = (string) config('berrypanel.users_root');

        $this->ensureRootIsWritable($usersRoot);

        $userRoot = $this->joinPath($usersRoot, $linuxUsername);
        $sitesRoot = $this->joinPath($userRoot, 'sites');
        $siteRoot = $this->joinPath($sitesRoot, $siteSlug);

        $paths = [
            $siteRoot,
            $this->joinPath($siteRoot, 'public'),
            $this->joinPath($siteRoot, 'storage'),
            $this->joinPath($siteRoot, 'logs'),
            $this->joinPath($siteRoot, 'backups'),
        ];

        foreach ($paths as $path) {
            try {
                File::ensureDirectoryExists($path, 0775, true);
            } catch (\Throwable $exception) {
                throw new RuntimeException(
                    "BerryPanel cannot create the site folder at {$path}. Check BERRYPANEL_USERS_ROOT permissions.",
                    previous: $exception,
                );
            }
        }

        return [
            'root_path' => $siteRoot,
            'public_path' => $this->joinPath($siteRoot, 'public'),
        ];
    }

    public function delete(Site $site): void
    {
        $sitePath = $site->root_path;

        if (! is_string($sitePath) || $sitePath === '') {
            return;
        }

        $this->ensureSitePathIsInsideUsersRoot($sitePath);

        if (File::isDirectory($sitePath)) {
            File::deleteDirectory($sitePath);
        }
    }

    public function writeEnvironmentFile(Site $site, array $variables): void
    {
        $sitePath = $site->root_path;

        if (! is_string($sitePath) || $sitePath === '') {
            throw new RuntimeException('This site does not have a valid root path.');
        }

        $this->ensureSitePathIsInsideUsersRoot($sitePath);

        if (! File::isDirectory($sitePath)) {
            throw new RuntimeException("BerryPanel cannot find the site folder at {$sitePath}.");
        }

        $content = collect($variables)
            ->map(fn (mixed $value, string $key) => "{$key}=".$this->formatEnvValue($value))
            ->implode(PHP_EOL).PHP_EOL;

        try {
            File::put($this->joinPath($sitePath, '.env'), $content, true);
        } catch (\Throwable $exception) {
            throw new RuntimeException(
                "BerryPanel cannot write the .env file for {$site->name}. Check site folder permissions.",
                previous: $exception,
            );
        }
    }

    private function joinPath(string $left, string $right): string
    {
        return rtrim($left, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.ltrim($right, DIRECTORY_SEPARATOR);
    }

    private function ensureRootIsWritable(string $usersRoot): void
    {
        if ($usersRoot === '') {
            throw new RuntimeException('BERRYPANEL_USERS_ROOT is empty and no storage fallback is available.');
        }

        $nearestExistingPath = $usersRoot;

        while (! File::exists($nearestExistingPath)) {
            $parent = dirname($nearestExistingPath);

            if ($parent === $nearestExistingPath) {
                break;
            }

            $nearestExistingPath = $parent;
        }

        if (! File::isDirectory($nearestExistingPath) || ! File::isWritable($nearestExistingPath)) {
            throw new RuntimeException(
                "BerryPanel users root is not writable: {$usersRoot}. For local dev, leave BERRYPANEL_USERS_ROOT empty. On Raspberry Pi, run the /srv permission setup commands.",
            );
        }
    }

    private function ensureSitePathIsInsideUsersRoot(string $sitePath): void
    {
        $usersRoot = (string) config('berrypanel.users_root');
        $normalizedRoot = realpath($usersRoot) ?: $usersRoot;
        $normalizedSitePath = realpath($sitePath) ?: $sitePath;

        if (! str_starts_with($normalizedSitePath, rtrim($normalizedRoot, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR)) {
            throw new RuntimeException('BerryPanel refused to access a path outside the configured users root.');
        }
    }

    private function formatEnvValue(mixed $value): string
    {
        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }

        $value = (string) $value;

        if ($value === '') {
            return '';
        }

        if (preg_match('/\s|#|"|\'|\\\\/', $value) === 1) {
            return '"'.str_replace(['\\', '"'], ['\\\\', '\\"'], $value).'"';
        }

        return $value;
    }
}
