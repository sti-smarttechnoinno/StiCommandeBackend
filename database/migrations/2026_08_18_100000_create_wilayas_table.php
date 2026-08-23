<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wilayas', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->enum('region_id', ['east', 'west', 'center', 'south'])->default('center');
            $table->string('region_name');
            $table->integer('rank')->default(0);
            $table->foreignId('delegate_id')->nullable()->constrained('users')->nullOnDelete();
            $table->integer('clients_count')->default(0);
            $table->integer('active_clients_count')->default(0);
            $table->integer('orders_today')->default(0);
            $table->integer('orders_month')->default(0);
            $table->decimal('monthly_revenue', 15, 2)->default(0);
            $table->decimal('yearly_revenue', 15, 2)->default(0);
            $table->decimal('avg_order', 15, 2)->default(0);
            $table->float('growth')->default(0);
            $table->enum('performance', ['excellent', 'good', 'average', 'needs_attention'])->default('good');
            $table->integer('performance_score')->default(75);
            $table->string('top_product')->default('Mobilis SIM Card');
            $table->enum('status', ['active', 'limited', 'inactive'])->default('active');
            $table->json('revenue_trend')->nullable();
            $table->json('orders_trend')->nullable();
            $table->timestamps();

            $table->index('code');
            $table->index('region_id');
            $table->index('status');
            $table->index('performance');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wilayas');
    }
};
