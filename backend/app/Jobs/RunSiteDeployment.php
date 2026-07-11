<?php
namespace App\Jobs;
use App\Models\Deployment; use App\Services\Hosting\DeploymentRunner; use Illuminate\Bus\Queueable; use Illuminate\Contracts\Queue\ShouldQueue; use Illuminate\Foundation\Bus\Dispatchable; use Illuminate\Queue\InteractsWithQueue; use Illuminate\Queue\SerializesModels;
class RunSiteDeployment implements ShouldQueue { use Dispatchable,InteractsWithQueue,Queueable,SerializesModels; public int $timeout=1800; public function __construct(public int $deploymentId){} public function handle(DeploymentRunner $runner): void{$runner->run(Deployment::findOrFail($this->deploymentId));} }
