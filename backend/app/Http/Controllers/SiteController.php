<?php

namespace App\Http\Controllers;

use App\Models\Site;
use App\Models\User;
use App\Services\NginxSiteProvisioner;
use App\Services\SiteProvisioner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use RuntimeException;

class SiteController extends Controller
{
    private const ENV_KEYS = [
        'APP_NAME',
        'APP_ENV',
        'APP_KEY',
        'APP_DEBUG',
        'APP_URL',
        'LOG_CHANNEL',
        'DB_CONNECTION',
        'DB_HOST',
        'DB_PORT',
        'DB_DATABASE',
        'DB_USERNAME',
        'DB_PASSWORD',
        'CACHE_STORE',
        'QUEUE_CONNECTION',
        'SESSION_DRIVER',
        'MAIL_MAILER',
        'MAIL_HOST',
        'MAIL_PORT',
        'MAIL_USERNAME',
        'MAIL_PASSWORD',
        'MAIL_FROM_ADDRESS',
        'MAIL_FROM_NAME',
    ];

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'sites' => $request->user()
                ->sites()
                ->latest()
                ->get()
                ->map(fn (Site $site) => $this->serialize($site)),
        ]);
    }

    public function store(Request $request, SiteProvisioner $provisioner, NginxSiteProvisioner $nginx): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

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
        ], [
            'repository_url.regex' => 'Enter a public GitHub HTTPS repository URL like https://github.com/user/repo.',
            'repository_branch.regex' => 'Branch can only contain letters, numbers, dots, slashes, underscores, or hyphens.',
        ]);

        $slug = Str::slug($validated['name']);

        if (Site::where('user_id', $user->id)->where('slug', $slug)->exists()) {
            return response()->json(['message' => 'You already have a site with this name.'], 422);
        }

        if (! $user->linux_username) {
            $user->forceFill(['linux_username' => 'user_'.$user->id])->save();
        }

        $branch = $validated['repository_branch'] ?? 'main';
        $phpVersion = $validated['php_version'] ?? '8.4';
        $localUrl = $this->siteHost($slug);

        try {
            $paths = $provisioner->provision($user, $slug, $validated['repository_url'], $branch);

            $nginx->provision($slug, $localUrl, $paths['public_path'], $phpVersion);
        } catch (RuntimeException $exception) {
            if (isset($paths['root_path'])) {
                $provisioner->deletePath($paths['root_path']);
            }

            return response()->json(['message' => $exception->getMessage()], 422);
        }

        $site = Site::create([
            'user_id' => $user->id,
            'name' => $validated['name'],
            'slug' => $slug,
            'stack' => 'Laravel / Inertia',
            'php_version' => $phpVersion,
            'status' => $paths['deployed'] ? 'needs_configuration' : 'provisioned',
            'root_path' => $paths['root_path'],
            'public_path' => $paths['public_path'],
            'local_url' => $localUrl,
            'repository_url' => $validated['repository_url'],
            'repository_branch' => $branch,
            'env_variables' => $paths['env_variables'] ?? null,
        ]);

        return response()->json(['site' => $this->serialize($site)], 201);
    }

    public function show(Request $request, Site $site): JsonResponse
    {
        $this->authorizeSite($request, $site);

        return response()->json(['site' => $this->serialize($site, includeEnvironment: true)]);
    }

    public function updateEnvironment(Request $request, SiteProvisioner $provisioner, Site $site): JsonResponse
    {
        $this->authorizeSite($request, $site);

        $request->validate([
            'variables' => ['required', 'array'],
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

        $variables = $this->defaultEnvironment($site);

        foreach (self::ENV_KEYS as $key) {
            if ($request->has("variables.{$key}")) {
                $variables[$key] = $request->input("variables.{$key}") ?? '';
            }
        }

        $provisioner->writeEnvironmentFile($site, $variables);

        $site->forceFill(['env_variables' => $variables])->save();

        return response()->json(['site' => $this->serialize($site->refresh(), includeEnvironment: true)]);
    }

    public function destroy(Request $request, SiteProvisioner $provisioner, NginxSiteProvisioner $nginx, Site $site): JsonResponse
    {
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

    private function serialize(Site $site, bool $includeEnvironment = false): array
    {
        $payload = [
            'id' => $site->id,
            'name' => $site->name,
            'slug' => $site->slug,
            'stack' => $site->stack,
            'php_version' => $site->php_version,
            'status' => $site->status,
            'root_path' => $site->root_path,
            'public_path' => $site->public_path,
            'local_url' => $site->local_url,
            'repository_url' => $site->repository_url,
            'repository_branch' => $site->repository_branch,
            'created_at' => $site->created_at?->toISOString(),
        ];

        if ($includeEnvironment) {
            $payload['env_variables'] = array_replace($this->defaultEnvironment($site), $site->env_variables ?: []);
        }

        return $payload;
    }

    private function authorizeSite(Request $request, Site $site): void
    {
        if ($site->user_id !== $request->user()->id) {
            abort(404);
        }
    }

    private function defaultEnvironment(Site $site): array
    {
        return [
            'APP_NAME' => $site->name,
            'APP_ENV' => 'production',
            'APP_KEY' => '',
            'APP_DEBUG' => 'false',
            'APP_URL' => $site->local_url ? "http://{$site->local_url}" : '',
            'LOG_CHANNEL' => 'stack',
            'DB_CONNECTION' => 'mysql',
            'DB_HOST' => '127.0.0.1',
            'DB_PORT' => '3306',
            'DB_DATABASE' => Str::slug($site->slug, '_').'_db',
            'DB_USERNAME' => $site->user?->linux_username ?? '',
            'DB_PASSWORD' => '',
            'CACHE_STORE' => 'file',
            'QUEUE_CONNECTION' => 'sync',
            'SESSION_DRIVER' => 'file',
            'MAIL_MAILER' => 'log',
            'MAIL_HOST' => '',
            'MAIL_PORT' => '',
            'MAIL_USERNAME' => '',
            'MAIL_PASSWORD' => '',
            'MAIL_FROM_ADDRESS' => '',
            'MAIL_FROM_NAME' => $site->name,
        ];
    }

    private function siteHost(string $slug): string
    {
        $suffix = trim((string) config('berrypanel.site_domain_suffix'));
        $serverIp = trim((string) config('berrypanel.server_ip'));

        if ($suffix === '' && filter_var($serverIp, FILTER_VALIDATE_IP)) {
            $suffix = "{$serverIp}.nip.io";
        }

        if ($suffix === '') {
            $suffix = 'berrypanel.local';
        }

        $suffix = preg_replace('#^https?://#', '', $suffix) ?? $suffix;
        $suffix = trim($suffix, " \t\n\r\0\x0B.");

        return "{$slug}.{$suffix}";
    }
}
