<?php

use App\Http\Controllers\HostingDatabaseController;
use App\Http\Controllers\SiteCommandController;
use App\Http\Controllers\SiteController;
use App\Http\Controllers\SiteDeploymentWarningController;
use App\Http\Controllers\SshAccessController;
use App\Http\Controllers\UsageController;
use App\Http\Controllers\DeploymentController;
use App\Http\Controllers\HostingEnvironmentController;
use App\Http\Controllers\HostingProjectController;
use App\Http\Controllers\HostingTerminalController;
use App\Http\Controllers\SiteServiceController;
use App\Http\Controllers\HybridHostingProjectController;
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
    Route::get('/node-laravel-hosting', [HybridHostingProjectController::class, 'index']);
    Route::post('/node-laravel-hosting', [HybridHostingProjectController::class, 'store']);
    Route::post('/sites', [SiteController::class, 'store']);
    Route::get('/sites/{site}', [SiteController::class, 'show']);
    Route::post('/sites/{site}/commands', SiteCommandController::class);
    Route::put('/sites/{site}/env', [SiteController::class, 'updateEnvironment']);
    Route::delete('/sites/{site}/deployment-warnings', [SiteDeploymentWarningController::class, 'destroy']);
    Route::delete('/sites/{site}', [SiteController::class, 'destroy']);
    Route::put('/sites/{site}/hosting-settings', [HostingProjectController::class, 'update']);
    Route::get('/sites/{site}/environments', [HostingEnvironmentController::class, 'index']);
    Route::put('/sites/{site}/environments', [HostingEnvironmentController::class, 'store']);
    Route::get('/sites/{site}/deployments', [DeploymentController::class, 'index']);
    Route::post('/sites/{site}/deployments', [DeploymentController::class, 'store']);
    Route::get('/sites/{site}/deployments/{deployment}/logs', [DeploymentController::class, 'logs']);
    Route::post('/sites/{site}/deployments/{deployment}/retry', [DeploymentController::class, 'retry']);
    Route::get('/sites/{site}/terminal/history', [HostingTerminalController::class, 'index']);
    Route::post('/sites/{site}/terminal', [HostingTerminalController::class, 'store']);
    Route::get('/sites/{site}/services', [SiteServiceController::class, 'index']);
    Route::post('/sites/{site}/services', [SiteServiceController::class, 'store']);
    Route::post('/sites/{site}/services/{service}/actions', [SiteServiceController::class, 'action']);
    Route::get('/databases', [HostingDatabaseController::class, 'index']);
    Route::post('/databases', [HostingDatabaseController::class, 'store']);
    Route::delete('/databases/{database}', [HostingDatabaseController::class, 'destroy']);
    Route::get('/ssh-access', [SshAccessController::class, 'show']);
    Route::put('/ssh-access', [SshAccessController::class, 'update']);
    Route::delete('/ssh-access', [SshAccessController::class, 'destroy']);

    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('api.logout');

});
