<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'name',
    'slug',
    'stack',
    'php_version',
    'status',
    'root_path',
    'public_path',
    'local_url',
    'repository_url',
    'repository_branch',
    'backend_directory', 'frontend_directory', 'laravel_public_directory',
    'node_version', 'package_manager', 'node_install_command', 'node_build_command', 'node_start_command', 'node_port', 'reverb_port',
    'domain', 'ssl_enabled', 'migrate_on_deploy', 'build_on_deploy', 'restart_services_on_deploy',
    'health_check_url', 'deployment_timeout', 'current_commit',
    'availability_status', 'availability_http_status', 'availability_response_ms',
    'availability_checked_at', 'availability_error',
    'env_variables',
    'deployment_warnings',
])]
class Site extends Model
{
    protected function casts(): array
    {
        return [
            'env_variables' => 'encrypted:array',
            'deployment_warnings' => 'array',
            'ssl_enabled' => 'boolean', 'migrate_on_deploy' => 'boolean', 'build_on_deploy' => 'boolean',
            'restart_services_on_deploy' => 'boolean',
            'availability_http_status' => 'integer',
            'availability_response_ms' => 'integer',
            'availability_checked_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function hostingDatabases(): HasMany
    {
        return $this->hasMany(HostingDatabase::class);
    }

    public function deployments(): HasMany
    {
        return $this->hasMany(Deployment::class);
    }

    public function services(): HasMany
    {
        return $this->hasMany(SiteService::class);
    }

    public function environments(): HasMany
    {
        return $this->hasMany(SiteEnvironment::class);
    }

    public function customDomains(): HasMany
    {
        return $this->hasMany(CustomDomain::class);
    }
}
