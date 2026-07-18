<?php

use App\Models\Site;
use App\Models\User;
use App\Services\SiteEnvironmentFileStore;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('isolated environment updates run as the site user and remain private', function () {
    $usersRoot = storage_path('framework/testing/isolated-env-store');
    $siteRoot = "{$usersRoot}/user_5/sites/printing";
    File::deleteDirectory($usersRoot);
    File::ensureDirectoryExists($siteRoot, 0775, true);

    config([
        'berrypanel.users_root' => $usersRoot,
        'berrypanel.system_user_provisioning_enabled' => true,
        'berrypanel.php_fpm_user' => 'www-data',
    ]);

    $user = User::factory()->create(['linux_username' => 'user_5']);
    $site = Site::create([
        'user_id' => $user->id,
        'name' => 'Printing',
        'slug' => 'printing',
        'stack' => 'Laravel / Inertia',
        'php_version' => '8.4',
        'status' => 'provisioned',
        'root_path' => $siteRoot,
        'public_path' => "{$siteRoot}/public",
        'local_url' => 'printing.example.test',
        'repository_url' => 'https://github.com/example/printing',
        'repository_branch' => 'main',
    ]);

    $store = new class extends SiteEnvironmentFileStore
    {
        public array $commands = [];

        protected function runAsSiteUser(Site $site, array $command, ?string $input = null, bool $captureOutput = false): string
        {
            $this->commands[] = [$site->user->linux_username, $command];
            $path = end($command);

            match ($command[0]) {
                'tee' => File::put($path, $input ?? ''),
                'chmod' => chmod($path, octdec($command[1])),
                'setfacl' => null,
                'mv' => rename($command[2], $command[3]),
                'rm' => File::delete($path),
                default => null,
            };

            return $captureOutput && $command[0] === 'cat' ? (string) File::get($path) : '';
        }
    };

    $store->write($site, "APP_NAME=Printing\nAPP_KEY=secret\n");

    expect(File::get("{$siteRoot}/.env"))->toContain('APP_KEY=secret')
        ->and(fileperms("{$siteRoot}/.env") & 0777)->toBe(0600)
        ->and($store->commands)->toHaveCount(4)
        ->and($store->commands[0][0])->toBe('user_5')
        ->and($store->commands[0][1][0])->toBe('tee')
        ->and($store->commands[2][1])->toContain('u:www-data:r--')
        ->and($store->commands[3][1][0])->toBe('mv')
        ->and($store->read($site))->toContain('APP_NAME=Printing');
});

test('environment access refuses a site path belonging to another account', function () {
    $usersRoot = storage_path('framework/testing/isolated-env-store-traversal');
    $siteRoot = "{$usersRoot}/user_9/sites/other-site";
    File::deleteDirectory($usersRoot);
    File::ensureDirectoryExists($siteRoot, 0775, true);

    config([
        'berrypanel.users_root' => $usersRoot,
        'berrypanel.system_user_provisioning_enabled' => true,
    ]);

    $user = User::factory()->create(['linux_username' => 'user_5']);
    $site = Site::create([
        'user_id' => $user->id,
        'name' => 'Other Site',
        'slug' => 'other-site',
        'stack' => 'Laravel / Inertia',
        'php_version' => '8.4',
        'status' => 'provisioned',
        'root_path' => $siteRoot,
        'public_path' => "{$siteRoot}/public",
        'local_url' => 'other.example.test',
        'repository_url' => 'https://github.com/example/other',
        'repository_branch' => 'main',
    ]);

    expect(fn () => app(SiteEnvironmentFileStore::class)->write($site, "APP_NAME=Nope\n"))
        ->toThrow(RuntimeException::class, 'outside this account’s workspace');
});
