<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Three more things an account read now keeps.
 *
 * `map_chests` — Hero's Choice chests taken since the daily reset. With world
 * bosses and time-gated crafts it is the daily list, and like them the game
 * forgets it at 00:00 UTC.
 *
 * `vault_listings` — the account's purchases from the Wizard's Vault this
 * season, against each listing's limit. Its own column rather than a key inside
 * `wizards_vault`: the quick read rewrites that column from daily and weekly
 * alone, and would drop a key it did not read.
 *
 * `trading_post` — coins and items waiting at the counter, and open orders.
 * Null for a key without the `tradingpost` scope, which is a different answer
 * from an empty counter.
 *
 * Collections (skins, minis, outfits, titles) go into the existing `unlocks`
 * object beside recipes and mounts; nothing new is needed for them here.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gw2_account_state', function (Blueprint $table) {
            $table->jsonb('map_chests')->nullable();
            $table->jsonb('vault_listings')->nullable();
            $table->jsonb('trading_post')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('gw2_account_state', function (Blueprint $table) {
            $table->dropColumn(['map_chests', 'vault_listings', 'trading_post']);
        });
    }
};
