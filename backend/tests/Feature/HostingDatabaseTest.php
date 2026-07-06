<?php

use App\Models\HostingDatabase;
use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('a user can create a prefixed mysql database and user', function () {
    config(['berrypanel.database_provisioning_enabled' => false]);

    $user = User::factory()->create(['linux_username' => 'demo']);
    $site = Site::create([
        'user_id' => $user->id,
        'name' => 'Client Portal',
        'slug' => 'client-portal',
        'stack' => 'Laravel / Inertia',
        'php_version' => '8.4',
        'status' => 'provisioned',
        'root_path' => '/tmp/berrypanel/demo/sites/client-portal',
        'public_path' => '/tmp/berrypanel/demo/sites/client-portal/public',
        'local_url' => 'client-portal.192.168.254.113.nip.io',
        'repository_url' => 'https://github.com/example/client-portal',
        'repository_branch' => 'main',
    ]);

    $response = $this->actingAs($user)->postJson('/api/databases', [
        'database_suffix' => 'client_portal',
        'username_suffix' => 'client_user',
        'password' => 'secret-password',
        'site_id' => $site->id,
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('database.name', 'demo_client_portal')
        ->assertJsonPath('database.username', 'demo_client_user')
        ->assertJsonPath('database.site.local_url', 'client-portal.192.168.254.113.nip.io');

    expect(HostingDatabase::first()->password)->toBe('secret-password');
});

test('a user cannot create duplicate database names', function () {
    config(['berrypanel.database_provisioning_enabled' => false]);

    $user = User::factory()->create(['linux_username' => 'demo']);

    HostingDatabase::create([
        'user_id' => $user->id,
        'name' => 'demo_app',
        'username' => 'demo_app',
        'password' => 'secret-password',
        'driver' => 'mysql',
        'host' => '127.0.0.1',
        'port' => 3306,
        'status' => 'provisioned',
    ]);

    $response = $this->actingAs($user)->postJson('/api/databases', [
        'database_suffix' => 'app',
        'username_suffix' => 'other_user',
        'password' => 'secret-password',
    ]);

    $response
        ->assertStatus(422)
        ->assertJsonPath('message', 'You already have a database with this name.');
});
