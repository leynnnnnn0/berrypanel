<?php
namespace App\Events;
use App\Models\Deployment; use Illuminate\Broadcasting\PrivateChannel; use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; use Illuminate\Foundation\Events\Dispatchable; use Illuminate\Queue\SerializesModels;
class DeploymentUpdated implements ShouldBroadcastNow { use Dispatchable,SerializesModels; public function __construct(public Deployment $deployment){} public function broadcastOn():array{return [new PrivateChannel('hosting.site.'.$this->deployment->site_id)];} public function broadcastAs():string{return 'deployment.updated';} public function broadcastWith():array{return ['deployment'=>$this->deployment->fresh()->toArray()];} }
