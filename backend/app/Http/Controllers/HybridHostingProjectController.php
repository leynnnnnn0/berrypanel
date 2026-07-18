<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateHybridHostingProjectRequest;
use App\Jobs\RunSiteDeployment;
use App\Models\Site;
use App\Services\Billing\HostingPlanAccess;
use App\Services\Hosting\AuditLogger;
use App\Services\SitePresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class HybridHostingProjectController extends Controller
{
    public function index(Request $r, SitePresenter $presenter, HostingPlanAccess $plans): JsonResponse
    {
        $projects = $r->user()
            ->sites()
            ->where('stack', 'Node.js + Laravel')
            ->latest()
            ->get()
            ->map(fn (Site $site) => $presenter->toArray($site));

        return response()->json([
            'projects' => $projects,
            'hosting_access' => $plans->summary($r->user()),
        ]);
    }

    public function store(CreateHybridHostingProjectRequest $r, AuditLogger $audit, SitePresenter $presenter, HostingPlanAccess $plans): JsonResponse
    {
        try {
            $plans->assertCanCreateHybridSite($r->user());
        } catch (\RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        $input = $r->validated();
        $slug = Str::slug($input['name']);
        if ($r->user()->sites()->where('slug', $slug)->exists()) {
            return response()->json(['message' => 'You already have a project with this name.'], 422);
        }

        if (! $r->user()->linux_username) {
            $r->user()->update(['linux_username' => 'user_'.$r->user()->id]);
        }

        $root = rtrim((string) config('berrypanel.users_root'), '/').'/'.$r->user()->linux_username.'/sites/'.$slug;
        File::ensureDirectoryExists($root, 0775, true);
        $domain = $this->siteHost($slug);
        $public = rtrim($input['backend_directory'], '/').'/public';
        $defaults = [
            'repository_branch' => 'main',
            'laravel_public_directory' => $public,
            'node_version' => '20',
            'package_manager' => 'npm',
            'node_install_command' => 'npm ci',
            'node_build_command' => 'npm run build',
            'node_start_command' => 'npm run start',
            'php_version' => '8.4',
            'domain' => $domain,
            'ssl_enabled' => false,
            'migrate_on_deploy' => false,
            'build_on_deploy' => true,
            'restart_services_on_deploy' => true,
            'health_check_url' => null,
            'deployment_timeout' => 900,
        ];
        $site = Site::create([
            ...$defaults,
            ...$input,
            'user_id' => $r->user()->id,
            'slug' => $slug,
            'stack' => 'Node.js + Laravel',
            'status' => 'queued',
            'root_path' => $root,
            'public_path' => $root.'/'.ltrim($public, '/'),
            'local_url' => $domain,
        ]);
        $deployment = $site->deployments()->create([
            'triggered_by' => $r->user()->id,
            'status' => 'queued',
            'branch' => 'main',
        ]);
        RunSiteDeployment::dispatch($deployment->id);
        $audit->record('hybrid-project.created', $site, $r->user(), ['deployment_id' => $deployment->id]);

        return response()->json(['project' => $presenter->toArray($site), 'deployment' => $deployment], 202);
    }

    private function siteHost(string $slug): string
    {
        $suffix = trim((string) config('berrypanel.site_domain_suffix'));
        $ip = trim((string) config('berrypanel.server_ip'));
        if ($suffix === '' && filter_var($ip, FILTER_VALIDATE_IP)) {
            $suffix = "{$ip}.nip.io";
        }

        if ($suffix === '') {
            $suffix = 'berrypanel.local';
        }

        $suffix = preg_replace('#^https?://#', '', $suffix) ?? $suffix;

        return $slug.'.'.trim($suffix, " \t\n\r\0\x0B.");
    }
}
