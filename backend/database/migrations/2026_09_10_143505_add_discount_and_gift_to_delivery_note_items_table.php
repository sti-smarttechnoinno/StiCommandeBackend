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
        Schema::table('delivery_note_items', function (Blueprint $table) {
            $table->decimal('discount_percent', 5, 2)->default(0.00)->after('quantity');
            $table->boolean('is_gift')->default(false)->after('subtotal');
            $table->text('notes')->nullable()->after('is_gift');
        });
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
