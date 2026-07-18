<?php

namespace App\Services;

use App\Models\Site;
use Illuminate\Support\Str;

class SiteEnvironmentService
{
    public const KEYS = [
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

    public function __construct(private readonly SiteProvisioner $provisioner) {}

    public function forSite(Site $site): array
    {
        return array_replace(
            $this->defaults($site),
            $site->env_variables ?: [],
            $this->fromDisk($site) ?: [],
        );
    }

    public function mergeSubmitted(Site $site, array $input): array
    {
        $variables = $this->forSite($site);

        foreach ($input as $key => $value) {
            if (is_string($key) && preg_match('/^[A-Z_][A-Z0-9_]*$/i', $key)) {
                $variables[$key] = $value ?? '';
            }
        }

        return $variables;
    }

    public function statusForProvisionResult(array $paths): string
    {
        if (! ($paths['deployed'] ?? false)) {
            return 'provisioned';
        }

        $variables = $paths['env_variables'] ?? [];

        return $this->statusFor(
            is_array($variables) ? $variables : [],
            $paths['deployment_warnings'] ?? [],
        );
    }

    public function statusFor(array $variables, array $deploymentWarnings = []): string
    {
        $hasRequiredRuntime = collect(['APP_KEY', 'APP_URL', 'DB_DATABASE', 'DB_USERNAME'])
            ->every(fn (string $key) => isset($variables[$key]) && trim((string) $variables[$key]) !== '');

        if (! $hasRequiredRuntime) {
            return 'needs_configuration';
        }

        return $deploymentWarnings === [] ? 'provisioned' : 'needs_configuration';
    }

    public function persist(Site $site, array $variables, ?array $deploymentWarnings = null): Site
    {
        $this->provisioner->writeEnvironmentFile($site, $variables);

        $warnings = $deploymentWarnings ?? ($site->deployment_warnings ?: []);

        $site->forceFill([
            'env_variables' => $variables,
            'deployment_warnings' => $warnings,
            'status' => $this->statusFor($variables, $warnings),
        ])->save();

        return $site->refresh();
    }

    private function defaults(Site $site): array
    {
        return [
            'APP_NAME' => $site->name,
            'APP_ENV' => 'production',
            'APP_KEY' => '',
            'APP_DEBUG' => 'false',
            'APP_URL' => $site->local_url ? $this->siteUrl($site->local_url) : '',
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

    private function siteUrl(string $host): string
    {
        $scheme = trim((string) config('berrypanel.site_url_scheme', 'http'));
        $scheme = in_array($scheme, ['http', 'https'], true) ? $scheme : 'http';

        return "{$scheme}://{$host}";
    }

    private function fromDisk(Site $site): ?array
    {
        if (! is_string($site->root_path) || $site->root_path === '') {
            return null;
        }

        return $this->provisioner->readEnvironmentFileForSite($site);
    }
}
