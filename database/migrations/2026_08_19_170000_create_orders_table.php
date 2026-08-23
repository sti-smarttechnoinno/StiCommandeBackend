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
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
