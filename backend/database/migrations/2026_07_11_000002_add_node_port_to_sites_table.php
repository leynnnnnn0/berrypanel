<?php
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema;
return new class extends Migration { public function up():void{Schema::table('sites',fn(Blueprint $table)=>$table->unsignedInteger('node_port')->nullable()->after('node_start_command'));} public function down():void{Schema::table('sites',fn(Blueprint $table)=>$table->dropColumn('node_port'));} };
