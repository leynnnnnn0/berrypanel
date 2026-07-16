<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('site_services', function (Blueprint $table): void {
            $table->string('install_command')->nullable()->after('command');
            $table->string('build_command')->nullable()->after('install_command');
            $table->unsignedInteger('internal_port')->nullable()->after('build_command');
        });
    }

    public function down(): void
    {
        Schema::table('site_services', function (Blueprint $table): void {
            $table->dropColumn(['install_command', 'build_command', 'internal_port']);
        });
    }
};
