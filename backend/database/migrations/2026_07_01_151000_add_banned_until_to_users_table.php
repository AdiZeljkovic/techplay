<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'banned_until')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('banned_until')->nullable();
            });
        }

        // ban_reason is referenced in User::$hidden and the Filament admin form
        // but was never actually migrated — add it now so both aren't dead code.
        if (! Schema::hasColumn('users', 'ban_reason')) {
            Schema::table('users', function (Blueprint $table) {
                $table->text('ban_reason')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'banned_until')) {
                $table->dropColumn('banned_until');
            }
            if (Schema::hasColumn('users', 'ban_reason')) {
                $table->dropColumn('ban_reason');
            }
        });
    }
};
