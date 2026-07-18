<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_plans', function (Blueprint $table): void {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->text('description');
            $table->unsignedInteger('price_centavos');
            $table->unsignedSmallInteger('billing_months')->default(1);
            $table->unsignedBigInteger('storage_bytes');
            $table->unsignedSmallInteger('laravel_site_limit')->default(0);
            $table->unsignedSmallInteger('hybrid_site_limit')->default(0);
            $table->boolean('background_services')->default(false);
            $table->json('features');
            $table->boolean('active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('billing_subscriptions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('billing_plan_id')->constrained()->restrictOnDelete();
            $table->string('status')->default('active');
            $table->timestamp('current_period_start');
            $table->timestamp('current_period_end');
            $table->timestamp('last_payment_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'current_period_end']);
        });

        Schema::create('billing_payments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('billing_plan_id')->constrained()->restrictOnDelete();
            $table->foreignId('billing_subscription_id')->nullable()->constrained()->nullOnDelete();
            $table->string('reference_number')->unique();
            $table->string('checkout_session_id')->nullable()->unique();
            $table->string('paymongo_payment_id')->nullable()->unique();
            $table->unsignedInteger('amount_centavos');
            $table->string('currency', 3)->default('PHP');
            $table->string('status')->default('pending');
            $table->text('checkout_url')->nullable();
            $table->string('payment_method')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
        });

        Schema::create('paymongo_webhook_events', function (Blueprint $table): void {
            $table->id();
            $table->string('event_key', 64)->unique();
            $table->string('event_type');
            $table->timestamp('processed_at');
            $table->timestamps();
        });

        $now = now();
        DB::table('billing_plans')->insert([
            [
                'slug' => 'laravel-starter',
                'name' => 'Laravel Starter',
                'description' => 'Simple Laravel hosting for portfolios and business applications.',
                'price_centavos' => 9900,
                'billing_months' => 1,
                'storage_bytes' => 2 * 1024 * 1024 * 1024,
                'laravel_site_limit' => 2,
                'hybrid_site_limit' => 0,
                'background_services' => false,
                'features' => json_encode(['2 Laravel sites', '2 GB storage', 'Managed deployment', 'Custom domain']),
                'active' => true,
                'sort_order' => 10,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'node-laravel',
                'name' => 'Node + Laravel',
                'description' => 'Hybrid hosting for a Laravel backend with a Node.js frontend.',
                'price_centavos' => 14900,
                'billing_months' => 1,
                'storage_bytes' => 5 * 1024 * 1024 * 1024,
                'laravel_site_limit' => 1,
                'hybrid_site_limit' => 1,
                'background_services' => false,
                'features' => json_encode(['1 Laravel site', '1 Node + Laravel site', '5 GB storage', 'Managed Node.js process']),
                'active' => true,
                'sort_order' => 20,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'full-stack',
                'name' => 'Full Stack',
                'description' => 'Full application hosting with managed background and real-time services.',
                'price_centavos' => 19900,
                'billing_months' => 1,
                'storage_bytes' => 5 * 1024 * 1024 * 1024,
                'laravel_site_limit' => 2,
                'hybrid_site_limit' => 1,
                'background_services' => true,
                'features' => json_encode(['2 Laravel sites', '1 Node + Laravel site', '5 GB storage', 'Queue, scheduler, and Reverb']),
                'active' => true,
                'sort_order' => 30,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('paymongo_webhook_events');
        Schema::dropIfExists('billing_payments');
        Schema::dropIfExists('billing_subscriptions');
        Schema::dropIfExists('billing_plans');
    }
};
