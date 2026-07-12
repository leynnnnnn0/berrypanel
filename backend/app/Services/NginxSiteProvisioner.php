<?php

namespace App\Services;

use App\Models\Site;
use Illuminate\Support\Facades\File;
use RuntimeException;
use Symfony\Component\Process\Process;

class NginxSiteProvisioner
{
    public function provision(string $slug, string $host, string $publicPath, string $phpVersion, array $additionalHosts = []): bool
    {
        if (! (bool) config('berrypanel.nginx_provisioning_enabled')) {
            return false;
        }

        $this->validateSiteInput($slug, $host, $publicPath);

        $configName = $this->configName($slug);
        $temporaryPath = storage_path("app/berrypanel/nginx/{$configName}");

        File::ensureDirectoryExists(dirname($temporaryPath), 0775, true);
        File::put($temporaryPath, $this->buildServerBlock($host, $publicPath, $phpVersion, $additionalHosts));

        $availablePath = $this->joinPath((string) config('berrypanel.nginx_sites_available_path'), $configName);
        $enabledPath = $this->joinPath((string) config('berrypanel.nginx_sites_enabled_path'), $configName);

        $this->run(['sudo', 'cp', $temporaryPath, $availablePath], 'Unable to install Nginx site config');
        $this->run(['sudo', 'ln', '-sfn', $availablePath, $enabledPath], 'Unable to enable Nginx site config');
        $this->run(['sudo', 'nginx', '-t'], 'Nginx config test failed');
        $this->run(['sudo', 'systemctl', 'reload', 'nginx'], 'Unable to reload Nginx');

        return true;
    }

    public function provisionHybrid(string $slug, string $host, string $laravelPublicPath, string $phpVersion, int $nodePort, array $additionalHosts = []): bool
    {
        if (! (bool) config('berrypanel.nginx_provisioning_enabled')) return false;
        $this->validateSiteInput($slug, $host, $laravelPublicPath);
        if ($nodePort < 1024 || $nodePort > 65535) throw new RuntimeException('BerryPanel refused to proxy to an invalid Node.js port.');
        $configName = $this->configName($slug); $temporaryPath = storage_path("app/berrypanel/nginx/{$configName}");
        File::ensureDirectoryExists(dirname($temporaryPath), 0775, true);
        File::put($temporaryPath, $this->buildHybridServerBlock($host, $laravelPublicPath, $phpVersion, $nodePort, $additionalHosts));
        $availablePath = $this->joinPath((string) config('berrypanel.nginx_sites_available_path'), $configName);
        $enabledPath = $this->joinPath((string) config('berrypanel.nginx_sites_enabled_path'), $configName);
        $this->run(['sudo','cp',$temporaryPath,$availablePath], 'Unable to install hybrid Nginx site config');
        $this->run(['sudo','ln','-sfn',$availablePath,$enabledPath], 'Unable to enable hybrid Nginx site config');
        $this->run(['sudo','nginx','-t'], 'Hybrid Nginx config test failed');
        $this->run(['sudo','systemctl','reload','nginx'], 'Unable to reload Nginx');
        return true;
    }

    public function delete(Site $site): void
    {
        if (! (bool) config('berrypanel.nginx_provisioning_enabled')) {
            return;
        }

        $configName = $this->configName($site->slug);
        $availablePath = $this->joinPath((string) config('berrypanel.nginx_sites_available_path'), $configName);
        $enabledPath = $this->joinPath((string) config('berrypanel.nginx_sites_enabled_path'), $configName);

        $this->run(['sudo', 'unlink', $enabledPath], 'Unable to disable Nginx site config', allowFailure: true);
        $this->run(['sudo', 'unlink', $availablePath], 'Unable to remove Nginx site config', allowFailure: true);
        $this->run(['sudo', 'nginx', '-t'], 'Nginx config test failed after removing site');
        $this->run(['sudo', 'systemctl', 'reload', 'nginx'], 'Unable to reload Nginx after removing site');
    }

    private function buildServerBlock(string $host, string $publicPath, string $phpVersion, array $additionalHosts = []): string
    {
        $socket = (string) config('berrypanel.nginx_php_fpm_socket');

        if ($socket === '') {
            $socket = "/run/php/php{$phpVersion}-fpm.sock";
        }

        $hosts = $this->serverNames($host, $additionalHosts);
        return <<<NGINX
server {
    listen 80;
    server_name {$hosts};

    root {$publicPath};
    index index.php index.html;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    charset utf-8;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:{$socket};
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        fastcgi_param DOCUMENT_ROOT \$realpath_root;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}

NGINX;
    }

    private function buildHybridServerBlock(string $host, string $publicPath, string $phpVersion, int $nodePort, array $additionalHosts = []): string
    {
        $socket = (string) config('berrypanel.nginx_php_fpm_socket');
        if ($socket === '') $socket = "/run/php/php{$phpVersion}-fpm.sock";
        $hosts = $this->serverNames($host, $additionalHosts);
        return <<<NGINX
server {
    listen 80;
    server_name {$hosts};
    root {$publicPath};
    index index.php;

    location / {
        proxy_pass http://127.0.0.1:{$nodePort};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location ^~ /api/ { try_files \$uri \$uri/ @laravel; }
    location = /api { try_files \$uri @laravel; }
    location ^~ /storage/ { try_files \$uri =404; }

    location @laravel {
        include fastcgi_params;
        fastcgi_pass unix:{$socket};
        fastcgi_param SCRIPT_FILENAME {$publicPath}/index.php;
        fastcgi_param SCRIPT_NAME /index.php;
        fastcgi_param DOCUMENT_ROOT {$publicPath};
        fastcgi_param HTTP_PROXY "";
    }

    location ~ /\. { deny all; }
}
NGINX;
    }

    private function validateSiteInput(string $slug, string $host, string $publicPath): void
    {
        if (! preg_match('/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/', $slug)) {
            throw new RuntimeException('BerryPanel refused to create an Nginx config for an unsafe site slug.');
        }

        if (! preg_match('/^[a-z0-9.-]+$/', $host)) {
            throw new RuntimeException('BerryPanel refused to create an Nginx config for an unsafe host.');
        }

        $usersRoot = (string) config('berrypanel.users_root');
        $normalizedRoot = realpath($usersRoot) ?: $usersRoot;
        $normalizedPublicPath = realpath($publicPath) ?: $publicPath;

        if (! str_starts_with($normalizedPublicPath, rtrim($normalizedRoot, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR)) {
            throw new RuntimeException('BerryPanel refused to create an Nginx config outside the users root.');
        }
    }

    private function serverNames(string $host, array $additionalHosts): string
    {
        $hosts = array_values(array_unique(array_filter([$host, ...$additionalHosts])));
        foreach ($hosts as $candidate) {
            if (! is_string($candidate) || ! preg_match('/^[a-z0-9.-]+$/', $candidate)) {
                throw new RuntimeException('BerryPanel refused to create an Nginx config for an unsafe domain.');
            }
        }
        return implode(' ', $hosts);
    }

    private function configName(string $slug): string
    {
        return "berrypanel-{$slug}.conf";
    }

    private function joinPath(string $left, string $right): string
    {
        return rtrim($left, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.ltrim($right, DIRECTORY_SEPARATOR);
    }

    private function run(array $command, string $failureMessage, bool $allowFailure = false): void
    {
        $process = new Process($command);
        $process->setTimeout(60);
        $process->run();

        if (! $process->isSuccessful() && ! $allowFailure) {
            $error = trim($process->getErrorOutput()) ?: trim($process->getOutput());

            throw new RuntimeException(
                $failureMessage.'. Give the BerryPanel backend user passwordless sudo for cp, ln, unlink, nginx, and systemctl reload nginx. '
                .($error !== '' ? "Command output: {$error}" : ''),
            );
        }
    }
}
