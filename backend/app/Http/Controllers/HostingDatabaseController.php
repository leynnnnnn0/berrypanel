<?php

namespace App\Http\Controllers;

use App\Models\HostingDatabase;
use App\Models\Site;
use App\Services\DatabaseProvisioner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use RuntimeException;

class HostingDatabaseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'databases' => $request->user()
                ->hostingDatabases()
                ->with('site:id,name,local_url')
                ->latest()
                ->get()
                ->map(fn (HostingDatabase $database) => $this->serialize($database)),
        ]);
    }

    public function store(Request $request, DatabaseProvisioner $provisioner): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'database_suffix' => ['required', 'string', 'max:32', 'regex:/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/'],
            'username_suffix' => ['required', 'string', 'max:32', 'regex:/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/'],
            'password' => ['required', 'string', 'min:8', 'max:255'],
            'site_id' => ['nullable', 'integer', 'exists:sites,id'],
        ], [
            'database_suffix.regex' => 'Database name can only contain letters, numbers, underscores, and hyphens.',
            'username_suffix.regex' => 'Username can only contain letters, numbers, underscores, and hyphens.',
        ]);

        $prefix = $this->databasePrefix($user->linux_username ?: 'user_'.$user->id);
        $databaseName = $this->databaseIdentifier($prefix, $validated['database_suffix']);
        $username = $this->databaseIdentifier($prefix, $validated['username_suffix']);

        if (($validated['site_id'] ?? null) && ! Site::where('user_id', $user->id)->whereKey($validated['site_id'])->exists()) {
            abort(404);
        }

        if (HostingDatabase::where('user_id', $user->id)->where('name', $databaseName)->exists()) {
            return response()->json(['message' => 'You already have a database with this name.'], 422);
        }

        if (HostingDatabase::where('user_id', $user->id)->where('username', $username)->exists()) {
            return response()->json(['message' => 'You already have a database user with this username.'], 422);
        }

        try {
            $provisioner->provision($databaseName, $username, $validated['password']);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        $database = HostingDatabase::create([
            'user_id' => $user->id,
            'site_id' => $validated['site_id'] ?? null,
            'name' => $databaseName,
            'username' => $username,
            'password' => $validated['password'],
            'driver' => 'mysql',
            'host' => '127.0.0.1',
            'port' => 3306,
            'status' => 'provisioned',
        ]);

        return response()->json(['database' => $this->serialize($database->load('site:id,name,local_url'))], 201);
    }

    public function destroy(Request $request, DatabaseProvisioner $provisioner, HostingDatabase $database): JsonResponse
    {
        if ($database->user_id !== $request->user()->id) {
            abort(404);
        }

        try {
            $provisioner->drop($database->name, $database->username);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        $database->delete();

        return response()->json(['deleted' => true]);
    }

    private function serialize(HostingDatabase $database): array
    {
        return [
            'id' => $database->id,
            'name' => $database->name,
            'username' => $database->username,
            'driver' => $database->driver,
            'host' => $database->host,
            'port' => $database->port,
            'status' => $database->status,
            'site' => $database->site ? [
                'id' => $database->site->id,
                'name' => $database->site->name,
                'local_url' => $database->site->local_url,
            ] : null,
            'created_at' => $database->created_at?->toDateString(),
        ];
    }

    private function databasePrefix(string $linuxUsername): string
    {
        return Str::of($linuxUsername)
            ->lower()
            ->replaceMatches('/[^a-z0-9_]/', '_')
            ->trim('_')
            ->append('_')
            ->toString();
    }

    private function databaseIdentifier(string $prefix, string $suffix): string
    {
        $suffix = Str::of($suffix)
            ->lower()
            ->replace('-', '_')
            ->replaceMatches('/[^a-z0-9_]/', '_')
            ->trim('_')
            ->toString();

        return Str::limit($prefix.$suffix, 64, '');
    }
}
