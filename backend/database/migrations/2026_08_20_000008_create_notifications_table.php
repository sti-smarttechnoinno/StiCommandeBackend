<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category')->default('system'); // orders, stock, delegates, clients, reports, security, system, finance
            $table->string('priority')->default('medium'); // critical, high, medium, low
            $table->string('status')->default('unread'); // unread, read, resolved, archived
            $table->string('user')->default('System'); // Actor / Triggered by name
            $table->string('region')->default('All');
            $table->string('module')->default('System');
            $table->string('reference_id')->nullable();
            $table->boolean('read')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
