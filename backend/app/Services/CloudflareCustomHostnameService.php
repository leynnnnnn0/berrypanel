<?php

namespace App\Services;

use App\Models\CustomDomain;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class CloudflareCustomHostnameService
{
    public function create(string $hostname): array
    {
        return $this->request()->post($this->endpoint(), [
            'hostname' => $hostname,
            'ssl' => ['method' => 'txt'],
        ])->throw()->json('result');
    }

    public function refresh(CustomDomain $domain): array
    {
        if (! $domain->cloudflare_id) throw new RuntimeException('This domain does not have a verification request yet.');
        return $this->request()->get($this->endpoint().'/'.$domain->cloudflare_id)->throw()->json('result');
    }

    public function delete(CustomDomain $domain): void
    {
        if ($domain->cloudflare_id) $this->request()->delete($this->endpoint().'/'.$domain->cloudflare_id)->throw();
    }

    private function request(): PendingRequest
    {
        $token = config('berrypanel.cloudflare_api_token');
        if (! is_string($token) || $token === '' || ! config('berrypanel.cloudflare_zone_id')) {
            throw new RuntimeException('Custom domains are not configured yet. Please contact support.');
        }
        return Http::acceptJson()->withToken($token)->timeout(20);
    }

    private function endpoint(): string
    {
        return 'https://api.cloudflare.com/client/v4/zones/'.config('berrypanel.cloudflare_zone_id').'/custom_hostnames';
    }
}
