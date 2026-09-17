<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('client_code')->unique();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone');
            $table->string('address');
            $table->string('region');
            $table->string('wilaya');
            $table->foreignId('delegate_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('client_type', ['retail', 'wholesale', 'corporate', 'government'])->default('retail');
            $table->enum('status', ['active', 'inactive', 'pending', 'blocked'])->default('active');
            $table->decimal('credit_limit', 12, 2)->default(0);
            $table->decimal('outstanding_balance', 12, 2)->default(0);
            $table->integer('total_orders')->default(0);
            $table->decimal('total_spent', 12, 2)->default(0);
            $table->timestamp('last_order_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('region');
            $table->index('client_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
