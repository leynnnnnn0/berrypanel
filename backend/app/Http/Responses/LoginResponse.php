<?php


namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user();
        $remember = $request->boolean('remember');
        $minutes = $remember ? 60 * 2 : 60;
        $expiresAt = $remember ? now()->addHours(2) : now()->addHour();

        $token = $user->createToken('auth-token', ['*'], $expiresAt)->plainTextToken;

        return response()
            ->json([
                'user' => $user->only('id', 'name', 'email', 'linux_username'),
                'token' => $token,
            ])
            ->cookie(
                'auth_token',
                $token,
                $minutes,
                '/',
                env('SESSION_DOMAIN', ''),
                env('APP_ENV') === 'production',
                true,
                false,
                'Lax'
            );
    }
}
