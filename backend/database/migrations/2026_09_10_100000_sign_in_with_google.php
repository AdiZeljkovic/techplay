<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Somewhere to put the Google account, once somebody signs in with one.
 *
 * The same two columns Discord has, and for the same reasons: the id is what
 * the account is recognised by on the second visit, and the avatar is kept
 * because Google's is a URL that survives, unlike a token.
 *
 * Unique on the id, deliberately. One Google account signs into one TechPlay
 * account; without the constraint a bug upstream could quietly attach the same
 * identity to two people, and the first anybody would know is a support email
 * about somebody else's XP.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'google_id')) {
                $table->string('google_id')->nullable()->unique()->after('discord_id');
            }

            if (! Schema::hasColumn('users', 'google_avatar')) {
                $table->string('google_avatar')->nullable()->after('google_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['google_id', 'google_avatar']);
        });
    }
};
