<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'slug', 'name', 'description', 'price_centavos', 'billing_months', 'storage_bytes',
    'laravel_site_limit', 'hybrid_site_limit', 'background_service_site_limit', 'reverb_site_limit',
    'background_services', 'features', 'active', 'sort_order',
])]
class BillingPlan extends Model
{
    protected function casts(): array
    {
        return [
            'price_centavos' => 'integer',
            'billing_months' => 'integer',
            'storage_bytes' => 'integer',
            'laravel_site_limit' => 'integer',
            'hybrid_site_limit' => 'integer',
            'background_service_site_limit' => 'integer',
            'reverb_site_limit' => 'integer',
            'background_services' => 'boolean',
            'features' => 'array',
            'active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(BillingSubscription::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(BillingPayment::class);
    }
}
