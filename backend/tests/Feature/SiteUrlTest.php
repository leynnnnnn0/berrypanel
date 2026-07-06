<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;

uses(RefreshDatabase::class);

test('new site local url uses the configured server ip through nip io', function () {
    $usersRoot = storage_path('framework/testing/berrypanel-url-users');
    File::deleteDirectory($usersRoot);
    File::ensureDirectoryExists($usersRoot, 0775, true);

    config([
        'berrypanel.users_root' => $usersRoot,
        'berrypanel.server_ip' => '192.168.254.113',
        'berrypanel.site_domain_suffix' => '',
    ]);

    $user = User::factory()->create(['linux_username' => 'user_1']);

    $response = $this->actingAs($user)->postJson('/api/sites', [
        'name' => 'Test Website',
        'repository_url' => 'https://github.com/example/test-website',
        'repository_branch' => 'main',
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('site.slug', 'test-website')
        ->assertJsonPath('site.local_url', 'test-website.192.168.254.113.nip.io');
});

test('new site local url can use a custom wildcard domain suffix', function () {
    $usersRoot = storage_path('framework/testing/berrypanel-custom-domain-users');
    File::deleteDirectory($usersRoot);
    File::ensureDirectoryExists($usersRoot, 0775, true);

    config([
        'berrypanel.users_root' => $usersRoot,
        'berrypanel.server_ip' => '192.168.254.113',
        'berrypanel.site_domain_suffix' => 'apps.berrypanel.test',
    ]);

    $user = User::factory()->create(['linux_username' => 'user_2']);

    $response = $this->actingAs($user)->postJson('/api/sites', [
        'name' => 'Client Portal',
        'repository_url' => 'https://github.com/example/client-portal',
        'repository_branch' => 'main',
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('site.local_url', 'client-portal.apps.berrypanel.test');
});
