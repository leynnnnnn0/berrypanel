<?php

use App\Models\User;
use App\Services\SiteProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Symfony\Component\Process\Process;

uses(RefreshDatabase::class);

test('frontend build failure does not prevent a github site from being created', function () {
    $usersRoot = storage_path('framework/testing/berrypanel-provisioner-users');
    $repoRoot = storage_path('framework/testing/berrypanel-provisioner-repo');

    File::deleteDirectory($usersRoot);
    File::deleteDirectory($repoRoot);
    File::ensureDirectoryExists($usersRoot, 0775, true);
    File::ensureDirectoryExists($repoRoot, 0775, true);

    File::put($repoRoot.'/artisan', <<<'PHP'
#!/usr/bin/env php
<?php
exit(0);
PHP);
    File::put($repoRoot.'/.env.example', "APP_NAME=Laravel\nAPP_KEY=\n");
    File::put($repoRoot.'/package.json', <<<'JSON'
{
  "private": true,
  "scripts": {
    "build": "berrypanel-missing-vite-binary --version"
  }
}
JSON);

    runProcess(['git', 'init', '--initial-branch=main'], $repoRoot);
    runProcess(['git', 'config', 'user.email', 'berrypanel@example.test'], $repoRoot);
    runProcess(['git', 'config', 'user.name', 'BerryPanel Test'], $repoRoot);
    runProcess(['git', 'add', '.'], $repoRoot);
    runProcess(['git', 'commit', '-m', 'Initial fake Laravel app'], $repoRoot);

    config([
        'berrypanel.users_root' => $usersRoot,
        'berrypanel.git_deploy_enabled' => true,
    ]);

    $user = User::factory()->create(['linux_username' => 'user_1']);

    $result = app(SiteProvisioner::class)->provision($user, 'loanly', $repoRoot, 'main');

    expect($result['root_path'])->toBe($usersRoot.'/user_1/sites/loanly')
        ->and(File::isDirectory($result['root_path']))->toBeTrue()
        ->and(File::exists($result['root_path'].'/artisan'))->toBeTrue()
        ->and($result['deployment_warnings'])->toHaveCount(1)
        ->and($result['deployment_warnings'][0])->toContain('Frontend build failed')
        ->and($result['deployment_warnings'][0])->toContain('berrypanel-missing-vite-binary');
});

function runProcess(array $command, string $workingDirectory): void
{
    $process = new Process($command, $workingDirectory);
    $process->setTimeout(60);
    $process->mustRun();
}
