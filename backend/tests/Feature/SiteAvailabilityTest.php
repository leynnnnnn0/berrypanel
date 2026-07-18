<?php

use App\Models\Site;
use App\Models\User;
use App\Services\SiteAvailabilityChecker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

function availabilitySite(array $attributes = []): Site
{
    $user = User::factory()->create();

    return Site::create([
        'user_id' => $user->id,
        'name' => 'Customer Portal',
        'slug' => 'customer-portal',
        'stack' => 'Laravel / Inertia',
        'php_version' => '8.4',
        'status' => 'provisioned',
        'root_path' => '/tmp/customer-portal',
        'public_path' => '/tmp/customer-portal/public',
        'local_url' => 'customer-portal.example.test',
        'domain' => 'customer-portal.example.test',
        ...$attributes,
    ]);
}

test('a successful response marks a hosted site online', function () {
    config(['berrypanel.site_url_scheme' => 'https']);
    Http::fake([
        'https://customer-portal.example.test' => Http::response('OK', 200),
    ]);

    $site = app(SiteAvailabilityChecker::class)->check(availabilitySite());

    expect($site->availability_status)->toBe('online')
        ->and($site->availability_http_status)->toBe(200)
        ->and($site->availability_response_ms)->toBeGreaterThanOrEqual(1)
        ->and($site->availability_checked_at)->not->toBeNull()
        ->and($site->availability_error)->toBeNull();
});

test('redirects and failed responses remain distinct availability results', function (int $code, string $expected) {
    config(['berrypanel.site_url_scheme' => 'http']);
    Http::fake([
        'http://customer-portal.example.test' => Http::response('', $code),
    ]);

    $site = app(SiteAvailabilityChecker::class)->check(availabilitySite());

    expect($site->availability_status)->toBe($expected)
        ->and($site->availability_http_status)->toBe($code);
})->with([
    'redirect' => [302, 'redirected'],
    'server error' => [503, 'offline'],
]);

test('an unrelated health check host is not requested', function () {
    Http::preventStrayRequests();
    $site = availabilitySite(['health_check_url' => 'http://127.0.0.1/private']);

    $site = app(SiteAvailabilityChecker::class)->check($site);

    expect($site->availability_status)->toBe('unknown')
        ->and($site->availability_http_status)->toBeNull()
        ->and($site->availability_error)->toContain('does not match');

    Http::assertNothingSent();
});

test('site responses expose availability without replacing deployment status', function () {
    $site = availabilitySite([
        'status' => 'failed',
        'availability_status' => 'online',
        'availability_http_status' => 200,
        'availability_response_ms' => 84,
        'availability_checked_at' => now(),
    ]);

    $this->actingAs($site->user)
        ->getJson('/api/sites')
        ->assertOk()
        ->assertJsonPath('sites.0.status', 'failed')
        ->assertJsonPath('sites.0.availability.status', 'online')
        ->assertJsonPath('sites.0.availability.http_status', 200)
        ->assertJsonPath('sites.0.availability.response_ms', 84);
});

test('the scheduled availability command checks hosted sites', function () {
    config(['berrypanel.site_url_scheme' => 'https']);
    Http::fake([
        'https://customer-portal.example.test' => Http::response('OK', 200),
    ]);
    $site = availabilitySite();

    $this->artisan('berrypanel:sites:check-availability', ['site' => $site->slug])
        ->expectsOutputToContain('ONLINE customer-portal: HTTP 200')
        ->assertSuccessful();

    expect($site->fresh()->availability_status)->toBe('online');
});
