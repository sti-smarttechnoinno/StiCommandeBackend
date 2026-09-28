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
        Schema::create('crm_visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->dateTime('planned_at');
            $table->dateTime('completed_at')->nullable();
            $table->string('status', 30)->default('planned'); // planned, completed, cancelled, missed
            $table->string('purpose', 50)->default('order_taking'); // order_taking, prospecting, debt_collection, relationship, claim
            $table->text('summary')->nullable();
            $table->decimal('checkin_latitude', 10, 8)->nullable();
            $table->decimal('checkin_longitude', 11, 8)->nullable();
            $table->string('checkin_address')->nullable();
            $table->uuid('resulting_order_id')->nullable();
            $table->timestamps();

            $table->index(['client_id', 'status']);
            $table->index(['user_id', 'planned_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crm_visits');
    }
};
