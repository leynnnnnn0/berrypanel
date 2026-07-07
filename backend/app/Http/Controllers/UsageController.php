<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RuntimeException;
use SplFileInfo;
use UnexpectedValueException;

class UsageController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $linuxUsername = $request->user()->linux_username;

        if (! is_string($linuxUsername) || $linuxUsername === '') {
            throw new RuntimeException('This account does not have a Linux workspace yet.');
        }

        $usersRoot = (string) config('berrypanel.users_root');
        $userRoot = $this->joinPath($usersRoot, $linuxUsername);
        $sitesRoot = $this->joinPath($userRoot, 'sites');

        $quotaBytes = max(1, (int) config('berrypanel.storage_quota_gb', 25)) * 1024 * 1024 * 1024;
        $userUsage = $this->inspectPath($userRoot);
        $backupUsage = $this->inspectSiteDirectories($sitesRoot, ['backups']);
        $uploadUsage = $this->inspectSiteDirectories($sitesRoot, ['storage/app/public']);
        $logUsage = $this->inspectSiteDirectories($sitesRoot, ['logs', 'storage/logs']);
        $totalBytes = $userUsage['bytes'];
        $backupBytes = $backupUsage['bytes'];
        $uploadBytes = $uploadUsage['bytes'];
        $logBytes = $logUsage['bytes'];
        $applicationBytes = max(0, $totalBytes - $backupBytes - $uploadBytes - $logBytes);
        $sites = $request->user()
            ->sites()
            ->latest()
            ->get()
            ->map(function ($site): array {
                $siteUsage = $this->inspectPath($site->root_path);

                return [
                    'id' => $site->id,
                    'name' => $site->name,
                    'slug' => $site->slug,
                    'bytes' => $siteUsage['bytes'],
                    'files' => $siteUsage['files'],
                    'directories' => $siteUsage['directories'],
                    'exists' => File::isDirectory($site->root_path),
                ];
            })
            ->values();

        return response()->json([
            'usage' => [
                'total_bytes' => $totalBytes,
                'quota_bytes' => $quotaBytes,
                'percent' => min(100, round(($totalBytes / $quotaBytes) * 100, 1)),
                'file_count' => $userUsage['files'],
                'directory_count' => $userUsage['directories'],
                'breakdown' => [
                    'application' => [
                        'bytes' => $applicationBytes,
                        'files' => max(0, $userUsage['files'] - $backupUsage['files'] - $uploadUsage['files'] - $logUsage['files']),
                        'directories' => max(0, $userUsage['directories'] - $backupUsage['directories'] - $uploadUsage['directories'] - $logUsage['directories']),
                    ],
                    'uploads' => $uploadUsage,
                    'backups' => $backupUsage,
                    'logs' => $logUsage,
                ],
                'sites' => $sites,
            ],
        ]);
    }

    /**
     * @return array{bytes: int, files: int, directories: int}
     */
    private function inspectSiteDirectories(string $sitesRoot, array $relativePaths): array
    {
        if (! File::isDirectory($sitesRoot)) {
            return ['bytes' => 0, 'files' => 0, 'directories' => 0];
        }

        $usage = ['bytes' => 0, 'files' => 0, 'directories' => 0];

        foreach (File::directories($sitesRoot) as $siteRoot) {
            foreach ($relativePaths as $relativePath) {
                $pathUsage = $this->inspectPath($this->joinPath($siteRoot, $relativePath));
                $usage['bytes'] += $pathUsage['bytes'];
                $usage['files'] += $pathUsage['files'];
                $usage['directories'] += $pathUsage['directories'];
            }
        }

        return $usage;
    }

    /**
     * @return array{bytes: int, files: int, directories: int}
     */
    private function inspectPath(string $path): array
    {
        if (! File::exists($path) || is_link($path)) {
            return ['bytes' => 0, 'files' => 0, 'directories' => 0];
        }

        if (File::isFile($path)) {
            return ['bytes' => filesize($path) ?: 0, 'files' => 1, 'directories' => 0];
        }

        if (! File::isDirectory($path)) {
            return ['bytes' => 0, 'files' => 0, 'directories' => 0];
        }

        $usage = ['bytes' => 0, 'files' => 0, 'directories' => 1];

        try {
            $files = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS),
                RecursiveIteratorIterator::SELF_FIRST,
            );

            /** @var SplFileInfo $file */
            foreach ($files as $file) {
                if ($file->isLink()) {
                    continue;
                }

                if ($file->isDir()) {
                    $usage['directories']++;

                    continue;
                }

                if ($file->isFile()) {
                    $usage['files']++;
                    $usage['bytes'] += $file->getSize();
                }
            }
        } catch (UnexpectedValueException) {
            return $usage;
        }

        return $usage;
    }

    private function joinPath(string $left, string $right): string
    {
        return rtrim($left, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.ltrim($right, DIRECTORY_SEPARATOR);
    }
}
