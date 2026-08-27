<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * May the site put a game on your shelf because it saw you playing it?
 *
 * Default on, because without a library row nothing measures the session at
 * all: bankSession() writes minutes onto a UserGame, and with no row there is
 * nowhere to write them. Somebody playing a game they have not catalogued was
 * getting no playtime recorded and no shelf entry — the game simply did not
 * happen as far as the site was concerned.
 *
 * A switch rather than a silent rule, because a shelf kept tidy by hand is a
 * real thing to want, and a site that adds rows to it uninvited is not.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('auto_add_played_games')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('auto_add_played_games');
        });
    }
};
