<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Two things the first importer needs that the foundation did not anticipate.
 *
 * A rejected listing still has to be remembered. Half of Steam's upcoming
 * catalogue fails the quality gate, and without a record of that the next sync
 * would fetch and reject exactly the same titles all over again. So a store
 * link can now exist without a game behind it: the row means "we have seen this
 * listing", and the reason says why it never became a calendar entry.
 *
 * match_key is stored rather than computed because cross-store matching will
 * otherwise have to normalise every title in the table on every comparison.
 * It stays empty for the 200k historical rows — those are finished games, and
 * nothing arriving from a store's "coming soon" list will ever match them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('game_store_links', function (Blueprint $table) {
            $table->unsignedBigInteger('game_id')->nullable()->change();
            $table->string('rejected_reason', 80)->nullable();
        });

        Schema::table('games', function (Blueprint $table) {
            $table->string('match_key', 200)->nullable();
            $table->index('match_key');
        });
    }

    public function down(): void
    {
        Schema::table('game_store_links', function (Blueprint $table) {
            $table->dropColumn('rejected_reason');
        });

        Schema::table('games', function (Blueprint $table) {
            $table->dropIndex(['match_key']);
            $table->dropColumn('match_key');
        });
    }
};
