<?php

use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;

uses(RefreshDatabase::class);

test('a user can view storage usage for their linux workspace', function () {
    $usersRoot = storage_path('framework/testing/berrypanel-usage-users');
    File::deleteDirectory($usersRoot);

    $siteRoot = "{$usersRoot}/user_1/sites/demo";
    File::ensureDirectoryExists("{$siteRoot}/storage/app/public", 0775, true);
    File::ensureDirectoryExists("{$siteRoot}/storage/logs", 0775, true);
    File::ensureDirectoryExists("{$siteRoot}/backups", 0775, true);
    File::ensureDirectoryExists("{$siteRoot}/app", 0775, true);

    File::put("{$siteRoot}/storage/app/public/avatar.jpg", str_repeat('u', 10));
    File::put("{$siteRoot}/storage/logs/laravel.log", str_repeat('l', 20));
    File::put("{$siteRoot}/backups/site.zip", str_repeat('b', 30));
    File::put("{$siteRoot}/app/AppServiceProvider.php", str_repeat('a', 40));

    config([
        'berrypanel.users_root' => $usersRoot,
        'berrypanel.storage_quota_gb' => 1.2,
    ]);

    $user = User::factory()->create(['linux_username' => 'user_1']);
    Site::create([
        'user_id' => $user->id,
        'name' => 'Demo',
        'slug' => 'demo',
        'stack' => 'Laravel / Inertia',
        'php_version' => '8.4',
        'status' => 'provisioned',
        'root_path' => $siteRoot,
        'public_path' => "{$siteRoot}/public",
        'local_url' => 'demo.berrypanel.local',
        'repository_url' => 'https://github.com/example/demo',
        'repository_branch' => 'main',
    ]);

    $response = $this->actingAs($user)->getJson('/api/usage');

    $response
        ->assertOk()
        ->assertJsonPath('usage.total_bytes', 100)
        ->assertJsonPath('usage.quota_bytes', 1288490189)
        ->assertJsonPath('usage.file_count', 4)
        ->assertJsonPath('usage.breakdown.uploads.bytes', 10)
        ->assertJsonPath('usage.breakdown.uploads.files', 1)
        ->assertJsonPath('usage.breakdown.logs.bytes', 20)
        ->assertJsonPath('usage.breakdown.backups.bytes', 30)
        ->assertJsonPath('usage.breakdown.application.bytes', 40)
        ->assertJsonPath('usage.sites.0.name', 'Demo')
        ->assertJsonPath('usage.sites.0.bytes', 100)
        ->assertJsonPath('usage.sites.0.files', 4)
        ->assertJsonPath('usage.sites.0.exists', true);
});

test('storage usage follows owned site paths instead of linux username workspace', function () {
    $usersRoot = storage_path('framework/testing/berrypanel-usage-mismatch');
    File::deleteDirectory($usersRoot);

    $staleWorkspace = "{$usersRoot}/nathan";
    $siteRoot = "{$usersRoot}/user_1/sites/badshot";

    File::ensureDirectoryExists($staleWorkspace, 0775, true);
    File::ensureDirectoryExists("{$siteRoot}/public", 0775, true);

    File::put("{$staleWorkspace}/wrong.txt", 'tiny');
    File::put("{$siteRoot}/public/app.js", str_repeat('a', 460));

    config([
        'berrypanel.users_root' => $usersRoot,
        'berrypanel.storage_quota_gb' => 1.2,
    ]);

    $user = User::factory()->create(['linux_username' => 'nathan']);
    Site::create([
        'user_id' => $user->id,
        'name' => 'Badshot',
        'slug' => 'badshot',
        'stack' => 'Laravel / Inertia',
        'php_version' => '8.4',
        'status' => 'provisioned',
        'root_path' => $siteRoot,
        'public_path' => "{$siteRoot}/public",
        'local_url' => 'badshot.berrypanel.local',
        'repository_url' => 'https://github.com/example/badshot',
        'repository_branch' => 'main',
    ]);

    $response = $this->actingAs($user)->getJson('/api/usage');

    $response
        ->assertOk()
        ->assertJsonPath('usage.total_bytes', 460)
        ->assertJsonPath('usage.file_count', 1)
        ->assertJsonPath('usage.sites.0.name', 'Badshot')
        ->assertJsonPath('usage.sites.0.bytes', 460);
});
