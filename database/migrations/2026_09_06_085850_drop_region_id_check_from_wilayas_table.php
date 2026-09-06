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
        if (\Illuminate\Support\Facades\DB::getDriverName() === 'pgsql') {
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE wilayas DROP CONSTRAINT IF EXISTS wilayas_region_id_check');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (\Illuminate\Support\Facades\DB::getDriverName() === 'pgsql') {
            \Illuminate\Support\Facades\DB::statement("ALTER TABLE wilayas ADD CONSTRAINT wilayas_region_id_check CHECK (region_id::text = ANY (ARRAY['east'::character varying, 'west'::character varying, 'center'::character varying, 'south'::character varying]::text[]))");
        }
    }
};
