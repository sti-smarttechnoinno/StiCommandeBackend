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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // e.g. ARS-MOB, FLX-DJZ, STR-OOR
            $table->string('name'); // e.g. Arselli Mobilis
            $table->string('barcode')->nullable();
            $table->string('category')->default('mobile_credit'); // mobile_credit, sim_cards, bundles, etc.
            $table->string('operator')->default('Mobilis'); // Mobilis, Djezzy, Ooredoo, Other
            $table->decimal('nominal_price', 12, 2)->default(0.00); // Base/Face value, e.g. 10000.00
            $table->decimal('discount_percent', 5, 2)->default(0.00); // Discount %, e.g. 4.00 for 4%
            $table->integer('stock_quantity')->default(0);
            $table->integer('min_stock')->default(100);
            $table->string('status')->default('active'); // active, low_stock, out_of_stock, inactive, draft
            $table->integer('reserved')->default(0);
            $table->string('warehouse')->default('Main Warehouse');
            $table->integer('total_sold')->default(0);
            $table->decimal('revenue', 14, 2)->default(0.00);
            $table->string('region')->default('National');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
