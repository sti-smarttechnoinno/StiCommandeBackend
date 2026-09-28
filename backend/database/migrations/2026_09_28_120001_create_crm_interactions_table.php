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
        Schema::create('crm_interactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 30); // call, visit, whatsapp, email, note, complaint
            $table->string('title', 255);
            $table->text('notes')->nullable();
            $table->dateTime('interaction_date');
            $table->foreignId('crm_visit_id')->nullable()->constrained('crm_visits')->nullOnDelete();
            $table->timestamps();

            $table->index(['client_id', 'interaction_date']);
            $table->index(['user_id', 'interaction_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crm_interactions');
    }
};
