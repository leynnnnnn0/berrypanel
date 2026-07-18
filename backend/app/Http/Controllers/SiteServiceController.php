<?php

namespace App\Http\Controllers;

use App\Models\Site;
use App\Models\SiteService;
use App\Services\Billing\HostingPlanAccess;
use App\Services\Hosting\AuditLogger;
use App\Services\Hosting\EnvironmentManager;
use App\Services\Hosting\SitePathResolver;
use App\Services\Hosting\SupervisorManager;
use App\Services\NginxSiteProvisioner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use RuntimeException;

class SiteServiceController extends Controller
{
    public function index(Request $r, Site $site): JsonResponse
    {
        $this->authorize('view', $site);

        return response()->json(['services' => $site->services()->latest()->get()->map(fn (SiteService $service) => $this->present($service))]);
    }

    public function store(Request $r, Site $site, SupervisorManager $manager, AuditLogger $audit, HostingPlanAccess $plans): JsonResponse
    {
        $this->authorize('update', $site);
        $v = $r->validate($this->rules());
        try {
            $this->assertServiceAccess($plans, $r, $site, $v['type']);
            $manager->validateCommand($v['command'], $v['type']);
            $s = $site->services()->create($v);
            $manager->apply($s);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
        $audit->record('service.created', $site, $r->user(), ['service_id' => $s->id]);

        return response()->json(['service' => $s], 201);
    }

    public function storeAdditionalNode(Request $r, Site $site, SitePathResolver $paths, SupervisorManager $manager, AuditLogger $audit, HostingPlanAccess $plans): JsonResponse
    {
        $this->authorize('update', $site);
        $v = $r->validate(['name' => ['required', 'string', 'max:80', 'regex:/^[A-Za-z0-9][A-Za-z0-9 _-]*$/'], 'working_directory' => ['required', 'string', 'max:255', 'regex:/^\/(?!.*\.\.)(?:[A-Za-z0-9._-]+\/?)*$/'], 'start_command' => ['required', 'string', 'max:120'], 'install_command' => ['nullable', 'string', 'max:120'], 'build_command' => ['nullable', 'string', 'max:120'], 'internal_port' => ['nullable', 'integer', 'between:1024,65535'], 'enabled' => ['boolean']]);
        if ($site->services()->where('name', $v['name'])->exists()) {
            return response()->json(['message' => 'A service with this name already exists.'], 422);
        }

        try {
            $plans->assertCanUseManagedNode($r->user());
            $directory = $paths->directory($site, $v['working_directory']);
            if (! File::isFile($directory.'/package.json')) {
                throw new RuntimeException('Additional Node.js directory must contain package.json.');
            }
            $manager->validateCommand($v['start_command'], 'node');
            $install = $v['install_command'] ?? $site->node_install_command;
            $this->approvedNodeCommand($install, $site->package_manager, 'install');
            if (! empty($v['build_command'])) {
                $this->approvedNodeCommand($v['build_command'], $site->package_manager, 'build');
            }
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
        $service = $site->services()->create(['name' => $v['name'], 'type' => 'node', 'working_directory' => $v['working_directory'], 'command' => $v['start_command'], 'install_command' => $install, 'build_command' => $v['build_command'] ?? null, 'internal_port' => $v['internal_port'] ?? null, 'processes' => 1, 'restart_policy' => 'always', 'max_retries' => 5, 'stop_timeout' => 15, 'environment_source' => 'node', 'enabled' => $v['enabled'] ?? true, 'status' => 'pending_deployment']);
        $audit->record('service.created', $site, $r->user(), ['service_id' => $service->id, 'type' => 'additional_node']);

        return response()->json(['service' => $this->present($service), 'message' => 'Node service saved. Deploy the project to install dependencies and start it.'], 201);
    }

    public function provisionTemplate(Request $r, Site $site, string $template, SupervisorManager $manager, AuditLogger $audit, NginxSiteProvisioner $nginx, EnvironmentManager $environment, HostingPlanAccess $plans): JsonResponse
    {
        $this->authorize('update', $site);
        $templates = collect($this->templates())->keyBy('type');
        abort_unless($templates->has($template), 404);
        try {
            $this->assertServiceAccess($plans, $r, $site, $template);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
        $data = $templates->get($template);
        $data['working_directory'] = $template === 'node' ? $site->frontend_directory : $site->backend_directory;
        if ($template === 'reverb') {
            $port = (int) config('berrypanel.reverb_port_base', 13000) + $site->id;
            $site->update(['reverb_port' => $port]);
            $site->refresh();
            $data['command'] = 'php artisan reverb:start --host=127.0.0.1 --port='.$port;
            $this->configureReverbEnvironment($site, $port, $environment);
        }
        $service = $site->services()->firstOrNew(['type' => $template]);
        $service->fill([...$data, 'processes' => 1, 'restart_policy' => 'always', 'max_retries' => 5, 'stop_timeout' => 15, 'environment_source' => $template === 'node' ? 'node' : 'laravel', 'enabled' => true]);
        $service->save();
        try {
            $manager->apply($service);
            $service->forceFill(['status' => 'running', 'last_started_at' => now()])->save();
            if ($template === 'reverb') {
                $this->provisionReverbProxy($site, $nginx);
            }
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
        $audit->record('service.enabled', $site, $r->user(), ['service_id' => $service->id, 'type' => $template]);

        return response()->json(['service' => $this->present($service->fresh())]);
    }

    public function action(Request $r, Site $site, SiteService $service, SupervisorManager $manager, AuditLogger $audit, NginxSiteProvisioner $nginx, EnvironmentManager $environment, HostingPlanAccess $plans): JsonResponse
    {
        $this->authorize('update', $site);
        abort_unless($service->site_id === $site->id, 404);
        $v = $r->validate(['action' => ['required', 'in:start,stop,restart,enable,disable']]);
        if (! in_array($v['action'], ['stop', 'disable'], true)) {
            try {
                $this->assertServiceAccess($plans, $r, $site, $service->type);
            } catch (RuntimeException $e) {
                return response()->json(['message' => $e->getMessage()], 422);
            }
        }
        $reverbChanged = false;
        if ($service->type === 'reverb' && $v['action'] !== 'disable') {
            $port = (int) config('berrypanel.reverb_port_base', 13000) + $site->id;
            $site->update(['reverb_port' => $port]);
            $site->refresh();
            $service->update(['command' => 'php artisan reverb:start --host=127.0.0.1 --port='.$port]);
            $this->configureReverbEnvironment($site, $port, $environment);
            $this->provisionReverbProxy($site, $nginx);
            $reverbChanged = true;
        }
        if (in_array($v['action'], ['enable', 'disable'])) {
            $service->update(['enabled' => $v['action'] === 'enable']);
            $manager->apply($service);
        } else {
            if ($reverbChanged) {
                $manager->apply($service->fresh());
            }
            $manager->action($service, $v['action']);
        }
        $audit->record('service.'.$v['action'], $site, $r->user(), ['service_id' => $service->id]);

        return response()->json(['service' => $this->present($service->fresh())]);
    }

    private function rules(): array
    {
        return ['name' => ['required', 'string', 'max:80'], 'type' => ['required', 'in:queue,horizon,reverb,scheduler,node'], 'working_directory' => ['required', 'string', 'max:255', 'regex:/^\/(?!.*\.\.)/'], 'command' => ['required', 'string', 'max:255'], 'processes' => ['required', 'integer', 'between:1,20'], 'restart_policy' => ['required', 'in:always,on-failure,never'], 'max_retries' => ['required', 'integer', 'between:0,20'], 'stop_timeout' => ['required', 'integer', 'between:1,300'], 'environment_source' => ['required', 'in:laravel,node,none'], 'log_file' => ['nullable', 'string', 'max:255'], 'enabled' => ['boolean']];
    }

    private function assertServiceAccess(HostingPlanAccess $plans, Request $request, Site $site, string $type): void
    {
        if ($type === 'node') {
            $plans->assertCanUseManagedNode($request->user());

            return;
        }

        $plans->assertCanUseBackgroundServices($request->user(), $site);

        if ($type === 'reverb') {
            $plans->assertCanUseReverb($request->user(), $site);
        }
    }

    private function templates(): array
    {
        return [['type' => 'queue', 'name' => 'Background jobs', 'command' => 'php artisan queue:work', 'working_directory' => '/backend'], ['type' => 'horizon', 'name' => 'Laravel Horizon', 'command' => 'php artisan horizon', 'working_directory' => '/backend'], ['type' => 'reverb', 'name' => 'Realtime updates', 'command' => 'php artisan reverb:start', 'working_directory' => '/backend'], ['type' => 'scheduler', 'name' => 'Scheduled tasks', 'command' => 'php artisan schedule:work', 'working_directory' => '/backend'], ['type' => 'node', 'name' => 'Node.js Production Server', 'command' => 'npm run start', 'working_directory' => '/frontend']];
    }

    private function approvedNodeCommand(string $input, string $manager, string $purpose): void
    {
        $allowed = ['npm' => ['install' => ['npm ci', 'npm install'], 'build' => ['npm run build']], 'yarn' => ['install' => ['yarn install --frozen-lockfile'], 'build' => ['yarn build']], 'pnpm' => ['install' => ['pnpm install --frozen-lockfile'], 'build' => ['pnpm run build']]];
        if (! in_array(trim($input), $allowed[$manager][$purpose] ?? [], true)) {
            throw new RuntimeException('Node command is not approved for this project package manager.');
        }
    }

    private function configureReverbEnvironment(Site $site, int $port, EnvironmentManager $environment): void
    {
        $path = app(SitePathResolver::class)->directory($site, $site->backend_directory).'/.env';
        $variables = File::isFile($path) ? $environment->parse((string) File::get($path)) : [];
        $origins = collect([$site->domain, $site->local_url, ...$site->customDomains()->where('status', 'active')->pluck('hostname')->all()])->filter()->map(fn ($host) => 'https://'.$host)->unique()->implode(',');
        $environment->save($site, 'laravel', array_merge($variables, ['REVERB_HOST' => '127.0.0.1', 'REVERB_PORT' => (string) $port, 'REVERB_SCHEME' => 'http', 'REVERB_SERVER_HOST' => '127.0.0.1', 'REVERB_SERVER_PORT' => (string) $port, 'REVERB_ALLOWED_ORIGINS' => $origins]));
    }

    private function provisionReverbProxy(Site $site, NginxSiteProvisioner $nginx): void
    {
        $aliases = $site->customDomains()->where('status', 'active')->pluck('hostname')->all();
        if ($site->stack === 'node_laravel') {
            $nginx->provisionHybrid($site->slug, $site->domain ?: $site->local_url, $site->public_path, $site->php_version, (int) $site->node_port, $aliases, (int) $site->reverb_port);
        } else {
            $nginx->provision($site->slug, $site->domain ?: $site->local_url, $site->public_path, $site->php_version, $aliases, (int) $site->reverb_port);
        }
    }

    private function present(SiteService $service): array
    {
        return $service->only(['id', 'name', 'type', 'enabled', 'status', 'restart_count', 'last_started_at', 'last_stopped_at', 'last_exit_code']);
    }
}
