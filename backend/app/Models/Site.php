<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
])]
class Site extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
