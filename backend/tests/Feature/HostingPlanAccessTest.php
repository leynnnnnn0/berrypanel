<?php

use App\Models\BillingPlan;
use App\Models\Site;
use App\Models\User;
use App\Services\Billing\HostingPlanAccess;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function subscribeForHostingAccessTest(User $user, string $slug): void
{
    $plan = BillingPlan::where('slug', $slug)->firstOrFail();
    $user->billingSubscription()->create([
        'billing_plan_id' => $plan->id,
        'status' => 'active',
        'current_period_start' => now(),
        'current_period_end' => now()->addMonth(),
        'last_payment_at' => now(),
    ]);
}

function siteForHostingAccessTest(User $user, string $slug, string $stack = 'Laravel / Inertia'): Site
{
    return Site::create([
        'user_id' => $user->id,
        'name' => str($slug)->headline(),
        'slug' => $slug,
        'stack' => $stack,
        'root_path' => storage_path('framework/testing/'.$slug),
        'public_path' => storage_path('framework/testing/'.$slug.'/public'),
    ]);
}

test('the four customer plans contain the configured prices and limits', function () {
    $plans = BillingPlan::query()->where('active', true)->orderBy('sort_order')->get()->keyBy('slug');

    expect($plans->keys()->all())->toBe(['free', 'starter', 'pro', 'premium'])
        ->and($plans['free']->price_centavos)->toBe(0)
        ->and($plans['free']->laravel_site_limit)->toBe(2)
        ->and($plans['starter']->price_centavos)->toBe(2000)
        ->and($plans['starter']->laravel_site_limit)->toBe(1)
        ->and($plans['starter']->background_service_site_limit)->toBe(1)
        ->and($plans['starter']->reverb_site_limit)->toBe(0)
        ->and($plans['pro']->price_centavos)->toBe(3400)
        ->and($plans['pro']->laravel_site_limit)->toBe(3)
        ->and($plans['pro']->background_service_site_limit)->toBe(2)
        ->and($plans['pro']->reverb_site_limit)->toBe(2)
        ->and($plans['premium']->price_centavos)->toBe(4900)
        ->and($plans['premium']->laravel_site_limit)->toBe(5)
        ->and($plans['premium']->hybrid_site_limit)->toBe(1);
});

test('free is the automatic fallback and allows two laravel sites only', function () {
    $user = User::factory()->create();
    $access = app(HostingPlanAccess::class);

    expect($access->summary($user)['plan']['slug'])->toBe('free')
        ->and(fn () => $access->assertCanCreateLaravelSite($user))->not->toThrow(RuntimeException::class);

    siteForHostingAccessTest($user, 'free-one');
    siteForHostingAccessTest($user, 'free-two');

    expect(fn () => $access->assertCanCreateLaravelSite($user))
        ->toThrow(RuntimeException::class, 'reached that limit')
        ->and(fn () => $access->assertCanCreateHybridSite($user))
        ->toThrow(RuntimeException::class, 'does not include Node.js + Laravel hosting')
        ->and(fn () => $access->assertCanUseBackgroundServices($user, siteForHostingAccessTest($user, 'free-three')))
        ->toThrow(RuntimeException::class, 'does not include background jobs');
});

test('starter allows jobs and scheduler on one site but not reverb', function () {
    $user = User::factory()->create();
    subscribeForHostingAccessTest($user, 'starter');
    $site = siteForHostingAccessTest($user, 'starter-site');
    $access = app(HostingPlanAccess::class);

    expect(fn () => $access->assertCanUseBackgroundServices($user, $site))
        ->not->toThrow(RuntimeException::class)
        ->and(fn () => $access->assertCanUseReverb($user, $site))
        ->toThrow(RuntimeException::class, 'requires the Pro or Premium plan');

    $site->services()->create([
        'name' => 'Background jobs',
        'type' => 'queue',
        'working_directory' => '/backend',
        'command' => 'php artisan queue:work',
        'enabled' => true,
    ]);
    $other = siteForHostingAccessTest($user, 'starter-other');

    expect(fn () => $access->assertCanUseBackgroundServices($user, $other))
        ->toThrow(RuntimeException::class, 'limit is already in use');
});

test('pro allows background services and reverb on two sites', function () {
    $user = User::factory()->create();
    subscribeForHostingAccessTest($user, 'pro');
    $access = app(HostingPlanAccess::class);

    foreach (['pro-one', 'pro-two'] as $slug) {
        $site = siteForHostingAccessTest($user, $slug);
        $site->services()->create([
            'name' => 'Realtime updates',
            'type' => 'reverb',
            'working_directory' => '/backend',
            'command' => 'php artisan reverb:start',
            'enabled' => true,
        ]);
    }

    $third = siteForHostingAccessTest($user, 'pro-three');
    $summary = $access->summary($user);

    expect($summary['background_service_sites'])->toMatchArray(['used' => 2, 'limit' => 2])
        ->and($summary['reverb_sites'])->toMatchArray(['used' => 2, 'limit' => 2])
        ->and(fn () => $access->assertCanUseBackgroundServices($user, $third))
        ->toThrow(RuntimeException::class, 'limit is already in use')
        ->and(fn () => $access->assertCanUseReverb($user, $third))
        ->toThrow(RuntimeException::class, 'limit is already in use');
});

test('only premium allows a node and laravel project', function () {
    $pro = User::factory()->create();
    subscribeForHostingAccessTest($pro, 'pro');
    $premium = User::factory()->create();
    subscribeForHostingAccessTest($premium, 'premium');
    $access = app(HostingPlanAccess::class);

    expect(fn () => $access->assertCanCreateHybridSite($pro))
        ->toThrow(RuntimeException::class, 'does not include Node.js + Laravel hosting')
        ->and(fn () => $access->assertCanCreateHybridSite($premium))
        ->not->toThrow(RuntimeException::class)
        ->and(fn () => $access->assertCanUseManagedNode($premium))
        ->not->toThrow(RuntimeException::class);
});
