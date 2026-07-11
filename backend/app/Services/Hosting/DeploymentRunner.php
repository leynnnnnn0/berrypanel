<?php
namespace App\Services\Hosting;
use App\Models\Deployment; use App\Models\DeploymentLog; use App\Services\NginxSiteProvisioner;
use Illuminate\Support\Facades\File; use RuntimeException; use Symfony\Component\Process\Process;
class DeploymentRunner {
    public function __construct(private SitePathResolver $paths,private SecretRedactor $redactor,private EnvironmentManager $env,private NginxSiteProvisioner $nginx) {}
    public function run(Deployment $deployment): void {
        $site=$deployment->site()->firstOrFail(); $started=microtime(true); $deployment->update(['status'=>'running','started_at'=>now()]); $site->update(['status'=>'deploying']);
        try {
            $root=$this->paths->root($site); if(!File::isDirectory($root.'/.git')){$this->command($deployment,'repository',['git','clone','--branch',$site->repository_branch,$site->repository_url,'.'],$root);}else{$this->command($deployment,'repository',['git','fetch','origin'],$root);} $this->command($deployment,'repository',['git','checkout',$deployment->commit_hash ?: $site->repository_branch],$root); if(!$deployment->commit_hash)$this->command($deployment,'repository',['git','pull','--ff-only','origin',$site->repository_branch],$root);
            $dirs=$this->paths->validateApplicationDirectories($site); $this->log($deployment,'validation','Configured Laravel and Node.js directories are valid.');
            $this->command($deployment,'composer',['composer','install','--no-dev','--optimize-autoloader','--no-interaction'],$dirs['backend']);
            $install=$this->approvedNodeCommand($site->node_install_command,$site->package_manager,'install'); $this->command($deployment,'node-install',$install,$dirs['frontend']);
            if($site->build_on_deploy)$this->command($deployment,'node-build',$this->approvedNodeCommand($site->node_build_command,$site->package_manager,'build'),$dirs['frontend']);
            foreach ([['php','artisan','storage:link'], ...($site->migrate_on_deploy?[['php','artisan','migrate','--force']]:[]), ['php','artisan','optimize']] as $cmd) $this->command($deployment,'laravel',$cmd,$dirs['backend']);
            $site->forceFill(['public_path'=>$dirs['public']])->save(); $this->nginx->provision($site->slug,$site->domain ?: $site->local_url,$dirs['public'],$site->php_version);
            $hash=trim($this->capture(['git','rev-parse','HEAD'],$root)); $health=$this->health($site->health_check_url);
            $deployment->update(['status'=>$health['ok']?'succeeded':'failed','commit_hash'=>$hash,'health_check_result'=>$health,'ended_at'=>now(),'duration_ms'=>(int)((microtime(true)-$started)*1000)]);
            $site->update(['status'=>$health['ok']?'online':'failed','current_commit'=>$hash]);
            if(!$health['ok']) throw new RuntimeException('Deployment health check failed.');
        } catch (\Throwable $e) {
            $this->log($deployment,'failure',$e->getMessage(),'error'); $deployment->update(['status'=>'failed','failed_step'=>$deployment->logs()->latest('id')->value('step'),'ended_at'=>now(),'duration_ms'=>(int)((microtime(true)-$started)*1000)]); $site->update(['status'=>'failed']); throw $e;
        }
    }
    private function command(Deployment $d,string $step,array $argv,string $cwd): void { $this->log($d,$step,'$ '.implode(' ',$argv)); $p=new Process($argv,$cwd);$p->setTimeout($d->site->deployment_timeout ?: 900);$p->run(function($type,$out)use($d,$step){foreach(preg_split('/\R/',trim($out)) as $line)if($line!=='')$this->log($d,$step,$line);}); if(!$p->isSuccessful()){ $d->update(['exit_code'=>$p->getExitCode()]); throw new RuntimeException("{$step} failed with exit code {$p->getExitCode()}."); } $this->log($d,$step,'Completed.', 'info',$p->getExitCode()); }
    private function approvedNodeCommand(string $input,string $manager,string $purpose): array { $allowed=['npm'=>['install'=>[['npm','ci'],['npm','install']],'build'=>[['npm','run','build']]],'yarn'=>['install'=>[['yarn','install','--frozen-lockfile']],'build'=>[['yarn','build']]],'pnpm'=>['install'=>[['pnpm','install','--frozen-lockfile']],'build'=>[['pnpm','run','build']]]]; $argv=preg_split('/\s+/',trim($input)); foreach($allowed[$manager][$purpose]??[] as $candidate)if($argv===$candidate)return $argv; throw new RuntimeException('Node command is not an approved package-manager command.'); }
    private function log(Deployment $d,string $step,string $message,string $level='info',?int $exit=null): void { $vars=array_merge($this->env->get($d->site,'laravel'),$this->env->get($d->site,'node')); DeploymentLog::create(['deployment_id'=>$d->id,'step'=>$step,'level'=>$level,'message'=>$this->redactor->redact($message,$vars),'exit_code'=>$exit,'logged_at'=>now()]); }
    private function capture(array $argv,string $cwd): string { $p=new Process($argv,$cwd);$p->mustRun();return $p->getOutput(); }
    private function health(?string $url): array { if(!$url)return ['ok'=>true,'skipped'=>true]; try{$p=new Process(['curl','--fail','--silent','--max-time','15',$url]);$p->run();return ['ok'=>$p->isSuccessful(),'exit_code'=>$p->getExitCode()];}catch(\Throwable $e){return ['ok'=>false,'error'=>$e->getMessage()];} }
}
