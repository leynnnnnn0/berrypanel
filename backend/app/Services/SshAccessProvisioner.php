<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\File;
use RuntimeException;
use Symfony\Component\Process\Process;

class SshAccessProvisioner
{
    public function __construct(private readonly SystemUserProvisioner $systemUsers) {}

    public function provision(User $user, string $publicKey): void
    {
        if (! (bool) config('berrypanel.ssh_provisioning_enabled')) {
            return;
        }

        $username = $this->username($user);
        $this->systemUsers->ensure($user);
        $usersRoot = (string) config('berrypanel.users_root');
        $homePath = $this->joinPath($usersRoot, $username);
        $sitesPath = $this->joinPath($homePath, 'sites');
        $sshPath = $this->joinPath($homePath, '.ssh');
        $authorizedKeysPath = $this->joinPath($sshPath, 'authorized_keys');

        File::ensureDirectoryExists(storage_path('app/berrypanel/ssh'), 0775, true);
        $temporaryKeyPath = storage_path("app/berrypanel/ssh/{$username}_authorized_keys");
        File::put($temporaryKeyPath, trim($publicKey).PHP_EOL);

        $this->run(['sudo', 'mkdir', '-p', $sitesPath, $sshPath], 'Unable to create SSH workspace folders');
        $this->run(['sudo', 'cp', $temporaryKeyPath, $authorizedKeysPath], 'Unable to install SSH authorized key');
        $this->run(['sudo', 'chown', '-R', "{$username}:berrypanel", $homePath], 'Unable to set SSH workspace ownership');
        $this->run(['sudo', 'chmod', '755', $homePath], 'Unable to set SSH home permissions');
        $this->run(['sudo', 'chmod', '2775', $sitesPath], 'Unable to set SSH sites permissions');
        $this->run(['sudo', 'chmod', '700', $sshPath], 'Unable to secure SSH folder permissions');
        $this->run(['sudo', 'chmod', '600', $authorizedKeysPath], 'Unable to secure authorized_keys permissions');
    }

    public function disable(User $user): void
    {
        if (! (bool) config('berrypanel.ssh_provisioning_enabled')) {
            return;
        }

        $username = $this->username($user);
        $authorizedKeysPath = $this->joinPath(
            $this->joinPath($this->joinPath((string) config('berrypanel.users_root'), $username), '.ssh'),
            'authorized_keys',
        );

        $this->run(['sudo', 'unlink', $authorizedKeysPath], 'Unable to disable SSH key', allowFailure: true);
    }

    private function username(User $user): string
    {
        $username = $user->linux_username;

        if (! is_string($username) || ! preg_match('/^[a-z][a-z0-9_-]{2,31}$/', $username)) {
            throw new RuntimeException('This account does not have a valid Linux username.');
        }

        return $username;
    }

    private function joinPath(string $left, string $right): string
    {
        return rtrim($left, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.ltrim($right, DIRECTORY_SEPARATOR);
    }

    private function run(array $command, string $failureMessage, bool $allowFailure = false): void
    {
        $process = new Process($command);
        $process->setTimeout(60);
        $process->run();

        if (! $process->isSuccessful() && ! $allowFailure) {
            $error = trim($process->getErrorOutput()) ?: trim($process->getOutput());

            throw new RuntimeException(
                $failureMessage.'. Give the BerryPanel backend user passwordless sudo for useradd, usermod, mkdir, cp, chown, chmod, and unlink. '
                .($error !== '' ? "Command output: {$error}" : ''),
            );
        }
    }
}
