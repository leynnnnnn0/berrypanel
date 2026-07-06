<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->text('ssh_public_key')->nullable()->after('linux_username');
            $table->boolean('ssh_enabled')->default(false)->after('ssh_public_key');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['ssh_public_key', 'ssh_enabled']);
        });
    }
};
