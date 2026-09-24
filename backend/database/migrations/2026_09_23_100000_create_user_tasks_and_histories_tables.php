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
        // 1. Table des tâches et missions attribuées
        Schema::create('user_tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('assigned_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assigned_to')->constrained('users')->cascadeOnDelete();
            $table->string('category')->default('operational'); // sales, visit, recouvrement, prospection, operational
            $table->string('priority')->default('medium'); // low, medium, high, urgent
            $table->date('due_date')->nullable();
            $table->decimal('target_amount', 15, 2)->nullable();
            $table->unsignedInteger('target_count')->nullable();
            $table->unsignedInteger('achieved_count')->default(0);

            // File Attribution fields
            $table->boolean('has_attachment')->default(false);
            $table->string('attachment_url')->nullable();
            $table->string('attachment_name')->nullable();
            $table->string('attachment_type')->nullable();
            $table->unsignedBigInteger('attachment_size')->nullable();

            // Status and execution
            $table->string('status')->default('pending'); // pending, in_progress, completed, cancelled
            $table->dateTime('completed_at')->nullable();
            $table->text('completion_notes')->nullable();

            $table->timestamps();

            $table->index(['assigned_by', 'status']);
            $table->index(['assigned_to', 'status']);
            $table->index('due_date');
        });

        // 2. Table de l'historique et journal d'audit des tâches
        Schema::create('task_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('user_tasks')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('action'); // created, status_updated, completed, cancelled, comment_added
            $table->string('from_status')->nullable();
            $table->string('to_status')->nullable();
            $table->text('comment')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['task_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_histories');
        Schema::dropIfExists('user_tasks');
    }
};
