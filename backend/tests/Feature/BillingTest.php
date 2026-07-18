<?php

use App\Models\BillingPayment;
use App\Models\BillingPlan;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    config([
        'services.paymongo.secret_key' => 'sk_test_berrypanel',
        'services.paymongo.webhook_secret' => 'whsec_berrypanel',
        'services.paymongo.frontend_url' => 'https://capstoneprototype.online',
        'services.paymongo.webhook_tolerance' => 300,
    ]);
});

afterEach(fn () => CarbonImmutable::setTestNow());

test('a customer can view billing plans and an empty payment history', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/api/billing')
        ->assertOk()
        ->assertJsonCount(4, 'plans')
        ->assertJsonPath('plans.0.slug', 'free')
        ->assertJsonPath('plans.0.price_centavos', 0)
        ->assertJsonPath('current_plan.slug', 'free')
        ->assertJsonPath('hosting_access.laravel_sites.limit', 2)
        ->assertJsonPath('subscription', null)
        ->assertJsonCount(0, 'payments');
});

test('a customer can start a qr ph checkout for a billing plan', function () {
    Http::fake([
        'https://api.paymongo.com/v2/checkout_sessions' => Http::response([
            'data' => [
                'id' => 'cs_test_123',
                'attributes' => ['checkout_url' => 'https://checkout.paymongo.com/test-123'],
            ],
        ], 200),
    ]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/billing/checkout', ['plan' => 'starter'])
        ->assertCreated()
        ->assertJsonPath('payment.checkout_url', 'https://checkout.paymongo.com/test-123')
        ->assertJsonPath('payment.status', 'pending');

    $payment = BillingPayment::firstOrFail();
    expect($payment->user_id)->toBe($user->id)
        ->and($payment->amount_centavos)->toBe(2000)
        ->and($payment->checkout_session_id)->toBe('cs_test_123');

    Http::assertSent(fn ($request) => $request['data']['attributes']['payment_method_types'] === ['qrph']
        && $request['data']['attributes']['line_items'][0]['amount'] === 2000
        && str_contains($request['data']['attributes']['success_url'], $payment->reference_number));
});

test('a signed paid checkout webhook records payment and activates one month of service once', function () {
    $user = User::factory()->create();
    $plan = BillingPlan::where('slug', 'premium')->firstOrFail();
    $payment = BillingPayment::create([
        'user_id' => $user->id,
        'billing_plan_id' => $plan->id,
        'reference_number' => 'BP-TEST-PAID',
        'checkout_session_id' => 'cs_paid_123',
        'amount_centavos' => 4900,
        'currency' => 'PHP',
        'status' => 'pending',
    ]);

    $payload = [
        'data' => [
            'id' => 'evt_paid_123',
            'type' => 'checkout_session.payment.paid',
            'data' => [
                'id' => 'cs_paid_123',
                'attributes' => [
                    'reference_number' => 'BP-TEST-PAID',
                    'payments' => [[
                        'id' => 'pay_paid_123',
                        'attributes' => [
                            'amount' => 4900,
                            'status' => 'paid',
                            'source' => ['type' => 'qrph'],
                        ],
                    ]],
                ],
            ],
        ],
    ];
    $raw = json_encode($payload, JSON_THROW_ON_ERROR);
    $timestamp = (string) now()->timestamp;
    $signature = hash_hmac('sha256', $timestamp.'.'.$raw, 'whsec_berrypanel');
    $header = "t={$timestamp},te={$signature},li=";

    $this->call('POST', '/api/paymongo/webhook', [], [], [], [
        'CONTENT_TYPE' => 'application/json',
        'HTTP_PAYMONGO_SIGNATURE' => $header,
    ], $raw)->assertOk()->assertJsonPath('received', true);

    $subscription = $user->billingSubscription()->firstOrFail();
    expect($payment->refresh()->status)->toBe('paid')
        ->and($payment->paymongo_payment_id)->toBe('pay_paid_123')
        ->and($subscription->billing_plan_id)->toBe($plan->id)
        ->and($subscription->current_period_start->diffInDays($subscription->current_period_end))->toBeGreaterThanOrEqual(28);

    $originalEnd = $subscription->current_period_end->toIso8601String();
    $this->call('POST', '/api/paymongo/webhook', [], [], [], [
        'CONTENT_TYPE' => 'application/json',
        'HTTP_PAYMONGO_SIGNATURE' => $header,
    ], $raw)->assertOk();

    expect($subscription->refresh()->current_period_end->toIso8601String())->toBe($originalEnd);
});

test('a paid checkout webhook supports the paymongo event resource envelope', function () {
    $user = User::factory()->create();
    $plan = BillingPlan::where('slug', 'starter')->firstOrFail();
    $payment = BillingPayment::create([
        'user_id' => $user->id,
        'billing_plan_id' => $plan->id,
        'reference_number' => 'BP-TEST-EVENT-ENVELOPE',
        'checkout_session_id' => 'cs_event_envelope_123',
        'amount_centavos' => 2000,
        'currency' => 'PHP',
        'status' => 'pending',
    ]);

    $payload = [
        'data' => [
            'id' => 'evt_event_envelope_123',
            'type' => 'event',
            'attributes' => [
                'type' => 'checkout_session.payment.paid',
                'livemode' => false,
                'data' => [
                    'id' => 'cs_event_envelope_123',
                    'type' => 'checkout_session',
                    'attributes' => [
                        'reference_number' => 'BP-TEST-EVENT-ENVELOPE',
                        'payments' => [[
                            'id' => 'pay_event_envelope_123',
                            'type' => 'payment',
                            'attributes' => [
                                'amount' => 2000,
                                'status' => 'paid',
                                'source' => ['type' => 'qrph'],
                            ],
                        ]],
                    ],
                ],
            ],
        ],
    ];
    $raw = json_encode($payload, JSON_THROW_ON_ERROR);
    $timestamp = (string) now()->timestamp;
    $signature = hash_hmac('sha256', $timestamp.'.'.$raw, 'whsec_berrypanel');

    $this->call('POST', '/api/paymongo/webhook', [], [], [], [
        'CONTENT_TYPE' => 'application/json',
        'HTTP_PAYMONGO_SIGNATURE' => "t={$timestamp},te={$signature},li=",
    ], $raw)->assertOk();

    expect($payment->refresh()->status)->toBe('paid')
        ->and($payment->paymongo_payment_id)->toBe('pay_event_envelope_123')
        ->and($user->billingSubscription()->firstOrFail()->billing_plan_id)->toBe($plan->id);
});

test('a signed paid checkout event activates service when paymongo omits embedded payments', function () {
    $user = User::factory()->create();
    $plan = BillingPlan::where('slug', 'pro')->firstOrFail();
    $payment = BillingPayment::create([
        'user_id' => $user->id,
        'billing_plan_id' => $plan->id,
        'reference_number' => 'BP-TEST-MINIMAL-PAID',
        'checkout_session_id' => 'cs_minimal_paid_123',
        'amount_centavos' => 3400,
        'currency' => 'PHP',
        'status' => 'pending',
    ]);

    $payload = [
        'data' => [
            'id' => 'evt_minimal_paid_123',
            'type' => 'checkout_session.payment.paid',
            'data' => [
                'id' => 'cs_minimal_paid_123',
                'attributes' => [
                    'reference_number' => 'BP-TEST-MINIMAL-PAID',
                ],
            ],
        ],
    ];
    $raw = json_encode($payload, JSON_THROW_ON_ERROR);
    $timestamp = (string) now()->timestamp;
    $signature = hash_hmac('sha256', $timestamp.'.'.$raw, 'whsec_berrypanel');

    $this->call('POST', '/api/paymongo/webhook', [], [], [], [
        'CONTENT_TYPE' => 'application/json',
        'HTTP_PAYMONGO_SIGNATURE' => "t={$timestamp},te={$signature},li=",
    ], $raw)->assertOk();

    expect($payment->refresh()->status)->toBe('paid')
        ->and($payment->paymongo_payment_id)->toBeNull()
        ->and($payment->payment_method)->toBe('qrph')
        ->and($user->billingSubscription()->firstOrFail()->billing_plan_id)->toBe($plan->id);
});

test('paymongo webhook rejects an invalid signature', function () {
    $this->postJson('/api/paymongo/webhook', ['data' => []], [
        'Paymongo-Signature' => 't=123,te=invalid,li=',
    ])->assertUnauthorized();
});

test('an active paid plan supplies the customer storage quota', function () {
    $user = User::factory()->create();
    $plan = BillingPlan::where('slug', 'premium')->firstOrFail();
    $user->billingSubscription()->create([
        'billing_plan_id' => $plan->id,
        'status' => 'active',
        'current_period_start' => now(),
        'current_period_end' => now()->addMonth(),
        'last_payment_at' => now(),
    ]);

    $this->actingAs($user)
        ->getJson('/api/usage')
        ->assertOk()
        ->assertJsonPath('usage.quota_bytes', 5 * 1024 * 1024 * 1024)
        ->assertJsonPath('usage.plan', 'Premium');
});

test('the free plan is automatic and cannot be purchased', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/billing/checkout', ['plan' => 'free'])
        ->assertUnprocessable()
        ->assertJsonPath('message', 'The Free plan does not require payment. It applies automatically when no paid plan is active.');
});

test('a paid customer cannot downgrade before the current period ends', function () {
    $user = User::factory()->create();
    $premium = BillingPlan::where('slug', 'premium')->firstOrFail();
    $user->billingSubscription()->create([
        'billing_plan_id' => $premium->id,
        'status' => 'active',
        'current_period_start' => now(),
        'current_period_end' => now()->addMonth(),
        'last_payment_at' => now(),
    ]);

    $this->actingAs($user)
        ->postJson('/api/billing/checkout', ['plan' => 'pro'])
        ->assertUnprocessable()
        ->assertJsonPath('message', fn (string $message) => str_contains($message, 'after that period ends'));
});

test('an upgrade starts immediately and converts unused paid value into extra days', function () {
    CarbonImmutable::setTestNow('2026-07-16 12:00:00');
    $user = User::factory()->create();
    $starter = BillingPlan::where('slug', 'starter')->firstOrFail();
    $premium = BillingPlan::where('slug', 'premium')->firstOrFail();
    $user->billingSubscription()->create([
        'billing_plan_id' => $starter->id,
        'status' => 'active',
        'current_period_start' => CarbonImmutable::parse('2026-07-01 12:00:00'),
        'current_period_end' => CarbonImmutable::parse('2026-08-01 12:00:00'),
        'last_payment_at' => CarbonImmutable::parse('2026-07-01 12:00:00'),
    ]);
    BillingPayment::create([
        'user_id' => $user->id,
        'billing_plan_id' => $premium->id,
        'reference_number' => 'BP-TEST-UPGRADE',
        'checkout_session_id' => 'cs_upgrade_123',
        'amount_centavos' => 4900,
        'currency' => 'PHP',
        'status' => 'pending',
    ]);

    $payload = [
        'data' => [
            'id' => 'evt_upgrade_123',
            'type' => 'checkout_session.payment.paid',
            'data' => [
                'id' => 'cs_upgrade_123',
                'attributes' => ['reference_number' => 'BP-TEST-UPGRADE'],
            ],
        ],
    ];
    $raw = json_encode($payload, JSON_THROW_ON_ERROR);
    $timestamp = (string) now()->timestamp;
    $signature = hash_hmac('sha256', $timestamp.'.'.$raw, 'whsec_berrypanel');

    $this->call('POST', '/api/paymongo/webhook', [], [], [], [
        'CONTENT_TYPE' => 'application/json',
        'HTTP_PAYMONGO_SIGNATURE' => "t={$timestamp},te={$signature},li=",
    ], $raw)->assertOk();

    $subscription = $user->billingSubscription()->firstOrFail();
    expect($subscription->billing_plan_id)->toBe($premium->id)
        ->and($subscription->current_period_start->toIso8601String())->toBe(CarbonImmutable::now()->toIso8601String())
        ->and($subscription->current_period_end->isAfter(CarbonImmutable::now()->addMonth()))->toBeTrue()
        ->and($subscription->current_period_end->isBefore(CarbonImmutable::now()->addMonths(2)))->toBeTrue();
});
