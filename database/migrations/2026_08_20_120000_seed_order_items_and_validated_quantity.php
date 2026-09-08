<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');

            // Drop existing indexes if any
            DB::statement('DROP INDEX IF EXISTS order_items_order_id_index;');
            DB::statement('DROP INDEX IF EXISTS order_items_product_id_index;');

            // Rename existing table
            DB::statement('DROP TABLE IF EXISTS order_items_old;');
            DB::statement('ALTER TABLE order_items RENAME TO order_items_old;');

            // Recreate order_items referencing orders correctly
            Schema::create('order_items', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('order_id')->constrained('orders')->cascadeOnDelete();
                $table->uuid('product_id')->nullable();
                $table->string('product_name');
                $table->string('reference')->nullable();
                $table->decimal('unit_price', 12, 2)->default(0);
                $table->integer('quantity')->default(1);
                $table->integer('validated_quantity')->nullable();
                $table->decimal('subtotal', 12, 2)->default(0);
                $table->timestamps();

                $table->index('order_id');
                $table->index('product_id');
            });

            // Copy existing items if any
            DB::statement('INSERT INTO order_items (id, order_id, product_id, product_name, reference, unit_price, quantity, subtotal, created_at, updated_at) SELECT id, order_id, product_id, product_name, reference, unit_price, quantity, subtotal, created_at, updated_at FROM order_items_old;');
            DB::statement('DROP TABLE order_items_old;');
            DB::statement('PRAGMA foreign_keys = ON;');
        } else {
            if (!Schema::hasColumn('order_items', 'validated_quantity')) {
                Schema::table('order_items', function (Blueprint $table) {
                    $table->integer('validated_quantity')->nullable()->after('quantity');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
