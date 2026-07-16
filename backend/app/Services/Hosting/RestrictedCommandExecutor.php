<?php
namespace App\Services\Hosting;
use App\Models\Site; use App\Models\TerminalExecution; use App\Models\User; use RuntimeException; use Symfony\Component\Process\Process;
class RestrictedCommandExecutor {
 public function __construct(private SitePathResolver $paths,private SecretRedactor $redactor,private EnvironmentManager $env){}
 public function run(Site $site,User $user,string $input,string $scope,bool $confirmed=false):array{
  $input=preg_replace('/\s+/',' ',trim($input))??''; if(preg_match('/[;&|`<>\n\r]|\$\(|\.\.\//',$input))throw new RuntimeException('Shell chaining, substitution, redirection, and traversal are not allowed.');
  $sensitive=in_array($input,['php artisan migrate','php artisan migrate --force','composer update'],true);if($sensitive&&!$confirmed)throw new RuntimeException('This command requires explicit confirmation.');
  $map=$this->commands($site);if(!isset($map[$input]))throw new RuntimeException('That command is not allowed.');
  $scope=$this->commandScope($input,$scope);$relative = $scope === 'node' ? $site->frontend_directory : ($scope === 'root' ? '/' : $site->backend_directory);
  $cwd=$this->paths->directory($site,$relative);$start=microtime(true);$p=new Process($map[$input],$cwd);$p->setTimeout(300);$p->setIdleTimeout(60);$p->run();
  $variables=array_merge($this->env->get($site,'laravel'),$this->env->get($site,'node'));$output=$this->redactor->redact(substr(trim($p->getOutput().PHP_EOL.$p->getErrorOutput()),0,1024*1024),$variables);
  $record=TerminalExecution::create(['site_id'=>$site->id,'user_id'=>$user->id,'command'=>$input,'working_directory'=>$scope,'exit_code'=>$p->getExitCode(),'duration_ms'=>(int)((microtime(true)-$start)*1000),'output'=>$output]);
  return ['id'=>$record->id,'command'=>$input,'output'=>$output?:'Command finished with no output.','exit_code'=>$p->getExitCode(),'successful'=>$p->isSuccessful(),'duration_ms'=>$record->duration_ms,'ran_at'=>$record->created_at];
 }
 private function commands(Site $site):array{$b=$site->repository_branch?:'main';return [
 'php artisan about'=>['php','artisan','about'],'php artisan migrate'=>['php','artisan','migrate'],'php artisan migrate --force'=>['php','artisan','migrate','--force'],'php artisan migrate:status'=>['php','artisan','migrate:status'],'php artisan cache:clear'=>['php','artisan','cache:clear'],'php artisan config:clear'=>['php','artisan','config:clear'],'php artisan route:clear'=>['php','artisan','route:clear'],'php artisan view:clear'=>['php','artisan','view:clear'],'php artisan optimize'=>['php','artisan','optimize'],'php artisan queue:restart'=>['php','artisan','queue:restart'],'php artisan reverb:restart'=>['php','artisan','reverb:restart'],'php artisan schedule:list'=>['php','artisan','schedule:list'],
 'composer install'=>['composer','install'],'composer update'=>['composer','update'],'composer dump-autoload'=>['composer','dump-autoload'],
 'npm install'=>['npm','install'],'npm ci'=>['npm','ci'],'npm run build'=>['npm','run','build'],'npm run start'=>['npm','run','start'],'npm run restart'=>['npm','run','restart'],'npm run lint'=>['npm','run','lint'],
 'git status'=>['git','status'],'git log'=>['git','log','-n','30','--oneline'],'git pull'=>['git','pull','--ff-only','origin',$b],"git pull origin {$b}"=>['git','pull','--ff-only','origin',$b],'git branch'=>['git','branch']];}
 private function commandScope(string $input,string $requested):string{if(str_starts_with($input,'git '))return 'root';if(str_starts_with($input,'npm ')||str_starts_with($input,'yarn ')||str_starts_with($input,'pnpm '))return 'node';return $requested;}
}
