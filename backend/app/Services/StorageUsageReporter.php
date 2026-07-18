<?php

namespace App\Services;

use App\Models\Site;
use App\Models\User;
use App\Services\Billing\HostingPlanAccess;
use Illuminate\Support\Facades\File;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;
use UnexpectedValueException;

class StorageUsageReporter
{
    public function __construct(private readonly HostingPlanAccess $plans) {}

    public function forUser(User $user): array
    {
        $plan = $this->plans->effectivePlan($user);
        $subscription = $user->billingSubscription()->with('plan')->first();
        $hasPaidPlan = $subscription !== null
            && $subscription->status === 'active'
            && $subscription->current_period_end?->isFuture();
        $quotaBytes = $hasPaidPlan
            ? $plan->storage_bytes
            : (int) round(max(0.1, (float) config('berrypanel.storage_quota_gb', 1.2)) * 1024 * 1024 * 1024);
        $siteModels = $user->sites()->latest()->get();

        $sites = $siteModels
            ->map(fn (Site $site): array => $this->siteUsage($site))
            ->values();

        $totalBytes = $sites->sum('bytes');
        $fileCount = $sites->sum('files');
        $directoryCount = $sites->sum('directories');
        $backupUsage = $this->inspectSiteDirectories($siteModels, ['backups']);
        $uploadUsage = $this->inspectSiteDirectories($siteModels, ['storage/app/public']);
        $logUsage = $this->inspectSiteDirectories($siteModels, ['logs', 'storage/logs']);

        return [
            'total_bytes' => $totalBytes,
            'quota_bytes' => $quotaBytes,
            'plan' => $plan->name,
            'percent' => min(100, round(($totalBytes / $quotaBytes) * 100, 1)),
            'file_count' => $fileCount,
            'directory_count' => $directoryCount,
            'breakdown' => [
                'application' => [
                    'bytes' => max(0, $totalBytes - $backupUsage['bytes'] - $uploadUsage['bytes'] - $logUsage['bytes']),
                    'files' => max(0, $fileCount - $backupUsage['files'] - $uploadUsage['files'] - $logUsage['files']),
                    'directories' => max(0, $directoryCount - $backupUsage['directories'] - $uploadUsage['directories'] - $logUsage['directories']),
                ],
                'uploads' => $uploadUsage,
                'backups' => $backupUsage,
                'logs' => $logUsage,
            ],
            'sites' => $sites,
        ];
    }

    private function siteUsage(Site $site): array
    {
        $usage = $this->inspectPath($site->root_path);

        return [
            'id' => $site->id,
            'name' => $site->name,
            'slug' => $site->slug,
            'bytes' => $usage['bytes'],
            'files' => $usage['files'],
            'directories' => $usage['directories'],
            'exists' => File::isDirectory($site->root_path),
        ];
    }

    /**
     * @return array{bytes: int, files: int, directories: int}
     */
    private function inspectSiteDirectories(iterable $sites, array $relativePaths): array
    {
        $usage = ['bytes' => 0, 'files' => 0, 'directories' => 0];

        foreach ($sites as $site) {
            if (! is_string($site->root_path) || $site->root_path === '') {
                continue;
            }

            foreach ($relativePaths as $relativePath) {
                $pathUsage = $this->inspectPath($this->joinPath($site->root_path, $relativePath));
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
