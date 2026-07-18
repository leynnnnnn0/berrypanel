<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateBillingCheckoutRequest;
use App\Models\BillingPlan;
use App\Services\Billing\BillingManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class BillingController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->billingPayments()
            ->where('status', 'pending')
            ->where('created_at', '<=', now()->subMinutes(30))
            ->update(['status' => 'expired']);
        $subscription = $user->billingSubscription()->with('plan')->first();
        $periodEnd = $subscription?->current_period_end;
        $active = $subscription !== null && $subscription->status === 'active' && $periodEnd?->isFuture();
        $daysRemaining = $active ? max(0, now()->startOfDay()->diffInDays($periodEnd->copy()->startOfDay(), false)) : null;

        return response()->json([
            'plans' => BillingPlan::query()->where('active', true)->orderBy('sort_order')->get()->map(fn (BillingPlan $plan) => $this->plan($plan)),
            'subscription' => $subscription ? [
                'status' => $active ? 'active' : 'expired',
                'plan' => $this->plan($subscription->plan),
                'current_period_start' => $subscription->current_period_start?->toIso8601String(),
                'current_period_end' => $periodEnd?->toIso8601String(),
                'days_remaining' => $daysRemaining,
                'renewal_due' => ! $active || $daysRemaining <= 7,
            ] : null,
            'payments' => $user->billingPayments()
                ->with('plan')
                ->latest()
                ->limit(20)
                ->get()
                ->map(fn ($payment) => [
                    'id' => $payment->id,
                    'reference_number' => $payment->reference_number,
                    'plan_name' => $payment->plan->name,
                    'amount_centavos' => $payment->amount_centavos,
                    'currency' => $payment->currency,
                    'status' => $payment->status,
                    'payment_method' => $payment->payment_method,
                    'paid_at' => $payment->paid_at?->toIso8601String(),
                    'created_at' => $payment->created_at?->toIso8601String(),
                ]),
        ]);
    }

    public function checkout(CreateBillingCheckoutRequest $request, BillingManager $billing): JsonResponse
    {
        $plan = BillingPlan::where('slug', $request->validated('plan'))->where('active', true)->firstOrFail();
        try {
            $payment = $billing->createCheckout($request->user(), $plan);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'payment' => [
                'reference_number' => $payment->reference_number,
                'checkout_url' => $payment->checkout_url,
                'status' => $payment->status,
            ],
        ], 201);
    }

    private function plan(BillingPlan $plan): array
    {
        return [
            'slug' => $plan->slug,
            'name' => $plan->name,
            'description' => $plan->description,
            'price_centavos' => $plan->price_centavos,
            'billing_months' => $plan->billing_months,
            'storage_bytes' => $plan->storage_bytes,
            'laravel_site_limit' => $plan->laravel_site_limit,
            'hybrid_site_limit' => $plan->hybrid_site_limit,
            'background_services' => $plan->background_services,
            'features' => $plan->features,
        ];
    }
}
