<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sites', function (Blueprint $table): void {
            $table->string('availability_status', 20)->default('unknown')->after('health_check_url');
            $table->unsignedSmallInteger('availability_http_status')->nullable()->after('availability_status');
            $table->unsignedInteger('availability_response_ms')->nullable()->after('availability_http_status');
            $table->timestamp('availability_checked_at')->nullable()->after('availability_response_ms');
            $table->text('availability_error')->nullable()->after('availability_checked_at');
        });
    }

    public function down(): void
    {
        Schema::table('sites', function (Blueprint $table): void {
            $table->dropColumn([
                'availability_status',
                'availability_http_status',
                'availability_response_ms',
                'availability_checked_at',
                'availability_error',
            ]);
        });
    }
};
