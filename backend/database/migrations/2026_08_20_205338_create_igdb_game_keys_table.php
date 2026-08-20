<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The comparable form of every IGDB title, so matching is a join and not 142,110
 * decisions taken one at a time in PHP.
 *
 * The key is what `TitleNormalizer` produces — the same function the store
 * aggregator already uses on our side, which is the point: two catalogues can
 * only be compared through one normaliser, and we had one before IGDB arrived.
 *
 * The year sits beside it because the key alone is not enough. Measured on our
 * 400 most-visited titles, a bare title matches exactly one IGDB game 45% of the
 * time and several games 14% of the time — `Alien` is seven games between 1982
 * and 2023. The year settles rather more than half of those, and what it cannot
 * settle is left alone rather than guessed at.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('igdb_game_keys', function (Blueprint $table) {
            $table->unsignedBigInteger('igdb_id')->primary();

            /** TitleNormalizer::key() of the IGDB name. */
            $table->string('match_key', 255);

            /** From first_release_date. Null for the unannounced and the undated. */
            $table->unsignedSmallInteger('release_year')->nullable();

            /** Kept so a report can be read without joining back to the payload. */
            $table->string('name', 500);

            /*
             * The join runs on both together and on the key alone, so both are
             * worth indexing. 372,826 rows makes this the difference between a
             * merge that runs in a minute and one that runs in an afternoon.
             */
            $table->index(['match_key', 'release_year']);
            $table->index('match_key');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('igdb_game_keys');
    }
};
