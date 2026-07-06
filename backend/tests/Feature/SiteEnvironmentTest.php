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
