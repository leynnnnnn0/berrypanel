<?php

namespace App\Http\Controllers;

use App\Models\Site;
use App\Services\SiteCommandRunner;
use App\Services\SitePresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class SiteCommandController extends Controller
{
    public function __invoke(
        Request $request,
        Site $site,
        SiteCommandRunner $runner,
        SitePresenter $presenter,
    ): JsonResponse {
        if ($site->user_id !== $request->user()->id) {
            abort(404);
        }

        $validated = $request->validate([
            'command' => ['required', 'string', 'max:180'],
        ]);

        try {
            $result = $runner->run($site, $validated['command']);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'result' => $result,
            'site' => $presenter->toArray($site->refresh(), includeEnvironment: true),
        ]);
    }
}
