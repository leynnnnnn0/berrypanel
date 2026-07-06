<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;

class RegisterResponse implements RegisterResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user();
        $expiresAt = now()->addHour();
        $token = $user->createToken('auth-token', ['*'], $expiresAt)->plainTextToken;

        return response()->json([
            'user' => $user->only('id', 'name', 'email', 'linux_username'),
            'token' => $token,
        ], 201);
    }
}
