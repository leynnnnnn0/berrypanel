<?php


namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user();
        $remember = $request->boolean('remember');
        $expiresAt = $remember ? now()->addHours(2) : now()->addHour();

        $token = $user->createToken('auth-token', ['*'], $expiresAt)->plainTextToken;

        return response()->json([
            'user' => $user->only('id', 'name', 'email', 'linux_username'),
            'token' => $token,
        ]);
    }
}
