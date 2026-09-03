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

        // Seed order_items for any orders that currently have 0 items
        $ordersWithoutItems = Order::doesntHave('items')->get();
        $sampleProduct = Product::first();

        foreach ($ordersWithoutItems as $order) {
            if ($order->order_code === 'ORD-2026-000001') {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $sampleProduct?->id,
                    'product_name' => $sampleProduct?->name ?? 'Recharge Djezzy 1000 DA',
                    'reference' => $sampleProduct?->sku ?? 'SKU-DJZ-1000',
                    'unit_price' => 1000,
                    'quantity' => 10,
                    'validated_quantity' => 5,
                    'subtotal' => 5000,
                ]);
                $order->update(['total_amount' => 5000, 'status' => 'partially_validated']);
            } elseif ($order->order_code === 'ORD-2026-000002') {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $sampleProduct?->id,
                    'product_name' => 'Carte Mobilis 500 DA',
                    'reference' => 'SKU-MOB-500',
                    'unit_price' => 500,
                    'quantity' => 20,
                    'validated_quantity' => 10,
                    'subtotal' => 5000,
                ]);
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $sampleProduct?->id,
                    'product_name' => 'Puce Ooredoo Gold',
                    'reference' => 'SKU-OOR-GLD',
                    'unit_price' => 1000,
                    'quantity' => 15,
                    'validated_quantity' => 10,
                    'subtotal' => 10000,
                ]);
                $order->update(['total_amount' => 15000, 'status' => 'partially_validated']);
            } elseif ($order->order_code === 'ORD-2026-000003') {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $sampleProduct?->id,
                    'product_name' => 'Terminal Flexy Djezzy Pro',
                    'reference' => 'SKU-DJZ-TER',
                    'unit_price' => 20000,
                    'quantity' => 5,
                    'validated_quantity' => 5,
                    'subtotal' => 100000,
                ]);
                $order->update(['total_amount' => 100000, 'status' => 'validated']);
            } else {
                // Default fallback item
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $sampleProduct?->id,
                    'product_name' => 'Produit Distribution Standard',
                    'reference' => 'SKU-STD-001',
                    'unit_price' => 1000,
                    'quantity' => 10,
                    'validated_quantity' => 10,
                    'subtotal' => 10000,
                ]);
                $order->update(['total_amount' => 10000]);
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
