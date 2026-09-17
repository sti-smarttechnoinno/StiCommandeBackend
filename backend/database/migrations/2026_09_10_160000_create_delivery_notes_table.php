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
        Schema::create('delivery_notes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('delivery_note_code')->unique();
            $table->foreignUuid('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->string('order_code')->index();
            $table->unsignedBigInteger('client_id')->nullable()->index();
            $table->string('client_name');
            $table->unsignedBigInteger('delegate_id')->nullable()->index();
            $table->string('delegate_name')->nullable();
            $table->string('region')->index();
            $table->string('wilaya')->index();
            $table->string('delivery_address')->nullable();
            $table->string('status')->default('in_transit')->index(); // pending, in_transit, delivered, cancelled
            $table->string('validation_type')->default('full')->index(); // full, partial
            $table->integer('batch_number')->default(1);
            $table->integer('total_quantity')->default(0);
            $table->decimal('total_amount', 12, 2)->default(0.00);
            $table->string('validated_by')->nullable();
            $table->timestamp('validated_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('created_at');
        });

        Schema::create('delivery_note_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('delivery_note_id')->constrained('delivery_notes')->cascadeOnDelete();
            $table->uuid('order_item_id')->nullable();
            $table->unsignedBigInteger('product_id')->nullable()->index();
            $table->string('product_name');
            $table->string('reference')->nullable();
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 12, 2)->default(0.00);
            $table->decimal('subtotal', 12, 2)->default(0.00);
            $table->timestamps();

            $table->index('delivery_note_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('delivery_note_items');
        Schema::dropIfExists('delivery_notes');
    }
};
