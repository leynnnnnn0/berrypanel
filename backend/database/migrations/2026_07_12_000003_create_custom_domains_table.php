<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('custom_domains', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('site_id')->nullable()->constrained()->nullOnDelete();
            $table->string('hostname', 253)->unique();
            $table->string('cloudflare_id')->nullable()->unique();
            $table->string('status', 40)->default('pending');
            $table->string('validation_name', 253)->nullable();
            $table->text('validation_value')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void { Schema::dropIfExists('custom_domains'); }
};
