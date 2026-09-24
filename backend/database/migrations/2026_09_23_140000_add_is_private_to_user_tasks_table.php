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
        Schema::table('user_tasks', function (Blueprint $table) {
            $table->boolean('is_private')->default(false)->after('description')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_tasks', function (Blueprint $table) {
            $table->dropIndex(['is_private']);
            $table->dropColumn('is_private');
        });
    }
};
