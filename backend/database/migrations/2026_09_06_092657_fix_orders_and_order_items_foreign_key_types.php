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
        if (\Illuminate\Support\Facades\DB::getDriverName() === 'pgsql') {
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE orders ALTER COLUMN delegate_id TYPE bigint USING NULL');
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE orders ALTER COLUMN client_id TYPE bigint USING NULL');
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE order_items ALTER COLUMN product_id TYPE bigint USING NULL');
        } else {
            Schema::table('orders', function (Blueprint $table) {
                $table->bigInteger('delegate_id')->nullable()->change();
                $table->bigInteger('client_id')->nullable()->change();
            });
            Schema::table('order_items', function (Blueprint $table) {
                $table->bigInteger('product_id')->nullable()->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (\Illuminate\Support\Facades\DB::getDriverName() === 'pgsql') {
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE orders ALTER COLUMN delegate_id TYPE uuid USING NULL');
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE orders ALTER COLUMN client_id TYPE uuid USING NULL');
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE order_items ALTER COLUMN product_id TYPE uuid USING NULL');
        }
    }
};
