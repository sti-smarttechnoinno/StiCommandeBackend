<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->timestamp('last_payment_date')->nullable()->index();
            $table->decimal('last_payment_amount', 12, 2)->default(0);
            $table->string('last_payment_mode')->nullable();
            $table->string('last_payment_reference')->nullable();
            $table->string('last_payment_status')->nullable();
            $table->string('last_payment_order_number')->nullable();
            $table->string('last_payment_account')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn([
                'last_payment_date',
                'last_payment_amount',
                'last_payment_mode',
                'last_payment_reference',
                'last_payment_status',
                'last_payment_order_number',
                'last_payment_account',
            ]);
        });
    }
};
