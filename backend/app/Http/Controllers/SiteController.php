<?php

namespace App\Http\Controllers;

use App\Models\Site;
use App\Models\User;
use App\Services\SiteProvisioner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use RuntimeException;

class SiteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'sites' => $request->user()
                ->sites()
                ->latest()
                ->get()
                ->map(fn (Site $site) => $this->serialize($site)),
        ]);
    }

    public function store(Request $request, SiteProvisioner $provisioner): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:62', 'regex:/^[a-zA-Z0-9][a-zA-Z0-9 -]*[a-zA-Z0-9]$/'],
            'repository_url' => [
                'required',
                'url',
                'max:255',
                'regex:/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/',
            ],
            'repository_branch' => ['nullable', 'string', 'max:80', 'regex:/^[A-Za-z0-9._\/-]+$/'],
            'php_version' => ['nullable', 'string', 'in:8.3,8.4'],
        ], [
            'repository_url.regex' => 'Enter a public GitHub HTTPS repository URL like https://github.com/user/repo.',
            'repository_branch.regex' => 'Branch can only contain letters, numbers, dots, slashes, underscores, or hyphens.',
        ]);

        $slug = Str::slug($validated['name']);

        if (Site::where('user_id', $user->id)->where('slug', $slug)->exists()) {
            return response()->json(['message' => 'You already have a site with this name.'], 422);
        }

        if (! $user->linux_username) {
            $user->forceFill(['linux_username' => 'user_'.$user->id])->save();
        }

        try {
            $paths = $provisioner->provision($user, $slug);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        $site = Site::create([
            'user_id' => $user->id,
            'name' => $validated['name'],
            'slug' => $slug,
            'stack' => 'Laravel / Inertia',
            'php_version' => $validated['php_version'] ?? '8.4',
            'status' => 'provisioned',
            'root_path' => $paths['root_path'],
            'public_path' => $paths['public_path'],
            'local_url' => "{$slug}.berrypanel.local",
            'repository_url' => $validated['repository_url'],
            'repository_branch' => $validated['repository_branch'] ?? 'main',
        ]);

        return response()->json(['site' => $this->serialize($site)], 201);
    }

    public function destroy(Request $request, SiteProvisioner $provisioner, Site $site): JsonResponse
    {
        if ($site->user_id !== $request->user()->id) {
            abort(404);
        }

        try {
            $provisioner->delete($site);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        $site->delete();

        return response()->json(['deleted' => true]);
    }

    private function serialize(Site $site): array
    {
        return [
            'id' => $site->id,
            'name' => $site->name,
            'slug' => $site->slug,
            'stack' => $site->stack,
            'php_version' => $site->php_version,
            'status' => $site->status,
            'root_path' => $site->root_path,
            'public_path' => $site->public_path,
            'local_url' => $site->local_url,
            'repository_url' => $site->repository_url,
            'repository_branch' => $site->repository_branch,
            'created_at' => $site->created_at?->toISOString(),
        ];
    }
}
