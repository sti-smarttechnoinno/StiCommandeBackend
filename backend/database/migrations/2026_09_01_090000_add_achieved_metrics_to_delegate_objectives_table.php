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
        Schema::table('delegate_objectives', function (Blueprint $table) {
            if (!Schema::hasColumn('delegate_objectives', 'achieved_revenue')) {
                $table->decimal('achieved_revenue', 15, 2)->nullable()->after('target_orders');
            }
            if (!Schema::hasColumn('delegate_objectives', 'achieved_orders')) {
                $table->unsignedInteger('achieved_orders')->nullable()->after('achieved_revenue');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('delegate_objectives', function (Blueprint $table) {
            if (Schema::hasColumn('delegate_objectives', 'achieved_revenue')) {
                $table->dropColumn('achieved_revenue');
            }
            if (Schema::hasColumn('delegate_objectives', 'achieved_orders')) {
                $table->dropColumn('achieved_orders');
            }
        });
    }
};
