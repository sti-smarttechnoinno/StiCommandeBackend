<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('encaissements', function (Blueprint $table) {
            $table->text('label')->nullable()->change();
            $table->text('reference')->nullable()->change();
            $table->text('tiers_name')->nullable()->change();
            $table->text('account')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('encaissements', function (Blueprint $table) {
            $table->string('label', 255)->nullable()->change();
            $table->string('reference', 255)->nullable()->change();
            $table->string('tiers_name', 255)->nullable()->change();
            $table->string('account', 255)->nullable()->change();
        });
    }
};
