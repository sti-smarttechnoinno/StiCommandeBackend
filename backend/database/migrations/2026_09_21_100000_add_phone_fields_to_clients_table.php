<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            if (!Schema::hasColumn('clients', 'personal_phone')) {
                $table->string('personal_phone')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('clients', 'storm_phone')) {
                $table->string('storm_phone')->nullable()->after('personal_phone');
            }
        });

        // Initialize personal_phone with existing phone data where null
        DB::table('clients')
            ->whereNull('personal_phone')
            ->whereNotNull('phone')
            ->update([
                'personal_phone' => DB::raw('phone'),
            ]);
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $colsToDrop = [];
            if (Schema::hasColumn('clients', 'personal_phone')) {
                $colsToDrop[] = 'personal_phone';
            }
            if (Schema::hasColumn('clients', 'storm_phone')) {
                $colsToDrop[] = 'storm_phone';
            }
            if (!empty($colsToDrop)) {
                $table->dropColumn($colsToDrop);
            }
        });
    }
};
