<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('regions', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('name_fr')->nullable();
            $table->string('subtitle')->nullable();
            $table->string('icon')->default('🗺️');
            $table->string('color')->default('#2563EB');
            $table->string('bg_color')->default('bg-blue-500/10');
            $table->string('text_color')->default('text-blue-600');
            $table->enum('status', ['active', 'inactive', 'archived'])->default('active');
            $table->timestamps();
        });

        // Add region_id to wilayas if not present or update relationship
        if (Schema::hasTable('wilayas') && ! Schema::hasColumn('wilayas', 'custom_region_id')) {
            Schema::table('wilayas', function (Blueprint $table) {
                $table->foreignId('custom_region_id')->nullable()->after('region_id')->constrained('regions')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('wilayas') && Schema::hasColumn('wilayas', 'custom_region_id')) {
            Schema::table('wilayas', function (Blueprint $table) {
                $table->dropForeign(['custom_region_id']);
                $table->dropColumn('custom_region_id');
            });
        }
        Schema::dropIfExists('regions');
    }
};
