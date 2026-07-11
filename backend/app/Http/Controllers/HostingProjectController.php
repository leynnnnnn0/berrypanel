<?php
namespace App\Http\Controllers;
use App\Http\Requests\UpdateHostingSettingsRequest; use App\Models\Site; use App\Services\Hosting\AuditLogger; use Illuminate\Http\JsonResponse;
class HostingProjectController extends Controller { public function update(UpdateHostingSettingsRequest $request,Site $site,AuditLogger $audit):JsonResponse{$site->update($request->validated());$audit->record('hosting.settings.updated',$site,$request->user());return response()->json(['site'=>$site->fresh()]);} }
