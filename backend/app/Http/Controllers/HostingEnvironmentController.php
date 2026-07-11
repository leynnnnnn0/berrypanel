<?php
namespace App\Http\Controllers;
use App\Http\Requests\SaveHostingEnvironmentRequest; use App\Models\Site; use App\Services\Hosting\AuditLogger; use App\Services\Hosting\EnvironmentManager; use Illuminate\Http\JsonResponse; use Illuminate\Http\Request;
class HostingEnvironmentController extends Controller {
 public function index(Request $r,Site $site,EnvironmentManager $env):JsonResponse{$this->authorize('view',$site);return response()->json(['environments'=>['laravel'=>$env->get($site,'laravel'),'node'=>$env->get($site,'node')]]);}
 public function store(SaveHostingEnvironmentRequest $r,Site $site,EnvironmentManager $env,AuditLogger $audit):JsonResponse{$variables=$r->filled('content')?$env->parse($r->string('content')):$r->input('variables',[]);$record=$env->save($site,$r->string('scope'),$variables);$audit->record('environment.updated',$site,$r->user(),['scope'=>$record->scope,'keys'=>array_keys($variables)]);return response()->json(['scope'=>$record->scope,'variables'=>$record->variables]);}
}
