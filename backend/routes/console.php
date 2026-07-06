<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('berrypanel:doctor', function () {
    $failed = false;

    $check = function (bool $passes, string $message) use (&$failed) {
        if ($passes) {
            $this->info("PASS {$message}");

            return;
        }

        $failed = true;
        $this->error("FAIL {$message}");
    };

    $this->line('BerryPanel Pi backend checks');

    $usersRoot = (string) config('berrypanel.users_root');
    $nearestExistingPath = $usersRoot;

    while ($nearestExistingPath !== '' && ! File::exists($nearestExistingPath)) {
        $parent = dirname($nearestExistingPath);

        if ($parent === $nearestExistingPath) {
            break;
        }

        $nearestExistingPath = $parent;
    }

    $check($usersRoot !== '', 'BERRYPANEL_USERS_ROOT is configured');
    $check(File::isDirectory($nearestExistingPath), "nearest users-root path exists: {$nearestExistingPath}");
    $check(File::isWritable($nearestExistingPath), "nearest users-root path is writable by this PHP user: {$nearestExistingPath}");

    $serverIp = (string) config('berrypanel.server_ip');
    $siteSuffix = (string) config('berrypanel.site_domain_suffix');
    $check($siteSuffix !== '' || filter_var($serverIp, FILTER_VALIDATE_IP) !== false, 'site URL suffix can be generated from BERRYPANEL_SERVER_IP or BERRYPANEL_SITE_DOMAIN_SUFFIX');

    $check(extension_loaded('pdo'), 'PDO extension is loaded');
    $check(extension_loaded('pdo_mysql'), 'PDO MySQL extension is loaded');
    $check(extension_loaded('pdo_sqlite'), 'PDO SQLite extension is loaded');

    if ((bool) config('berrypanel.database_provisioning_enabled')) {
        try {
            new PDO(
                sprintf(
                    'mysql:host=%s;port=%d;charset=utf8mb4',
                    config('berrypanel.mysql_admin_host'),
                    config('berrypanel.mysql_admin_port'),
                ),
                (string) config('berrypanel.mysql_admin_username'),
                (string) config('berrypanel.mysql_admin_password'),
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
            );

            $this->info('PASS MariaDB admin connection works');
        } catch (Throwable $exception) {
            $failed = true;
            $this->error('FAIL MariaDB admin connection failed: '.$exception->getMessage());
        }
    } else {
        $this->warn('SKIP MariaDB admin connection because BERRYPANEL_DATABASE_PROVISIONING_ENABLED=false');
    }

    if ($failed) {
        $this->newLine();
        $this->error('BerryPanel backend is not ready yet.');

        return 1;
    }

    $this->newLine();
    $this->info('BerryPanel backend is ready for the current Pi MVP test.');

    return 0;
})->purpose('Check whether the Raspberry Pi backend can provision BerryPanel resources');
