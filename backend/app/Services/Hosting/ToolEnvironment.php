<?php

namespace App\Services\Hosting;

use Illuminate\Support\Facades\File;

class ToolEnvironment
{
    public function variables(): array
    {
        $home = storage_path('app/berrypanel/tool-home');
        $composerCache = $home.'/composer-cache';
        $npmCache = $home.'/npm-cache';

        File::ensureDirectoryExists($composerCache, 0775, true);
        File::ensureDirectoryExists($npmCache, 0775, true);

        $inherited = array_filter(explode(':', (string) getenv('PATH')));
        $path = implode(':', array_values(array_unique([
            '/usr/local/bin',
            '/usr/bin',
            '/bin',
            '/usr/local/sbin',
            '/usr/sbin',
            '/sbin',
            ...$inherited,
        ])));

        return [
            'COMPOSER_ALLOW_SUPERUSER' => '1',
            'COMPOSER_HOME' => $home,
            'COMPOSER_CACHE_DIR' => $composerCache,
            'HOME' => $home,
            'npm_config_cache' => $npmCache,
            'PATH' => $path,
        ];
    }
}
