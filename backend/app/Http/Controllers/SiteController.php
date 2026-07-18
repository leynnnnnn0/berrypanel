<?php

namespace App\Http\Controllers;

use App\Models\Site;
use App\Services\NginxSiteProvisioner;
use App\Services\SiteCreator;
use App\Services\SiteEnvironmentService;
use App\Services\SitePresenter;
use App\Services\SiteProvisioner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class SiteController extends Controller
{
    public function index(Request $request, SitePresenter $presenter): JsonResponse
    {
        return response()->json([
            'sites' => $request->user()
                ->sites()
                ->latest()
                ->get()
                ->map(fn (Site $site) => $presenter->toArray($site)),
        ]);
    }

    public function store(Request $request, SiteCreator $creator, SitePresenter $presenter): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:62', 'regex:/^[a-zA-Z0-9][a-zA-Z0-9 -]*[a-zA-Z0-9]$/'],
            'repository_url' => [
                'required',
                'url',
                'max:255',
                'regex:/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/',
            ],
            'repository_branch' => ['nullable', 'string', 'max:80', 'regex:/^[A-Za-z0-9._\/-]+$/'],
            'php_version' => ['nullable', 'string', 'in:8.3,8.4'],
            'backend_directory' => ['nullable', 'string', 'max:255', 'regex:/^\/(?!.*\.\.)/'],
            'frontend_directory' => ['nullable', 'string', 'max:255', 'regex:/^\/(?!.*\.\.)/'],
            'laravel_public_directory' => ['nullable', 'string', 'max:255', 'regex:/^\/(?!.*\.\.)/'],
            'node_version' => ['nullable', 'in:18,20,22,24'],
            'package_manager' => ['nullable', 'in:npm,yarn,pnpm'],
            'node_install_command' => ['nullable', 'string', 'max:120'],
            'node_build_command' => ['nullable', 'string', 'max:120'],
            'node_start_command' => ['nullable', 'string', 'max:120'],
            'domain' => ['nullable', 'string', 'max:253'],
        ], [
            'repository_url.regex' => 'Enter a public GitHub HTTPS repository URL like https://github.com/user/repo.',
            'repository_branch.regex' => 'Branch can only contain letters, numbers, dots, slashes, underscores, or hyphens.',
        ]);

        try {
            $site = $creator->create($request->user(), $validated);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json(['site' => $presenter->toArray($site)], 201);
    }

    public function show(Request $request, SitePresenter $presenter, Site $site): JsonResponse
    {
        $this->authorizeSite($request, $site);

        return response()->json(['site' => $presenter->toArray($site, includeEnvironment: true)]);
    }

    public function updateEnvironment(
        Request $request,
        SiteEnvironmentService $environment,
        SitePresenter $presenter,
        Site $site,
    ): JsonResponse {
        $this->authorizeSite($request, $site);

        $request->validate([
            'variables' => ['required', 'array'],
            'variables.*' => ['nullable', 'string', 'max:10000'],
            'variables.APP_NAME' => ['nullable', 'string', 'max:120'],
            'variables.APP_ENV' => ['nullable', 'string', 'in:local,staging,production'],
            'variables.APP_KEY' => ['nullable', 'string', 'max:120'],
            'variables.APP_DEBUG' => ['nullable', 'in:true,false,1,0'],
            'variables.APP_URL' => ['nullable', 'url', 'max:255'],
            'variables.LOG_CHANNEL' => ['nullable', 'string', 'max:80'],
            'variables.DB_CONNECTION' => ['nullable', 'string', 'in:mysql,mariadb,pgsql,sqlite'],
            'variables.DB_HOST' => ['nullable', 'string', 'max:120'],
            'variables.DB_PORT' => ['nullable', 'integer', 'between:1,65535'],
            'variables.DB_DATABASE' => ['nullable', 'string', 'max:120'],
            'variables.DB_USERNAME' => ['nullable', 'string', 'max:120'],
            'variables.DB_PASSWORD' => ['nullable', 'string', 'max:255'],
            'variables.CACHE_STORE' => ['nullable', 'string', 'max:80'],
            'variables.QUEUE_CONNECTION' => ['nullable', 'string', 'max:80'],
            'variables.SESSION_DRIVER' => ['nullable', 'string', 'max:80'],
            'variables.MAIL_MAILER' => ['nullable', 'string', 'max:80'],
            'variables.MAIL_HOST' => ['nullable', 'string', 'max:120'],
            'variables.MAIL_PORT' => ['nullable', 'integer', 'between:1,65535'],
            'variables.MAIL_USERNAME' => ['nullable', 'string', 'max:120'],
            'variables.MAIL_PASSWORD' => ['nullable', 'string', 'max:255'],
            'variables.MAIL_FROM_ADDRESS' => ['nullable', 'email', 'max:120'],
            'variables.MAIL_FROM_NAME' => ['nullable', 'string', 'max:120'],
        ]);

        $variables = $environment->mergeSubmitted($site, $request->input('variables', []));
        $site = $environment->persist($site, $variables);

        return response()->json(['site' => $presenter->toArray($site, includeEnvironment: true)]);
    }

    public function destroy(
        Request $request,
        SiteProvisioner $provisioner,
        NginxSiteProvisioner $nginx,
        Site $site,
    ): JsonResponse {
        $this->authorizeSite($request, $site);

        try {
            $nginx->delete($site);
            $provisioner->delete($site);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        $site->delete();

        return response()->json(['deleted' => true]);
    }

    private function authorizeSite(Request $request, Site $site): void
    {
        if ($site->user_id !== $request->user()->id) {
            abort(404);
        }
    }
}
