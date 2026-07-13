<?php

use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;

uses(RefreshDatabase::class);

test('a user can save site environment variables to the provisioned env file', function () {
    $usersRoot = storage_path('framework/testing/berrypanel-users');
    File::deleteDirectory($usersRoot);
    File::ensureDirectoryExists("{$usersRoot}/user_1/sites/demo-site", 0775, true);
    config(['berrypanel.users_root' => $usersRoot]);

    $user = User::factory()->create(['linux_username' => 'user_1']);
    $site = Site::create([
        'user_id' => $user->id,
        'name' => 'Demo Site',
        'slug' => 'demo-site',
        'stack' => 'Laravel / Inertia',
        'php_version' => '8.4',
        'status' => 'provisioned',
        'root_path' => "{$usersRoot}/user_1/sites/demo-site",
        'public_path' => "{$usersRoot}/user_1/sites/demo-site/public",
        'local_url' => 'demo-site.berrypanel.local',
        'repository_url' => 'https://github.com/example/demo-site',
        'repository_branch' => 'main',
    ]);

    $response = $this->actingAs($user)->putJson("/api/sites/{$site->id}/env", [
        'variables' => [
            'APP_NAME' => 'Demo Site',
            'APP_ENV' => 'production',
            'APP_DEBUG' => 'false',
            'APP_URL' => 'https://demo.example.com',
            'DB_CONNECTION' => 'mysql',
            'DB_HOST' => '127.0.0.1',
            'DB_PORT' => '3306',
            'DB_DATABASE' => 'demo_db',
            'DB_USERNAME' => 'demo_user',
            'DB_PASSWORD' => 'secret with spaces',
        ],
    ]);

    $response
        ->assertOk()
        ->assertJsonPath('site.env_variables.DB_DATABASE', 'demo_db');

    expect(File::get("{$usersRoot}/user_1/sites/demo-site/.env"))
        ->toContain('APP_URL=https://demo.example.com')
        ->toContain('DB_PASSWORD="secret with spaces"');

    expect($site->refresh()->env_variables['DB_USERNAME'])->toBe('demo_user');
});

test('saving environment values preserves the existing env file access mode', function () {
    $usersRoot = storage_path('framework/testing/berrypanel-users-env-permissions');
    $siteRoot = "{$usersRoot}/user_1/sites/demo-site";
    File::deleteDirectory($usersRoot);
    File::ensureDirectoryExists($siteRoot, 0775, true);
    File::put("{$siteRoot}/.env", "APP_NAME=Demo Site\n");
    chmod("{$siteRoot}/.env", 0640);
    config(['berrypanel.users_root' => $usersRoot]);

    $user = User::factory()->create(['linux_username' => 'user_1']);
    $site = Site::create([
        'user_id' => $user->id,
        'name' => 'Demo Site',
        'slug' => 'demo-site',
        'stack' => 'Laravel / Inertia',
        'php_version' => '8.4',
        'status' => 'provisioned',
        'root_path' => $siteRoot,
        'public_path' => "{$siteRoot}/public",
        'local_url' => 'demo-site.berrypanel.local',
        'repository_url' => 'https://github.com/example/demo-site',
        'repository_branch' => 'main',
    ]);

    $this->actingAs($user)->putJson("/api/sites/{$site->id}/env", [
        'variables' => ['APP_NAME' => 'Updated Site'],
    ])->assertOk();

    clearstatcache(true, "{$siteRoot}/.env");
    expect(fileperms("{$siteRoot}/.env") & 0777)->toBe(0640);
});

test('a user can see the app key from the server env file', function () {
    $usersRoot = storage_path('framework/testing/berrypanel-users-env-show');
    $siteRoot = "{$usersRoot}/user_1/sites/demo-site";
    File::deleteDirectory($usersRoot);
    File::ensureDirectoryExists($siteRoot, 0775, true);
    File::put("{$siteRoot}/.env", implode(PHP_EOL, [
        'APP_NAME=Demo Site',
        'APP_KEY=base64:existingGeneratedKey',
        'APP_URL=http://demo-site.berrypanel.local',
        'DB_DATABASE=demo_db',
        'DB_USERNAME=demo_user',
    ]).PHP_EOL);

    config(['berrypanel.users_root' => $usersRoot]);

    $user = User::factory()->create(['linux_username' => 'user_1']);
    $site = Site::create([
        'user_id' => $user->id,
        'name' => 'Demo Site',
        'slug' => 'demo-site',
        'stack' => 'Laravel / Inertia',
        'php_version' => '8.4',
        'status' => 'needs_configuration',
        'root_path' => $siteRoot,
        'public_path' => "{$siteRoot}/public",
        'local_url' => 'demo-site.berrypanel.local',
        'repository_url' => 'https://github.com/example/demo-site',
        'repository_branch' => 'main',
        'env_variables' => ['APP_KEY' => ''],
    ]);

    $response = $this->actingAs($user)->getJson("/api/sites/{$site->id}");

    $response
        ->assertOk()
        ->assertJsonPath('site.env_variables.APP_KEY', 'base64:existingGeneratedKey')
        ->assertJsonPath('site.env_variables.APP_URL', 'http://demo-site.berrypanel.local');
});

test('saving environment values preserves an existing app key from disk', function () {
    $usersRoot = storage_path('framework/testing/berrypanel-users-env-preserve');
    $siteRoot = "{$usersRoot}/user_1/sites/demo-site";
    File::deleteDirectory($usersRoot);
    File::ensureDirectoryExists($siteRoot, 0775, true);
    File::put("{$siteRoot}/.env", implode(PHP_EOL, [
        'APP_NAME=Demo Site',
        'APP_ENV=production',
        'APP_KEY=base64:keepThisKey',
        'APP_URL=http://demo-site.berrypanel.local',
    ]).PHP_EOL);

    config(['berrypanel.users_root' => $usersRoot]);

    $user = User::factory()->create(['linux_username' => 'user_1']);
    $site = Site::create([
        'user_id' => $user->id,
        'name' => 'Demo Site',
        'slug' => 'demo-site',
        'stack' => 'Laravel / Inertia',
        'php_version' => '8.4',
        'status' => 'needs_configuration',
        'root_path' => $siteRoot,
        'public_path' => "{$siteRoot}/public",
        'local_url' => 'demo-site.berrypanel.local',
        'repository_url' => 'https://github.com/example/demo-site',
        'repository_branch' => 'main',
    ]);

    $response = $this->actingAs($user)->putJson("/api/sites/{$site->id}/env", [
        'variables' => [
            'DB_DATABASE' => 'demo_db',
            'DB_USERNAME' => 'demo_user',
            'DB_PASSWORD' => 'secret',
        ],
    ]);

    $response
        ->assertOk()
        ->assertJsonPath('site.env_variables.APP_KEY', 'base64:keepThisKey')
        ->assertJsonPath('site.status', 'provisioned');

    expect(File::get("{$siteRoot}/.env"))
        ->toContain('APP_KEY=base64:keepThisKey')
        ->toContain('DB_DATABASE=demo_db');
});
