<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('operators', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('code')->unique();
            $table->string('color')->nullable()->default('#10b981');
            $table->string('logo_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->string('icon')->nullable()->default('package');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insert initial default Operators
        $now = now();
        DB::table('operators')->insert([
            ['name' => 'Mobilis', 'code' => 'MOB', 'color' => '#10b981', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Ooredoo', 'code' => 'OOR', 'color' => '#f43f5e', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Djezzy', 'code' => 'DJZ', 'color' => '#f59e0b', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Other', 'code' => 'OTH', 'color' => '#64748b', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        // Insert initial default Categories
        DB::table('categories')->insert([
            ['name' => 'Mobile Credit', 'slug' => 'mobile_credit', 'icon' => 'smartphone', 'description' => 'Electronic flexy mobile credit top-up', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'SIM Cards', 'slug' => 'sim_cards', 'icon' => 'sim-card', 'description' => 'Prepaid and postpaid SIM cards', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Scratch Cards', 'slug' => 'scratch_cards', 'icon' => 'credit-card', 'description' => 'Physical recharge scratch vouchers', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Data Packs', 'slug' => 'data_packs', 'icon' => 'wifi', 'description' => 'Internet data bundle packages', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Voice Packages', 'slug' => 'voice_packages', 'icon' => 'phone-call', 'description' => 'Voice calling minutes packages', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'SMS Packages', 'slug' => 'sms_packages', 'icon' => 'message-square', 'description' => 'Text messaging bundles', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Accessories', 'slug' => 'accessories', 'icon' => 'headphones', 'description' => 'Telecom accessories and hardware', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categories');
        Schema::dropIfExists('operators');
    }
};
