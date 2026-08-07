<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * game_ratings was born keyed by game_slug; the game_id column arrived
 * later and stayed half-empty. Fill it from the slug so every consumer —
 * the chronicle above all — can join on the real key. Slug queries keep
 * working; they just stop being the only truth.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') { return; }

        DB::statement(<<<'SQL'
            UPDATE game_ratings
            SET game_id = games.id
            FROM games
            WHERE game_ratings.game_id IS NULL
              AND games.slug = game_ratings.game_slug
        SQL);
    }

    public function down(): void
    {
        // Backfilled ids are correct data; nothing to undo.
    }
};
