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
}
