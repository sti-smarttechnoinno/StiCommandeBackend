<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::transaction(function () {
            DB::statement('PRAGMA foreign_keys = OFF;');

            // Drop existing indexes if present in SQLite
            DB::statement('DROP INDEX IF EXISTS orders_order_code_unique;');
            DB::statement('DROP INDEX IF EXISTS orders_status_index;');
            DB::statement('DROP INDEX IF EXISTS orders_client_id_index;');
            DB::statement('DROP INDEX IF EXISTS orders_delegate_id_index;');
            DB::statement('DROP INDEX IF EXISTS orders_created_at_index;');

            // Rename existing orders table
            DB::statement('ALTER TABLE orders RENAME TO orders_old;');

            // Recreate orders table with status as string (no restrictive enum check constraint)
            Schema::create('orders', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('order_code')->unique();
                $table->uuid('client_id')->nullable();
                $table->string('client_name');
                $table->uuid('delegate_id')->nullable();
                $table->string('delegate_name')->default('Unassigned');
                $table->string('region')->default('Algiers');
                $table->string('wilaya')->nullable();
                $table->decimal('total_amount', 12, 2)->default(0);
                $table->string('status')->default('pending');
                $table->string('payment_method')->default('Cash on Delivery');
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index('status');
                $table->index('client_id');
                $table->index('delegate_id');
                $table->index('created_at');
            });

            // Copy all existing records from orders_old to orders
            DB::statement('INSERT INTO orders SELECT id, order_code, client_id, client_name, delegate_id, delegate_name, region, wilaya, total_amount, status, payment_method, notes, created_at, updated_at FROM orders_old;');

            // Drop old table
            DB::statement('DROP TABLE orders_old;');

            DB::statement('PRAGMA foreign_keys = ON;');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
