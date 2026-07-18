<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('billing_plans')->where('slug', 'starter')->update([
            'laravel_site_limit' => 2,
            'features' => json_encode(['2 Laravel sites', 'Jobs and scheduler for 1 site', 'No Reverb']),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('billing_plans')->where('slug', 'starter')->update([
            'laravel_site_limit' => 1,
            'features' => json_encode(['1 Laravel site', 'Jobs and scheduler for 1 site', 'No Reverb']),
            'updated_at' => now(),
        ]);
    }
};
