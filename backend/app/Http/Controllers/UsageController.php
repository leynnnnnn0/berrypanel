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
        $totalBytes = $this->sizeOfPath($userRoot);
        $backupBytes = $this->sizeOfSiteDirectories($sitesRoot, ['backups']);
        $uploadBytes = $this->sizeOfSiteDirectories($sitesRoot, ['storage/app/public']);
        $logBytes = $this->sizeOfSiteDirectories($sitesRoot, ['logs', 'storage/logs']);
        $applicationBytes = max(0, $totalBytes - $backupBytes - $uploadBytes - $logBytes);

        return response()->json([
            'usage' => [
                'total_bytes' => $totalBytes,
                'quota_bytes' => $quotaBytes,
                'percent' => min(100, round(($totalBytes / $quotaBytes) * 100, 1)),
                'breakdown' => [
                    'application' => $applicationBytes,
                    'uploads' => $uploadBytes,
                    'backups' => $backupBytes,
                    'logs' => $logBytes,
                ],
            ],
        ]);
    }

    private function sizeOfSiteDirectories(string $sitesRoot, array $relativePaths): int
    {
        if (! File::isDirectory($sitesRoot)) {
            return 0;
        }

        $bytes = 0;

        foreach (File::directories($sitesRoot) as $siteRoot) {
            foreach ($relativePaths as $relativePath) {
                $bytes += $this->sizeOfPath($this->joinPath($siteRoot, $relativePath));
            }
        }

        return $bytes;
    }

    private function sizeOfPath(string $path): int
    {
        if (! File::exists($path) || is_link($path)) {
            return 0;
        }

        if (File::isFile($path)) {
            return filesize($path) ?: 0;
        }

        if (! File::isDirectory($path)) {
            return 0;
        }

        $bytes = 0;

        try {
            $files = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS),
            );

            /** @var SplFileInfo $file */
            foreach ($files as $file) {
                if ($file->isLink() || ! $file->isFile()) {
                    continue;
                }

                $bytes += $file->getSize();
            }
        } catch (UnexpectedValueException) {
            return $bytes;
        }

        return $bytes;
    }

    private function joinPath(string $left, string $right): string
    {
        return rtrim($left, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.ltrim($right, DIRECTORY_SEPARATOR);
    }
}
