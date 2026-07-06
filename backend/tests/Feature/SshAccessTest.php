<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('a user can save a public key for ssh access', function () {
    config([
        'berrypanel.ssh_provisioning_enabled' => false,
        'berrypanel.ssh_host' => '192.168.254.113',
        'berrypanel.ssh_port' => 22,
    ]);

    $user = User::factory()->create(['linux_username' => null]);
    $publicKey = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFakeKeyForBerryPanelTestingOnly user@example.com';

    $this->actingAs($user)
        ->getJson('/api/ssh-access')
        ->assertOk()
        ->assertJsonPath('ssh.host', '192.168.254.113')
        ->assertJsonPath('ssh.enabled', false);

    $this->actingAs($user)
        ->putJson('/api/ssh-access', ['public_key' => $publicKey])
        ->assertOk()
        ->assertJsonPath('ssh.username', 'user_'.$user->id)
        ->assertJsonPath('ssh.enabled', true)
        ->assertJsonPath('ssh.public_key', $publicKey);

    expect($user->refresh()->linux_username)->toBe('user_'.$user->id);
});

test('ssh access requires a valid public key', function () {
    $user = User::factory()->create(['linux_username' => 'user_10']);

    $this->actingAs($user)
        ->putJson('/api/ssh-access', ['public_key' => 'not a public key'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('public_key');
});
