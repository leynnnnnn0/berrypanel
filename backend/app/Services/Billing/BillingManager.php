<?php

namespace App\Services\Billing;

use App\Models\BillingPayment;
use App\Models\BillingPlan;
use App\Models\BillingSubscription;
use App\Models\PaymongoWebhookEvent;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class BillingManager
{
    public function __construct(private readonly PaymongoClient $paymongo) {}

    public function createCheckout(User $user, BillingPlan $plan): BillingPayment
    {
        $payment = BillingPayment::create([
            'user_id' => $user->id,
            'billing_plan_id' => $plan->id,
            'reference_number' => 'BP-'.$user->id.'-'.strtoupper((string) Str::ulid()),
            'amount_centavos' => $plan->price_centavos,
            'currency' => 'PHP',
            'status' => 'pending',
        ]);
        $payment->setRelation('plan', $plan);

        try {
            $checkout = $this->paymongo->createQrCheckout($payment);
        } catch (RuntimeException $exception) {
            $payment->update(['status' => 'failed']);
            throw $exception;
        }

        $payment->update([
            'checkout_session_id' => $checkout['id'],
            'checkout_url' => $checkout['checkout_url'],
        ]);

        return $payment->refresh();
    }

    public function processPaidCheckout(array $payload, string $rawPayload): void
    {
        $event = $payload['data'] ?? null;
        if (! is_array($event)) {
            throw new RuntimeException('PayMongo webhook data is missing.');
        }

        $eventType = $event['type'] ?? data_get($event, 'attributes.type');
        if ($eventType !== 'checkout_session.payment.paid') {
            return;
        }

        $session = $event['data'] ?? data_get($event, 'attributes.data');
        if (! is_array($session)) {
            throw new RuntimeException('PayMongo checkout session is missing.');
        }

        $attributes = $session['attributes'] ?? [];
        $reference = $attributes['reference_number'] ?? null;
        $sessionId = $session['id'] ?? null;
        $paidPayment = collect($attributes['payments'] ?? [])->first(
            fn ($item) => data_get($item, 'attributes.status') === 'paid'
        );

        if (! is_string($reference) || ! is_string($sessionId) || ! is_array($paidPayment)) {
            throw new RuntimeException('PayMongo payment details are incomplete.');
        }

        $eventKey = (string) ($event['id'] ?? hash('sha256', $rawPayload));

        DB::transaction(function () use ($eventKey, $eventType, $reference, $sessionId, $paidPayment): void {
            if (PaymongoWebhookEvent::where('event_key', $eventKey)->exists()) {
                return;
            }

            $payment = BillingPayment::query()
                ->with('plan')
                ->where('reference_number', $reference)
                ->lockForUpdate()
                ->firstOrFail();

            if ($payment->checkout_session_id !== $sessionId) {
                throw new RuntimeException('PayMongo checkout session does not match the pending payment.');
            }

            $paidAttributes = $paidPayment['attributes'] ?? [];
            if ((int) ($paidAttributes['amount'] ?? 0) !== $payment->amount_centavos) {
                throw new RuntimeException('PayMongo payment amount does not match the selected plan.');
            }

            if ($payment->status !== 'paid') {
                $subscription = $this->activateSubscription($payment);
                $payment->update([
                    'billing_subscription_id' => $subscription->id,
                    'paymongo_payment_id' => $paidPayment['id'] ?? null,
                    'status' => 'paid',
                    'checkout_url' => null,
                    'payment_method' => data_get($paidAttributes, 'source.type', 'qrph'),
                    'paid_at' => now(),
                ]);
            }

            PaymongoWebhookEvent::create([
                'event_key' => $eventKey,
                'event_type' => $eventType,
                'processed_at' => now(),
            ]);
        });
    }

    private function activateSubscription(BillingPayment $payment): BillingSubscription
    {
        $subscription = BillingSubscription::where('user_id', $payment->user_id)->lockForUpdate()->first();
        $now = CarbonImmutable::now();
        $samePlan = $subscription?->billing_plan_id === $payment->billing_plan_id;
        $currentEnd = $subscription?->current_period_end?->toImmutable();
        $periodStart = $samePlan && $currentEnd?->isFuture() ? $currentEnd : $now;
        $periodEnd = $periodStart->addMonthsNoOverflow($payment->plan->billing_months);

        return BillingSubscription::updateOrCreate(
            ['user_id' => $payment->user_id],
            [
                'billing_plan_id' => $payment->billing_plan_id,
                'status' => 'active',
                'current_period_start' => $periodStart,
                'current_period_end' => $periodEnd,
                'last_payment_at' => $now,
            ],
        );
    }
}
