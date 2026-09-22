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
        Schema::create('sales_journal_imports', function (Blueprint $table) {
            $table->id();
            $table->string('file_name');
            $table->integer('rows_count')->default(0);
            $table->integer('matched_clients_count')->default(0);
            $table->integer('unmatched_clients_count')->default(0);
            $table->decimal('total_amount_ttc', 16, 2)->default(0);
            $table->decimal('total_paid', 16, 2)->default(0);
            $table->decimal('total_remaining', 16, 2)->default(0);
            $table->foreignId('imported_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('sales_journals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('import_id')->nullable()->constrained('sales_journal_imports')->nullOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignId('delegate_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reference', 100)->index();
            $table->string('type', 100)->default('Bon de Livraison')->index();
            $table->string('status', 100)->default('Validé')->index();
            $table->dateTime('operation_date')->nullable()->index();
            $table->string('tiers_name')->index();
            $table->string('client_code', 100)->nullable()->index();
            $table->string('wilaya', 100)->nullable()->index();
            $table->string('region', 100)->nullable()->index();
            $table->decimal('amount_ht', 14, 2)->default(0);
            $table->decimal('discount_pct', 5, 2)->default(0);
            $table->decimal('net_ht', 14, 2)->default(0);
            $table->decimal('tva', 14, 2)->default(0);
            $table->decimal('timbre', 14, 2)->default(0);
            $table->decimal('total_ttc', 14, 2)->default(0);
            $table->decimal('paid_amount', 14, 2)->default(0);
            $table->decimal('remaining_amount', 14, 2)->default(0);
            $table->string('payment_mode', 100)->nullable()->index();
            $table->string('currency', 50)->default('Dinar Algérie (DA)');
            $table->string('depot_source', 150)->nullable()->index();
            $table->string('depot_destination', 150)->nullable();
            $table->string('created_by_erp', 100)->nullable()->index();
            $table->dateTime('created_at_erp')->nullable();
            $table->boolean('locked')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_journals');
        Schema::dropIfExists('sales_journal_imports');
    }
};
