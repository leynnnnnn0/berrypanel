<?php

namespace App\Http\Controllers;

use App\Models\CustomDomain;
use App\Models\Site;
use App\Services\CloudflareCustomHostnameService;
use App\Services\Hosting\AuditLogger;
use App\Services\NginxSiteProvisioner;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use RuntimeException;

class CustomDomainController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(['domains' => $request->user()->customDomains()->with('site:id,name')->latest()->get()->map(fn (CustomDomain $domain) => $this->present($domain))]);
    }

    public function store(Request $request, CloudflareCustomHostnameService $cloudflare, AuditLogger $audit): JsonResponse
    {
        $data = $request->validate(['hostname' => ['required', 'string', 'max:253', 'regex:/^(?=.{1,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i']]);
        $hostname = Str::lower(rtrim($data['hostname'], '.'));
        if (str_ends_with($hostname, '.'.config('berrypanel.site_domain_suffix')) || $hostname === config('berrypanel.site_domain_suffix')) {
            return response()->json(['message' => 'Use a domain you own, not a BerryPanel address.'], 422);
        }
        if (CustomDomain::where('hostname', $hostname)->exists()) return response()->json(['message' => 'That domain is already connected to a project.'], 422);

        try { $result = $cloudflare->create($hostname); }
        catch (RequestException $exception) { return response()->json(['message' => $this->cloudflareMessage($exception)], 422); }
        catch (RuntimeException $exception) { return response()->json(['message' => $exception->getMessage()], 422); }

        $record = data_get($result, 'ownership_verification') ?: data_get($result, 'ssl.validation_records.0');
        $domain = CustomDomain::create([
            'user_id' => $request->user()->id, 'hostname' => $hostname, 'cloudflare_id' => data_get($result, 'id'),
            'status' => data_get($result, 'status', 'pending'), 'validation_name' => data_get($record, 'name') ?: data_get($record, 'txt_name'),
            'validation_value' => data_get($record, 'value') ?: data_get($record, 'txt_value') ?: data_get($record, 'txt_record'),
        ]);
        $audit->record('custom_domain.created', null, $request->user(), ['domain_id' => $domain->id]);
        return response()->json(['domain' => $this->present($domain)], 201);
    }

    public function refresh(Request $request, CustomDomain $domain, CloudflareCustomHostnameService $cloudflare, NginxSiteProvisioner $nginx, AuditLogger $audit): JsonResponse
    {
        $this->owns($request, $domain);
        try { $result = $cloudflare->refresh($domain); }
        catch (RequestException $exception) { return response()->json(['message' => $this->cloudflareMessage($exception)], 422); }
        catch (RuntimeException $exception) { return response()->json(['message' => $exception->getMessage()], 422); }
        $domain->update(['status' => data_get($result, 'status', $domain->status), 'last_error' => data_get($result, 'ssl.status') === 'active' ? null : data_get($result, 'ssl.validation_errors.0.message')]);
        if ($this->isActive($result)) {
            $domain->update(['status' => 'active', 'verified_at' => now(), 'last_error' => null]);
            if ($domain->site) $this->provisionSite($domain->site, $nginx);
        }
        $audit->record('custom_domain.checked', $domain->site, $request->user(), ['domain_id' => $domain->id, 'status' => $domain->status]);
        return response()->json(['domain' => $this->present($domain->fresh('site'))]);
    }

    public function attach(Request $request, CustomDomain $domain, NginxSiteProvisioner $nginx, AuditLogger $audit): JsonResponse
    {
        $this->owns($request, $domain);
        $data = $request->validate(['site_id' => ['nullable', 'integer', 'exists:sites,id']]);
        $site = isset($data['site_id']) ? Site::where('user_id', $request->user()->id)->findOrFail($data['site_id']) : null;
        if ($site && $domain->status !== 'active') return response()->json(['message' => 'Verify the domain before connecting it to a project.'], 422);
        $domain->update(['site_id' => $site?->id]);
        if ($site) $this->provisionSite($site, $nginx);
        $audit->record($site ? 'custom_domain.attached' : 'custom_domain.detached', $site, $request->user(), ['domain_id' => $domain->id]);
        return response()->json(['domain' => $this->present($domain->fresh('site'))]);
    }

    public function destroy(Request $request, CustomDomain $domain, CloudflareCustomHostnameService $cloudflare, NginxSiteProvisioner $nginx, AuditLogger $audit): JsonResponse
    {
        $this->owns($request, $domain); $site = $domain->site;
        try { $cloudflare->delete($domain); }
        catch (RequestException $exception) { return response()->json(['message' => $this->cloudflareMessage($exception)], 422); }
        $domain->delete(); if ($site) $this->provisionSite($site, $nginx);
        $audit->record('custom_domain.deleted', $site, $request->user(), ['hostname' => $domain->hostname]);
        return response()->json(['deleted' => true]);
    }

    private function provisionSite(Site $site, NginxSiteProvisioner $nginx): void
    {
        $domains = $site->customDomains()->where('status', 'active')->pluck('hostname')->all();
        if ($site->stack === 'node_laravel') $nginx->provisionHybrid($site->slug, $site->domain, $site->public_path, $site->php_version, (int) $site->node_port, $domains);
        else $nginx->provision($site->slug, $site->domain, $site->public_path, $site->php_version, $domains);
    }

    private function isActive(array $result): bool { return data_get($result, 'status') === 'active' && data_get($result, 'ssl.status') === 'active'; }
    private function owns(Request $request, CustomDomain $domain): void { if ($domain->user_id !== $request->user()->id) abort(404); }
    private function present(CustomDomain $domain): array { return ['id'=>$domain->id,'hostname'=>$domain->hostname,'status'=>$domain->status,'validation_name'=>$domain->validation_name,'validation_value'=>$domain->validation_value,'cname_target'=>config('berrypanel.cloudflare_fallback_origin'),'last_error'=>$domain->last_error,'verified_at'=>$domain->verified_at?->toIso8601String(),'site'=>$domain->site?->only(['id','name'])]; }
    private function cloudflareMessage(RequestException $exception): string { return data_get($exception->response->json(), 'errors.0.message') ?: 'We could not contact the domain provider. Please try again.'; }
}
