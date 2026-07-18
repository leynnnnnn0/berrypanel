<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('billing_plans', function (Blueprint $table): void {
            $table->unsignedSmallInteger('background_service_site_limit')->default(0)->after('hybrid_site_limit');
            $table->unsignedSmallInteger('reverb_site_limit')->default(0)->after('background_service_site_limit');
        });

        $now = now();
        $gb = 1024 * 1024 * 1024;
        $plans = [
            [
                'slug' => 'free',
                'name' => 'Free',
                'description' => 'Essential Laravel hosting for getting started.',
                'price_centavos' => 0,
                'billing_months' => 1,
                'storage_bytes' => (int) round(1.2 * $gb),
                'laravel_site_limit' => 2,
                'hybrid_site_limit' => 0,
                'background_service_site_limit' => 0,
                'reverb_site_limit' => 0,
                'background_services' => false,
                'features' => json_encode(['2 Laravel sites', 'No background jobs or scheduler', 'No Reverb']),
                'active' => true,
                'sort_order' => 0,
            ],
            [
                'slug' => 'starter',
                'name' => 'Starter',
                'description' => 'Laravel hosting with managed jobs and scheduled tasks.',
                'price_centavos' => 2000,
                'billing_months' => 1,
                'storage_bytes' => 2 * $gb,
                'laravel_site_limit' => 1,
                'hybrid_site_limit' => 0,
                'background_service_site_limit' => 1,
                'reverb_site_limit' => 0,
                'background_services' => true,
                'features' => json_encode(['1 Laravel site', 'Jobs and scheduler for 1 site', 'No Reverb']),
                'active' => true,
                'sort_order' => 10,
            ],
            [
                'slug' => 'pro',
                'name' => 'Pro',
                'description' => 'More Laravel sites with background and real-time services.',
                'price_centavos' => 3400,
                'billing_months' => 1,
                'storage_bytes' => 5 * $gb,
                'laravel_site_limit' => 3,
                'hybrid_site_limit' => 0,
                'background_service_site_limit' => 2,
                'reverb_site_limit' => 2,
                'background_services' => true,
                'features' => json_encode(['3 Laravel sites', 'Jobs and scheduler for 2 sites', 'Reverb for 2 sites']),
                'active' => true,
                'sort_order' => 20,
            ],
            [
                'slug' => 'premium',
                'name' => 'Premium',
                'description' => 'Complete Laravel and Node.js hosting access.',
                'price_centavos' => 4900,
                'billing_months' => 1,
                'storage_bytes' => 5 * $gb,
                'laravel_site_limit' => 5,
                'hybrid_site_limit' => 1,
                'background_service_site_limit' => 6,
                'reverb_site_limit' => 6,
                'background_services' => true,
                'features' => json_encode(['5 Laravel sites', '1 Node + Laravel site', 'Jobs, scheduler and Reverb for every site']),
                'active' => true,
                'sort_order' => 30,
            ],
        ];

        foreach ($plans as $plan) {
            DB::table('billing_plans')->updateOrInsert(
                ['slug' => $plan['slug']],
                [...$plan, 'created_at' => $now, 'updated_at' => $now],
            );
        }

        $newPlanIds = DB::table('billing_plans')->whereIn('slug', ['starter', 'premium'])->pluck('id', 'slug');
        $oldPlanIds = DB::table('billing_plans')->whereIn('slug', ['laravel-starter', 'node-laravel', 'full-stack'])->pluck('id', 'slug');

        if (isset($oldPlanIds['laravel-starter'], $newPlanIds['starter'])) {
            DB::table('billing_subscriptions')->where('billing_plan_id', $oldPlanIds['laravel-starter'])->update(['billing_plan_id' => $newPlanIds['starter']]);
        }
        if (isset($newPlanIds['premium'])) {
            DB::table('billing_subscriptions')
                ->whereIn('billing_plan_id', collect([$oldPlanIds['node-laravel'] ?? null, $oldPlanIds['full-stack'] ?? null])->filter()->all())
                ->update(['billing_plan_id' => $newPlanIds['premium']]);
        }

        DB::table('billing_plans')
            ->whereIn('slug', ['laravel-starter', 'node-laravel', 'full-stack'])
            ->update(['active' => false, 'updated_at' => $now]);
    }

    public function down(): void
    {
        DB::table('billing_plans')->whereIn('slug', ['laravel-starter', 'node-laravel', 'full-stack'])->update(['active' => true]);
        DB::table('billing_plans')->whereIn('slug', ['free', 'starter', 'pro', 'premium'])->update(['active' => false]);

        Schema::table('billing_plans', function (Blueprint $table): void {
            $table->dropColumn(['background_service_site_limit', 'reverb_site_limit']);
        });
    }
};
