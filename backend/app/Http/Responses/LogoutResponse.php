<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LogoutResponse as LogoutResponseContract;

class LogoutResponse implements LogoutResponseContract
{
    public function toResponse($request)
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['status' => true, 'message' => 'Logged out']);
    }
}
