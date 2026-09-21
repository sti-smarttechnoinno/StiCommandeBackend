<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('region_wilaya', function (Blueprint $table) {
            $table->id();
            $table->foreignId('region_id')->constrained('regions')->cascadeOnDelete();
            $table->foreignId('wilaya_id')->constrained('wilayas')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['region_id', 'wilaya_id']);
        });

        // Migrate existing assignments from wilayas.custom_region_id to the new pivot table
        if (Schema::hasColumn('wilayas', 'custom_region_id')) {
            $existingAssignments = DB::table('wilayas')
                ->whereNotNull('custom_region_id')
                ->select('id as wilaya_id', 'custom_region_id as region_id')
                ->get();

            $now = now();
            $records = [];
            foreach ($existingAssignments as $assignment) {
                // Verify that the region still exists
                $regionExists = DB::table('regions')->where('id', $assignment->region_id)->exists();
                if ($regionExists) {
                    $records[] = [
                        'region_id' => $assignment->region_id,
                        'wilaya_id' => $assignment->wilaya_id,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

            if (!empty($records)) {
                DB::table('region_wilaya')->insertOrIgnore($records);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('region_wilaya');
    }
};
