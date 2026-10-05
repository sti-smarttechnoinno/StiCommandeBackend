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
        if (Schema::hasTable('delivery_note_items')) {
            Schema::table('delivery_note_items', function (Blueprint $table) {
                if (!Schema::hasColumn('delivery_note_items', 'discount_percent')) {
                    $table->decimal('discount_percent', 5, 2)->default(0.00)->after('quantity');
                }
                if (!Schema::hasColumn('delivery_note_items', 'is_gift')) {
                    $table->boolean('is_gift')->default(false)->after('subtotal');
                }
                if (!Schema::hasColumn('delivery_note_items', 'notes')) {
                    $table->text('notes')->nullable()->after('is_gift');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('delivery_note_items', function (Blueprint $table) {
            $table->dropColumn(['discount_percent', 'is_gift', 'notes']);
        });
    }
};
