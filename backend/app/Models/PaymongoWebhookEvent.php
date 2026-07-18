<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['event_key', 'event_type', 'processed_at'])]
class PaymongoWebhookEvent extends Model
{
    protected function casts(): array
    {
        return ['processed_at' => 'datetime'];
    }
}
