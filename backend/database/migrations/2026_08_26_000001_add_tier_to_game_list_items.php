<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The rung a game sits on in a tier list.
 *
 * A ranking answers "which is first"; a tier list answers "which of these are
 * the same". That is a different question, and it needs a column of its own —
 * `position` alone cannot say that four games are all S and equally so.
 *
 * Null is the unranked tray: a game that has been added to the board and not
 * placed yet. Every other list type leaves this null for every row, which is
 * why it hangs off the item rather than forcing a second table.
 *
 * The index is (list, tier, position) because that is the only way the board is
 * ever read: one list, grouped by rung, ordered within it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('game_list_items', function (Blueprint $table) {
            $table->string('tier', 2)->nullable()->after('position');
            $table->index(['game_list_id', 'tier', 'position'], 'game_list_items_board_idx');
        });
    }

    public function down(): void
    {
        Schema::table('game_list_items', function (Blueprint $table) {
            $table->dropIndex('game_list_items_board_idx');
            $table->dropColumn('tier');
        });
    }
};
