<?php

use App\Http\Controllers\HostingDatabaseController;
use App\Http\Controllers\SiteController;
use App\Http\Controllers\SiteDeploymentWarningController;
use App\Http\Controllers\SshAccessController;
use App\Http\Controllers\UsageController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Http\Controllers\AuthenticatedSessionController;
use Laravel\Fortify\Http\Controllers\NewPasswordController;
use Laravel\Fortify\Http\Controllers\PasswordResetLinkController;
use Laravel\Fortify\Http\Controllers\RegisteredUserController;

Route::options('/{any}', fn () => response()->noContent())
    ->where('any', '.*');

Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])
    ->middleware('throttle:6,1');

Route::post('/reset-password', [NewPasswordController::class, 'store'])
    ->middleware('throttle:6,1')
    ->name('password.reset');

Route::post('/login', [AuthenticatedSessionController::class, 'store'])
    ->middleware('throttle:login')
    ->name('api.login');

Route::post('/register', [RegisteredUserController::class, 'store'])
    ->middleware('throttle:6,1')
    ->name('api.register');

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', fn (Request $request) => response()->json(
        $request->user()->only('id', 'name', 'email', 'linux_username')
    ));
    Route::get('/usage', [UsageController::class, 'show']);
    Route::get('/sites', [SiteController::class, 'index']);
    Route::post('/sites', [SiteController::class, 'store']);
    Route::get('/sites/{site}', [SiteController::class, 'show']);
    Route::put('/sites/{site}/env', [SiteController::class, 'updateEnvironment']);
    Route::delete('/sites/{site}/deployment-warnings', [SiteDeploymentWarningController::class, 'destroy']);
    Route::delete('/sites/{site}', [SiteController::class, 'destroy']);
    Route::get('/databases', [HostingDatabaseController::class, 'index']);
    Route::post('/databases', [HostingDatabaseController::class, 'store']);
    Route::delete('/databases/{database}', [HostingDatabaseController::class, 'destroy']);
    Route::get('/ssh-access', [SshAccessController::class, 'show']);
    Route::put('/ssh-access', [SshAccessController::class, 'update']);
    Route::delete('/ssh-access', [SshAccessController::class, 'destroy']);

    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('api.logout');

});
