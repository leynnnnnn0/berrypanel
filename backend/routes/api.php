<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Http\Controllers\AuthenticatedSessionController;
use Laravel\Fortify\Http\Controllers\RegisteredUserController;
use Laravel\Fortify\Http\Controllers\PasswordResetLinkController;
use Laravel\Fortify\Http\Controllers\NewPasswordController;
use App\Http\Controllers\SiteController;

Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])
    ->middleware('throttle:6,1');

Route::post('/reset-password', [NewPasswordController::class, 'store'])
    ->middleware('throttle:6,1')
    ->name('password.reset');

Route::post('/login', [AuthenticatedSessionController::class, 'store'])
    ->middleware('throttle:login');

Route::post('/register', [RegisteredUserController::class, 'store'])
    ->middleware('throttle:6,1');

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', fn($req) => response()->json($req->user()));
    Route::get('/sites', [SiteController::class, 'index']);
    Route::post('/sites', [SiteController::class, 'store']);
    Route::delete('/sites/{site}', [SiteController::class, 'destroy']);

    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);

});
