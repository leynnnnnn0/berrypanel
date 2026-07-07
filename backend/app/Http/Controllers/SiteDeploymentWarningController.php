<?php

namespace App\Http\Controllers;

use App\Models\Site;
use App\Services\SiteEnvironmentService;
use App\Services\SitePresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiteDeploymentWarningController extends Controller
{
    public function destroy(Request $request, SiteEnvironmentService $environment, SitePresenter $presenter, Site $site): JsonResponse
    {
        if ($site->user_id !== $request->user()->id) {
            abort(404);
        }

        $variables = $environment->forSite($site);

        $site->forceFill([
            'deployment_warnings' => [],
            'env_variables' => $variables,
            'status' => $environment->statusFor($variables),
        ])->save();

        return response()->json(['site' => $presenter->toArray($site->refresh(), includeEnvironment: true)]);
    }
}
