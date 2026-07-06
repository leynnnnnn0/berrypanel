<?php

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
        'berrypanel.storage_quota_gb' => 25,
    ]);

    $user = User::factory()->create(['linux_username' => 'user_1']);

    $response = $this->actingAs($user)->getJson('/api/usage');

    $response
        ->assertOk()
        ->assertJsonPath('usage.total_bytes', 100)
        ->assertJsonPath('usage.quota_bytes', 26843545600)
        ->assertJsonPath('usage.breakdown.uploads', 10)
        ->assertJsonPath('usage.breakdown.logs', 20)
        ->assertJsonPath('usage.breakdown.backups', 30)
        ->assertJsonPath('usage.breakdown.application', 40);
});
