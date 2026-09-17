<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'username')) {
                $table->string('username')->nullable()->unique()->after('name');
            }
            $table->string('email')->nullable()->change();
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->string('email')->nullable()->change();
        });

        // Backfill username for existing users
        foreach (User::all() as $user) {
            if (empty($user->username)) {
                $username = !empty($user->email)
                    ? explode('@', $user->email)[0]
                    : strtolower(preg_replace('/[^a-zA-Z0-9_]/', '', str_replace(' ', '.', $user->name)));
                $user->username = $username ?: ('user' . $user->id);
                if (empty($user->phone)) {
                    $user->phone = '0550000000';
                }
                $user->save();
            }
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'username')) {
                $table->dropColumn('username');
            }
        });
    }
};
