<?php

use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('a user can clear resolved site deployment warnings', function () {
    $user = User::factory()->create(['linux_username' => 'user_1']);
    $site = Site::create([
        'user_id' => $user->id,
        'name' => 'Badshot',
        'slug' => 'badshot',
        'stack' => 'Laravel / Inertia',
        'php_version' => '8.4',
        'status' => 'needs_configuration',
        'root_path' => '/srv/berrypanel/users/user_1/sites/badshot',
        'public_path' => '/srv/berrypanel/users/user_1/sites/badshot/public',
        'local_url' => 'badshot.192.168.254.113.nip.io',
        'repository_url' => 'https://github.com/example/badshot',
        'repository_branch' => 'main',
        'deployment_warnings' => ['Frontend build failed. Command output: sh: 1: vite: not found'],
    ]);

    $response = $this->actingAs($user)->deleteJson("/api/sites/{$site->id}/deployment-warnings");

    $response
        ->assertOk()
        ->assertJsonPath('site.deployment_warnings', [])
        ->assertJsonPath('site.status', 'needs_configuration');

    expect($site->refresh()->deployment_warnings)->toBe([])
        ->and($site->status)->toBe('needs_configuration');
});

test('a user cannot clear another users site deployment warnings', function () {
    $owner = User::factory()->create(['linux_username' => 'user_1']);
    $otherUser = User::factory()->create(['linux_username' => 'user_2']);
    $site = Site::create([
        'user_id' => $owner->id,
        'name' => 'Badshot',
        'slug' => 'badshot',
        'stack' => 'Laravel / Inertia',
        'php_version' => '8.4',
        'status' => 'needs_configuration',
        'root_path' => '/srv/berrypanel/users/user_1/sites/badshot',
        'public_path' => '/srv/berrypanel/users/user_1/sites/badshot/public',
        'local_url' => 'badshot.192.168.254.113.nip.io',
        'repository_url' => 'https://github.com/example/badshot',
        'repository_branch' => 'main',
        'deployment_warnings' => ['Frontend build failed.'],
    ]);

    $this->actingAs($otherUser)
        ->deleteJson("/api/sites/{$site->id}/deployment-warnings")
        ->assertNotFound();

    expect($site->refresh()->deployment_warnings)->toBe(['Frontend build failed.']);
});
