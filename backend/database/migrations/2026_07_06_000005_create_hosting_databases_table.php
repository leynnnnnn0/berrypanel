<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hosting_databases', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('site_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name', 64);
            $table->string('username', 64);
            $table->text('password');
            $table->string('driver')->default('mysql');
            $table->string('host')->default('127.0.0.1');
            $table->unsignedInteger('port')->default(3306);
            $table->string('status')->default('provisioned');
            $table->timestamps();

            $table->unique(['user_id', 'name']);
            $table->unique(['user_id', 'username']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hosting_databases');
    }
};
