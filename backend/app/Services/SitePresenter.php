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
            'backend_directory' => $site->backend_directory,
            'frontend_directory' => $site->frontend_directory,
            'laravel_public_directory' => $site->laravel_public_directory,
            'node_version' => $site->node_version,
            'package_manager' => $site->package_manager,
            'node_install_command' => $site->node_install_command,
            'node_build_command' => $site->node_build_command,
            'node_start_command' => $site->node_start_command,
            'node_port' => $site->node_port,
            'domain' => $site->domain,
            'ssl_enabled' => $site->ssl_enabled,
            'migrate_on_deploy' => $site->migrate_on_deploy,
            'build_on_deploy' => $site->build_on_deploy,
            'restart_services_on_deploy' => $site->restart_services_on_deploy,
            'health_check_url' => $site->health_check_url,
            'deployment_timeout' => $site->deployment_timeout,
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
