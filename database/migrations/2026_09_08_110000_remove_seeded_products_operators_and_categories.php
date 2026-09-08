<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Remove stock movements if any exist
        if (Schema::hasTable('stock_movements')) {
            DB::table('stock_movements')->delete();
        }

        // 2. Unlink any product_id references in order_items before deleting products
        if (Schema::hasTable('order_items')) {
            DB::table('order_items')->update(['product_id' => null]);
        }

        // 3. Remove products inventory
        if (Schema::hasTable('products')) {
            DB::table('products')->delete();
        }

        // 4. Remove seeded operators
        if (Schema::hasTable('operators')) {
            DB::table('operators')->delete();
        }

        // 5. Remove seeded categories
        if (Schema::hasTable('categories')) {
            DB::table('categories')->delete();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reversal needed
    }
};
