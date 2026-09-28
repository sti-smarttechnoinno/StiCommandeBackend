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
        Schema::create('crm_opportunities', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained('crm_leads')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('amount', 14, 2)->default(0);
            $table->enum('stage', ['qualification', 'proposal', 'negotiation', 'won', 'lost'])->default('qualification');
            $table->unsignedTinyInteger('probability')->default(20);
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->date('expected_closing_date')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->string('lost_reason')->nullable();
            $table->uuid('converted_order_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'stage']);
            $table->index(['client_id', 'stage']);
            $table->index(['lead_id', 'stage']);
            $table->index('stage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crm_opportunities');
    }
};
