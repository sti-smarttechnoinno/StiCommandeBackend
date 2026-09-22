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
        Schema::table('sales_journal_imports', function (Blueprint $table) {
            $table->string('duplicate_action', 20)->default('skip')->after('unmatched_clients_count');
            $table->integer('skipped_duplicates_count')->default(0)->after('duplicate_action');
            $table->integer('updated_duplicates_count')->default(0)->after('skipped_duplicates_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_journal_imports', function (Blueprint $table) {
            $table->dropColumn(['duplicate_action', 'skipped_duplicates_count', 'updated_duplicates_count']);
        });
    }
};
