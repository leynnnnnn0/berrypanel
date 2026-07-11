<?php
namespace App\Services\Hosting;
use App\Models\HostingAuditLog; use App\Models\Site; use App\Models\User;
class AuditLogger { public function record(string $action,?Site $site=null,?User $user=null,array $metadata=[]): void { HostingAuditLog::create(['action'=>$action,'site_id'=>$site?->id,'user_id'=>$user?->id,'metadata'=>$metadata,'ip_address'=>request()?->ip()]); } }
