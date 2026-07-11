<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('sites', function (Blueprint $table): void {
            $table->string('backend_directory')->default('/')->after('repository_branch');
            $table->string('frontend_directory')->nullable()->after('backend_directory');
            $table->string('laravel_public_directory')->default('/public')->after('frontend_directory');
            $table->string('node_version')->default('20')->after('php_version');
            $table->string('package_manager')->default('npm')->after('node_version');
            $table->string('node_install_command')->default('npm ci');
            $table->string('node_build_command')->default('npm run build');
            $table->string('node_start_command')->default('npm run start');
            $table->string('domain')->nullable();
            $table->boolean('ssl_enabled')->default(false);
            $table->boolean('migrate_on_deploy')->default(false);
            $table->boolean('build_on_deploy')->default(true);
            $table->boolean('restart_services_on_deploy')->default(true);
            $table->string('health_check_url')->nullable();
            $table->unsignedInteger('deployment_timeout')->default(900);
            $table->string('current_commit', 40)->nullable();
        });

        Schema::create('site_environments', function (Blueprint $table): void {
            $table->id(); $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->string('scope', 20); $table->longText('variables'); $table->timestamps();
            $table->unique(['site_id', 'scope']);
        });
        Schema::create('deployments', function (Blueprint $table): void {
            $table->id(); $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('triggered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('queued'); $table->string('commit_hash', 40)->nullable();
            $table->string('branch'); $table->string('failed_step')->nullable(); $table->integer('exit_code')->nullable();
            $table->foreignId('previous_successful_deployment_id')->nullable()->constrained('deployments')->nullOnDelete();
            $table->json('enabled_services')->nullable(); $table->json('health_check_result')->nullable();
            $table->timestamp('started_at')->nullable(); $table->timestamp('ended_at')->nullable(); $table->unsignedInteger('duration_ms')->nullable();
            $table->timestamps();
        });
        Schema::create('deployment_logs', function (Blueprint $table): void {
            $table->id(); $table->foreignId('deployment_id')->constrained()->cascadeOnDelete();
            $table->string('step'); $table->string('level', 20)->default('info'); $table->text('message');
            $table->integer('exit_code')->nullable(); $table->timestamp('logged_at'); $table->index(['deployment_id', 'id']);
        });
        Schema::create('site_services', function (Blueprint $table): void {
            $table->id(); $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->string('name'); $table->string('type'); $table->string('working_directory'); $table->string('command');
            $table->unsignedSmallInteger('processes')->default(1); $table->string('restart_policy')->default('on-failure');
            $table->unsignedSmallInteger('max_retries')->default(3); $table->unsignedInteger('stop_timeout')->default(10);
            $table->string('environment_source')->default('laravel'); $table->string('log_file')->nullable();
            $table->boolean('enabled')->default(true); $table->string('status')->default('stopped'); $table->integer('process_id')->nullable();
            $table->unsignedInteger('restart_count')->default(0); $table->timestamp('last_started_at')->nullable();
            $table->timestamp('last_stopped_at')->nullable(); $table->integer('last_exit_code')->nullable(); $table->timestamps();
            $table->unique(['site_id', 'name']);
        });
        Schema::create('service_logs', function (Blueprint $table): void {
            $table->id(); $table->foreignId('site_service_id')->constrained()->cascadeOnDelete();
            $table->string('level', 20)->default('info'); $table->text('message'); $table->timestamp('logged_at');
        });
        Schema::create('terminal_executions', function (Blueprint $table): void {
            $table->id(); $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); $table->string('command');
            $table->string('working_directory'); $table->integer('exit_code')->nullable(); $table->unsignedInteger('duration_ms')->nullable();
            $table->text('output')->nullable(); $table->timestamps();
        });
        Schema::create('hosting_audit_logs', function (Blueprint $table): void {
            $table->id(); $table->foreignId('site_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); $table->string('action');
            $table->json('metadata')->nullable(); $table->string('ip_address', 45)->nullable(); $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['hosting_audit_logs','terminal_executions','service_logs','site_services','deployment_logs','deployments','site_environments'] as $table) Schema::dropIfExists($table);
        Schema::table('sites', function (Blueprint $table): void { $table->dropColumn(['backend_directory','frontend_directory','laravel_public_directory','node_version','package_manager','node_install_command','node_build_command','node_start_command','domain','ssl_enabled','migrate_on_deploy','build_on_deploy','restart_services_on_deploy','health_check_url','deployment_timeout','current_commit']); });
    }
};
