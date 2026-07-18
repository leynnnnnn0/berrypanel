<?php

use App\Models\User;
use App\Services\SystemUserProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('it creates an isolated application user and workspace when missing', function () {
    $usersRoot = storage_path('framework/testing/system-users');
    File::deleteDirectory($usersRoot);

    config([
        'berrypanel.users_root' => $usersRoot,
        'berrypanel.system_user_provisioning_enabled' => true,
    ]);

    $user = User::factory()->create(['linux_username' => 'user_5']);
    $provisioner = new FakeSystemUserProvisioner(userExists: false);

    expect($provisioner->ensure($user))->toBeTrue()
        ->and($provisioner->commands)->toContain([
            'sudo', 'useradd', '--home-dir', $usersRoot.'/user_5', '--shell', '/bin/bash',
            '--gid', 'berrypanel', '--no-create-home', 'user_5',
        ])
        ->and($provisioner->commands)->toContain(['sudo', 'mkdir', '-p', $usersRoot.'/user_5/sites'])
        ->and($provisioner->commands)->toContain(['sudo', 'chmod', '2775', $usersRoot.'/user_5/sites']);
});

test('it does not create the linux account again when it already exists', function () {
    config([
        'berrypanel.users_root' => storage_path('framework/testing/system-users-existing'),
        'berrypanel.system_user_provisioning_enabled' => true,
    ]);

    $user = User::factory()->create(['linux_username' => 'user_8']);
    $provisioner = new FakeSystemUserProvisioner(userExists: true);

    expect($provisioner->ensure($user))->toBeFalse()
        ->and(collect($provisioner->commands)->contains(fn (array $command) => $command[1] === 'useradd'))->toBeFalse();
});

test('it assigns only a site inside the users isolated workspace', function () {
    $usersRoot = storage_path('framework/testing/system-user-ownership');
    $siteRoot = $usersRoot.'/user_12/sites/capstone';
    File::deleteDirectory($usersRoot);
    File::ensureDirectoryExists($siteRoot, 0775, true);

    config([
        'berrypanel.users_root' => $usersRoot,
        'berrypanel.system_user_provisioning_enabled' => true,
    ]);

    $user = User::factory()->create(['linux_username' => 'user_12']);
    $provisioner = new FakeSystemUserProvisioner(userExists: true);
    $provisioner->claimSite($user, $siteRoot);

    expect($provisioner->commands)->toContain(['sudo', 'chown', '-R', 'user_12:berrypanel', realpath($siteRoot)]);
});

class FakeSystemUserProvisioner extends SystemUserProvisioner
{
    public array $commands = [];

    public function __construct(private readonly bool $userExists) {}

    protected function systemUserExists(string $username): bool
    {
        return $this->userExists;
    }

    protected function run(array $command, string $failureMessage): void
    {
        $this->commands[] = $command;
    }
}
