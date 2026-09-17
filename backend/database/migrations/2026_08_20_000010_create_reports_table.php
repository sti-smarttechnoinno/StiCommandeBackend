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
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type')->default('revenue'); // revenue, sales, delegates, products, clients, regional, stock
            $table->string('period')->default('this_month'); // today, last_7_days, last_30_days, this_month, last_month, this_year, custom
            $table->string('format')->default('pdf'); // pdf, csv, excel
            $table->string('status')->default('completed'); // completed, processing, failed
            $table->string('file_size')->nullable();
            $table->string('file_path')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
