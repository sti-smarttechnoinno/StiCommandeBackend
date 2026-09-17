<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 50)->unique();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('product_name', 255);
            $table->enum('movement_type', ['incoming', 'outgoing', 'transfer', 'adjustment'])->default('incoming');
            $table->integer('quantity');
            $table->string('warehouse', 100)->default('Main Warehouse');
            $table->string('destination_warehouse', 100)->nullable();
            $table->string('delegate_name', 150)->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['completed', 'pending', 'in_transit', 'cancelled'])->default('completed');
            $table->timestamp('date')->useCurrent();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['movement_type', 'status']);
            $table->index('warehouse');
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
