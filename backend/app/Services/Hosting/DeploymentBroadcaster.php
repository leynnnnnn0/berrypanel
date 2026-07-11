<?php
namespace App\Services\Hosting;
use App\Events\DeploymentLogCreated; use App\Events\DeploymentUpdated; use App\Models\Deployment; use App\Models\DeploymentLog; use Illuminate\Support\Facades\Log;
class DeploymentBroadcaster { public function deployment(Deployment $deployment):void{try{broadcast(new DeploymentUpdated($deployment));}catch(\Throwable $e){Log::warning('Deployment realtime broadcast failed',['deployment_id'=>$deployment->id,'error'=>$e->getMessage()]);}} public function log(DeploymentLog $log,int $siteId):void{try{broadcast(new DeploymentLogCreated($log,$siteId));}catch(\Throwable $e){Log::warning('Deployment log broadcast failed',['deployment_id'=>$log->deployment_id,'error'=>$e->getMessage()]);}} }
