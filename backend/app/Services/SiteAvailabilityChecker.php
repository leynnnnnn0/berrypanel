<?php

namespace App\Services;

use App\Models\Site;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

class SiteAvailabilityChecker
{
    public function check(Site $site): Site
    {
        $url = $this->targetUrl($site);

        if (! $url) {
            return $this->record($site, 'unknown', null, null, 'No application address is configured.');
        }

        if (! $this->isAllowedTarget($site, $url)) {
            return $this->record($site, 'unknown', null, null, 'The health-check host does not match this site.');
        }

        $startedAt = hrtime(true);

        try {
            $response = Http::connectTimeout((int) config('berrypanel.availability_connect_timeout', 3))
                ->timeout((int) config('berrypanel.availability_timeout', 5))
                ->withHeaders([
                    'Accept' => 'text/html,application/json;q=0.9,*/*;q=0.8',
                    'User-Agent' => 'BerryPanel Availability Monitor/1.0',
                ])
                ->withOptions(['allow_redirects' => false])
                ->get($url);

            $statusCode = $response->status();
            $responseMs = max(1, (int) round((hrtime(true) - $startedAt) / 1_000_000));

            if ($statusCode >= 200 && $statusCode < 300) {
                return $this->record($site, 'online', $statusCode, $responseMs);
            }

            if ($statusCode >= 300 && $statusCode < 400) {
                return $this->record($site, 'redirected', $statusCode, $responseMs, "HTTP {$statusCode} redirect");
            }

            return $this->record($site, 'offline', $statusCode, $responseMs, "HTTP {$statusCode}");
        } catch (Throwable $exception) {
            $responseMs = max(1, (int) round((hrtime(true) - $startedAt) / 1_000_000));

            return $this->record(
                $site,
                'offline',
                null,
                $responseMs,
                Str::limit($exception->getMessage(), 1000),
            );
        }
    }

    public function targetUrl(Site $site): ?string
    {
        $address = trim((string) ($site->health_check_url ?: $site->domain ?: $site->local_url));

        if ($address === '') {
            return null;
        }

        if (preg_match('#^https?://#i', $address)) {
            return $address;
        }

        $scheme = $site->ssl_enabled ? 'https' : (string) config('berrypanel.site_url_scheme', 'http');

        return $scheme.'://'.ltrim($address, '/');
    }

    private function isAllowedTarget(Site $site, string $url): bool
    {
        $targetHost = $this->host($url);

        if (! $targetHost) {
            return false;
        }

        $site->loadMissing('customDomains');

        $allowedHosts = collect([$site->domain, $site->local_url])
            ->merge($site->customDomains->where('status', 'active')->pluck('hostname'))
            ->filter()
            ->map(fn (string $address) => $this->host($address))
            ->filter()
            ->unique();

        return $allowedHosts->contains($targetHost);
    }

    private function host(string $address): ?string
    {
        $normalized = preg_match('#^https?://#i', $address) ? $address : 'http://'.$address;
        $host = parse_url($normalized, PHP_URL_HOST);

        return is_string($host) ? Str::lower(rtrim($host, '.')) : null;
    }

    private function record(
        Site $site,
        string $status,
        ?int $httpStatus,
        ?int $responseMs,
        ?string $error = null,
    ): Site {
        $site->forceFill([
            'availability_status' => $status,
            'availability_http_status' => $httpStatus,
            'availability_response_ms' => $responseMs,
            'availability_checked_at' => now(),
            'availability_error' => $error,
        ])->save();

        return $site->refresh();
    }
}
