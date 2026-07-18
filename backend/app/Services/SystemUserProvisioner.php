<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\File;
use RuntimeException;
use Symfony\Component\Process\Process;

class SystemUserProvisioner
{
    public function ensure(User $user): bool
    {
        $username = $this->username($user);
        $homePath = $this->homePath($username);
        $sitesPath = $this->joinPath($homePath, 'sites');

        if (! config('berrypanel.system_user_provisioning_enabled')) {
            File::ensureDirectoryExists($sitesPath, 0775, true);

            return false;
        }

        $created = ! $this->systemUserExists($username);

        if ($created) {
            $this->run([
                'sudo',
                'useradd',
                '--home-dir',
                $homePath,
                '--shell',
                '/bin/bash',
                '--gid',
                'berrypanel',
                '--no-create-home',
                $username,
            ], 'Unable to create the isolated application user');
        }

        $this->run(['sudo', 'usermod', '-aG', 'berrypanel', $username], 'Unable to attach the application user to BerryPanel');
        $this->run(['sudo', 'mkdir', '-p', $sitesPath], 'Unable to create the application workspace');
        $this->run(['sudo', 'chown', "{$username}:berrypanel", $homePath, $sitesPath], 'Unable to assign the application workspace');
        $this->run(['sudo', 'chmod', '755', $homePath], 'Unable to secure the application workspace');
        $this->run(['sudo', 'chmod', '2775', $sitesPath], 'Unable to prepare the sites directory');

        return $created;
    }

    public function claimSite(User $user, string $sitePath): void
    {
        if (! config('berrypanel.system_user_provisioning_enabled')) {
            return;
        }

        $username = $this->username($user);
        $sitePath = $this->validatedSitePath($username, $sitePath);

        if (! File::isDirectory($sitePath)) {
            return;
        }

        $this->run(['sudo', 'chown', '-R', "{$username}:berrypanel", $sitePath], 'Unable to assign the site workspace');
        $this->run(['sudo', 'chmod', '2775', $sitePath], 'Unable to prepare the site workspace');
    }

    private function username(User $user): string
    {
        if (! $user->linux_username) {
            $user->forceFill(['linux_username' => 'user_'.$user->id])->save();
        }

        $username = (string) $user->linux_username;

        if (! preg_match('/^[a-z][a-z0-9_-]{2,31}$/', $username)) {
            throw new RuntimeException('This account does not have a valid application username.');
        }

        return $username;
    }

    private function validatedSitePath(string $username, string $sitePath): string
    {
        $homePath = realpath($this->homePath($username));
        $resolvedSitePath = realpath($sitePath);

        if (! $homePath || ! $resolvedSitePath || ! str_starts_with($resolvedSitePath, $homePath.DIRECTORY_SEPARATOR.'sites'.DIRECTORY_SEPARATOR)) {
            throw new RuntimeException('The site folder is outside this account’s isolated workspace.');
        }

        return $resolvedSitePath;
    }

    private function homePath(string $username): string
    {
        return $this->joinPath((string) config('berrypanel.users_root'), $username);
    }

    private function joinPath(string $left, string $right): string
    {
        return rtrim($left, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.ltrim($right, DIRECTORY_SEPARATOR);
    }

    protected function systemUserExists(string $username): bool
    {
        $process = new Process(['id', '-u', $username]);
        $process->run();

        return $process->isSuccessful();
    }

    protected function run(array $command, string $failureMessage): void
    {
        $process = new Process($command);
        $process->setTimeout(60);
        $process->run();

        if (! $process->isSuccessful()) {
            $error = trim($process->getErrorOutput()) ?: trim($process->getOutput());

            throw new RuntimeException(
                $failureMessage.'. Verify BerryPanel can manage isolated application users.'
                .($error !== '' ? " Command output: {$error}" : ''),
            );
        }
    }
}
