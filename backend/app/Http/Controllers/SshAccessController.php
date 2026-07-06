<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\SshAccessProvisioner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class SshAccessController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json(['ssh' => $this->serialize($request->user())]);
    }

    public function update(Request $request, SshAccessProvisioner $provisioner): JsonResponse
    {
        $validated = $request->validate([
            'public_key' => [
                'required',
                'string',
                'max:2000',
                'regex:/^(ssh-ed25519|ssh-rsa|ecdsa-sha2-nistp256|ecdsa-sha2-nistp384|ecdsa-sha2-nistp521) [A-Za-z0-9+\/=]+(?: .*)?$/',
            ],
        ], [
            'public_key.regex' => 'Paste a valid SSH public key that starts with ssh-ed25519, ssh-rsa, or ecdsa-sha2.',
        ]);

        /** @var User $user */
        $user = $request->user();

        if (! $user->linux_username) {
            $user->forceFill(['linux_username' => 'user_'.$user->id])->save();
        }

        try {
            $provisioner->provision($user, $validated['public_key']);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        $user->forceFill([
            'ssh_public_key' => trim($validated['public_key']),
            'ssh_enabled' => true,
        ])->save();

        return response()->json(['ssh' => $this->serialize($user->refresh())]);
    }

    public function destroy(Request $request, SshAccessProvisioner $provisioner): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        try {
            $provisioner->disable($user);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        $user->forceFill([
            'ssh_public_key' => null,
            'ssh_enabled' => false,
        ])->save();

        return response()->json(['ssh' => $this->serialize($user->refresh())]);
    }

    private function serialize(User $user): array
    {
        $host = (string) config('berrypanel.ssh_host');

        if ($host === '') {
            $host = (string) config('berrypanel.server_ip') ?: 'your-server';
        }

        return [
            'host' => $host,
            'port' => (int) config('berrypanel.ssh_port'),
            'username' => $user->linux_username,
            'enabled' => (bool) $user->ssh_enabled,
            'public_key' => $user->ssh_public_key,
        ];
    }
}
