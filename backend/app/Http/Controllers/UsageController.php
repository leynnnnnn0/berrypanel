<?php

namespace App\Http\Controllers;

use App\Services\StorageUsageReporter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UsageController extends Controller
{
    public function show(Request $request, StorageUsageReporter $usage): JsonResponse
    {
        return response()->json([
            'usage' => $usage->forUser($request->user()),
        ]);
    }
}
