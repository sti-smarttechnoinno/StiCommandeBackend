<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('encaissements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->string('tiers_name')->index();
            $table->string('order_number')->nullable()->index();
            $table->timestamp('payment_date')->nullable()->index();
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('payment_mode')->nullable();
            $table->string('reference')->nullable();
            $table->string('status')->nullable();
            $table->string('account')->nullable();
            $table->string('label')->nullable();
            $table->boolean('is_last')->default(false)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('encaissements');
    }
};
