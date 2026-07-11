<?php
namespace App\Events;
use App\Models\DeploymentLog; use Illuminate\Broadcasting\PrivateChannel; use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; use Illuminate\Foundation\Events\Dispatchable; use Illuminate\Queue\SerializesModels;
class DeploymentLogCreated implements ShouldBroadcastNow { use Dispatchable,SerializesModels; public function __construct(public DeploymentLog $log,public int $siteId){} public function broadcastOn():array{return [new PrivateChannel('hosting.site.'.$this->siteId)];} public function broadcastAs():string{return 'deployment.log.created';} public function broadcastWith():array{return ['log'=>$this->log->toArray()];} }
