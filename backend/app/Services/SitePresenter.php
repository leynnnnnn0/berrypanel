<?php

namespace App\Services;

use App\Models\Site;

class SitePresenter
{
    public function __construct(private readonly SiteEnvironmentService $environment) {}

    public function toArray(Site $site, bool $includeEnvironment = false): array
    {
        $payload = [
            'id' => $site->id,
            'name' => $site->name,
            'slug' => $site->slug,
            'stack' => $site->stack,
            'php_version' => $site->php_version,
            'status' => $site->status,
            'root_path' => $site->root_path,
            'public_path' => $site->public_path,
            'local_url' => $site->local_url,
            'repository_url' => $site->repository_url,
            'repository_branch' => $site->repository_branch,
            'deployment_warnings' => $site->deployment_warnings ?: [],
            'created_at' => $site->created_at?->toISOString(),
            'updated_at' => $site->updated_at?->toISOString(),
        ];

        if ($includeEnvironment) {
            $payload['env_variables'] = $this->environment->forSite($site);
        }

        return $payload;
    }
}
