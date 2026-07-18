<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id', 'billing_plan_id', 'billing_subscription_id', 'reference_number', 'checkout_session_id',
    'paymongo_payment_id', 'amount_centavos', 'currency', 'status', 'checkout_url', 'payment_method', 'paid_at',
])]
class BillingPayment extends Model
{
    protected function casts(): array
    {
        return [
            'amount_centavos' => 'integer',
            'paid_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(BillingPlan::class, 'billing_plan_id');
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(BillingSubscription::class, 'billing_subscription_id');
    }
}
