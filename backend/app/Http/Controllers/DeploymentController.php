<?php
namespace App\Http\Controllers;
use App\Jobs\RunSiteDeployment; use App\Models\Deployment; use App\Models\Site; use App\Services\Hosting\AuditLogger; use Illuminate\Http\JsonResponse; use Illuminate\Http\Request;
class DeploymentController extends Controller {
 public function index(Request $r,Site $site):JsonResponse{$this->authorize('view',$site);return response()->json(['deployments'=>$site->deployments()->withCount('logs')->latest()->paginate(20)]);}
 public function store(Request $r,Site $site,AuditLogger $audit):JsonResponse{$this->authorize('deploy',$site);$v=$r->validate(['commit_hash'=>['nullable','regex:/^[a-f0-9]{40}$/']]);$previous=$site->deployments()->where('status','succeeded')->latest()->value('id');$d=$site->deployments()->create(['triggered_by'=>$r->user()->id,'status'=>'queued','branch'=>$site->repository_branch,'commit_hash'=>$v['commit_hash']??null,'previous_successful_deployment_id'=>$previous,'enabled_services'=>$site->services()->where('enabled',true)->pluck('id')]);RunSiteDeployment::dispatch($d->id);$audit->record('deployment.queued',$site,$r->user(),['deployment_id'=>$d->id]);return response()->json(['deployment'=>$d],202);}
 public function logs(Request $r,Site $site,Deployment $deployment):JsonResponse{$this->authorize('view',$site);abort_unless($deployment->site_id===$site->id,404);$after=max(0,(int)$r->query('after',0));return response()->json(['deployment'=>$deployment->fresh(),'logs'=>$deployment->logs()->where('id','>',$after)->orderBy('id')->limit(500)->get()]);}
}
