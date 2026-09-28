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
        Schema::create('crm_quote_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quote_id')->constrained('crm_quotes')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('product_name');
            $table->string('reference')->nullable();
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->integer('quantity')->default(1);
            $table->decimal('discount_percent', 5, 2)->default(0);
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->timestamps();

            $table->index('quote_id');
            $table->index('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crm_quote_items');
    }
};
