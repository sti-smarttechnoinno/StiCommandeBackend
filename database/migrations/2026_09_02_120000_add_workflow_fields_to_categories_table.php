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
        Schema::table('categories', function (Blueprint $table) {
            $table->string('workflow_type')->default('physical')->after('icon'); // 'virtual' or 'physical'
            $table->boolean('requires_delivery')->default(true)->after('workflow_type');
        });

        // Set virtual defaults for existing dematerialized categories
        $virtualSlugs = ['mobile_credit', 'data_packs', 'voice_packages', 'sms_packages'];
        DB::table('categories')
            ->whereIn('slug', $virtualSlugs)
            ->orWhere('name', 'like', '%credit%')
            ->orWhere('name', 'like', '%recharge%')
            ->update([
                'workflow_type' => 'virtual',
                'requires_delivery' => false,
            ]);

        // Ensure physical categories are set to physical
        $physicalSlugs = ['sim_cards', 'scratch_cards', 'accessories'];
        DB::table('categories')
            ->whereIn('slug', $physicalSlugs)
            ->orWhere('name', 'like', '%sim%')
            ->orWhere('name', 'like', '%ticket%')
            ->orWhere('name', 'like', '%carte%')
            ->update([
                'workflow_type' => 'physical',
                'requires_delivery' => true,
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn(['workflow_type', 'requires_delivery']);
        });
    }
};
