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
            'local_url' => $site->local_url,
            'repository_url' => $site->repository_url,
            'repository_branch' => $site->repository_branch,
            'domain' => $site->domain,
            'ssl_enabled' => $site->ssl_enabled,
            'migrate_on_deploy' => $site->migrate_on_deploy,
            'build_on_deploy' => $site->build_on_deploy,
            'restart_services_on_deploy' => $site->restart_services_on_deploy,
            'health_check_url' => $site->health_check_url,
            'current_commit' => $site->current_commit,
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
