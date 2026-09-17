<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('encaissement_imports', function (Blueprint $table) {
            $table->id();
            $table->string('file_name')->nullable();
            $table->integer('rows_count')->default(0);
            $table->integer('tiers_count')->default(0);
            $table->integer('clients_updated')->default(0);
            $table->integer('clients_created')->default(0);
            $table->foreignId('imported_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('encaissement_imports');
    }
};
