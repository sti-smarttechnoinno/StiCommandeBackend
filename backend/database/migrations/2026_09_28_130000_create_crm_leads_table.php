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
        Schema::create('crm_leads', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('company_name');
            $table->string('phone');
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->string('region');
            $table->string('wilaya');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['new', 'contacted', 'qualified', 'converted', 'lost'])->default('new');
            $table->enum('source', ['field_prospection', 'inbound_call', 'recommendation', 'event', 'other'])->default('field_prospection');
            $table->decimal('estimated_budget', 12, 2)->nullable();
            $table->foreignId('converted_client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->timestamp('converted_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('region');
            $table->index('status');
            $table->index('company_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crm_leads');
    }
};
