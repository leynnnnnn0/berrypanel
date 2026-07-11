<?php
namespace App\Http\Controllers;
use App\Models\Site; use App\Models\TerminalExecution; use App\Services\Hosting\AuditLogger; use App\Services\Hosting\RestrictedCommandExecutor; use Illuminate\Http\JsonResponse; use Illuminate\Http\Request; use RuntimeException;
class HostingTerminalController extends Controller {
 public function store(Request $r,Site $site,RestrictedCommandExecutor $executor,AuditLogger $audit):JsonResponse{$this->authorize('terminal',$site);$v=$r->validate(['command'=>['required','string','max:180'],'scope'=>['required','in:laravel,node,root'],'confirmed'=>['sometimes','boolean']]);try{$result=$executor->run($site,$r->user(),$v['command'],$v['scope'],$v['confirmed']??false);}catch(RuntimeException $e){return response()->json(['message'=>$e->getMessage()],422);}$audit->record('terminal.executed',$site,$r->user(),['command'=>$v['command'],'exit_code'=>$result['exit_code']]);return response()->json(['result'=>$result]);}
 public function index(Request $r,Site $site):JsonResponse{$this->authorize('terminal',$site);return response()->json(['history'=>TerminalExecution::where('site_id',$site->id)->with('user:id,name')->latest()->paginate(50)]);}
}
