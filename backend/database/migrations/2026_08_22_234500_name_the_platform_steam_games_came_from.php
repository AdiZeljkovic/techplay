<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Steam entries never said they were from Steam.
 *
 * The Xbox and PlayStation imports have always written `platform`; the Steam
 * one wrote `playtime_source` instead and left `platform` null, so a library
 * of 191 games imported from Steam had nothing on it that named the store.
 * The column is what the shelf reads to put a mark on a card.
 *
 * Only rows that name Steam as the source of their hours and have no platform
 * of their own are touched — a platform somebody typed in themselves stays.
 */
return new class extends Migration
{
    public function up(): void
    {
        $named = DB::table('user_games')
            ->whereNull('platform')
            ->where('playtime_source', 'steam')
            ->update(['platform' => 'Steam']);

        echo "  named {$named} Steam entries\n";
    }

    public function down(): void
    {
        DB::table('user_games')
            ->where('platform', 'Steam')
            ->where('playtime_source', 'steam')
            ->update(['platform' => null]);
    }
};
