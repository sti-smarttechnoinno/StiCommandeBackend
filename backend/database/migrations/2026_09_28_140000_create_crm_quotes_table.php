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
        Schema::create('crm_quotes', function (Blueprint $table) {
            $table->id();
            $table->string('quote_code')->unique();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained('crm_leads')->nullOnDelete();
            $table->foreignId('opportunity_id')->nullable()->constrained('crm_opportunities')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('client_name');
            $table->string('client_phone')->nullable();
            $table->string('client_email')->nullable();
            $table->string('region');
            $table->string('wilaya')->nullable();
            $table->string('address')->nullable();
            $table->string('status', 30)->default('draft'); // draft, sent, accepted, rejected, converted, expired
            $table->decimal('subtotal_ht', 14, 2)->default(0);
            $table->decimal('discount_percent', 5, 2)->default(0);
            $table->decimal('discount_amount', 14, 2)->default(0);
            $table->decimal('tax_percent', 5, 2)->default(19.00);
            $table->decimal('tax_amount', 14, 2)->default(0);
            $table->decimal('total_ttc', 14, 2)->default(0);
            $table->date('issue_date');
            $table->date('valid_until')->nullable();
            $table->uuid('converted_order_id')->nullable();
            $table->string('payment_terms')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['client_id', 'status']);
            $table->index('opportunity_id');
            $table->index('quote_code');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crm_quotes');
    }
};
