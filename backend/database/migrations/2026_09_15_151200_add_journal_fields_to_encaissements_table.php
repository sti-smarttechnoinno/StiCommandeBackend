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
        if (Schema::hasTable('encaissements')) {
            Schema::table('encaissements', function (Blueprint $table) {
                if (!Schema::hasColumn('encaissements', 'type')) {
                    $table->string('type', 50)->default('Encaissement')->index()->after('order_number');
                }
                if (!Schema::hasColumn('encaissements', 'debit')) {
                    $table->decimal('debit', 14, 2)->default(0)->after('amount');
                }
                if (!Schema::hasColumn('encaissements', 'credit')) {
                    $table->decimal('credit', 14, 2)->default(0)->after('debit');
                }
                if (!Schema::hasColumn('encaissements', 'locked')) {
                    $table->boolean('locked')->default(false)->after('label');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('encaissements', function (Blueprint $table) {
            $table->dropColumn(['type', 'debit', 'credit', 'locked']);
        });
    }
};
