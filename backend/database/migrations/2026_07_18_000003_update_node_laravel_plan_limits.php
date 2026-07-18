<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('billing_plans')
            ->where('slug', 'node-laravel')
            ->update([
                'laravel_site_limit' => 2,
                'features' => json_encode([
                    '2 Laravel sites',
                    '1 Node + Laravel site',
                    '5 GB storage',
                    'Managed Node.js process',
                ]),
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        DB::table('billing_plans')
            ->where('slug', 'node-laravel')
            ->update([
                'laravel_site_limit' => 1,
                'features' => json_encode([
                    '1 Laravel site',
                    '1 Node + Laravel site',
                    '5 GB storage',
                    'Managed Node.js process',
                ]),
                'updated_at' => now(),
            ]);
    }
};
