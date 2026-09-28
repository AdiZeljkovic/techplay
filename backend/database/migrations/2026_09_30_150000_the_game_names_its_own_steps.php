<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Four fields ArenaNet already publishes and we were throwing away.
 *
 * The advisor has been telling players "Skyscale Eggs — 3 steps left" without
 * being able to say *which* three, and the reason was not that the data is
 * unavailable. `bits[].text` on an achievement is ArenaNet's own step text —
 * "Somewhere in Necrotic Coast." — and the account's own achievement record
 * carries `bits` as the list of step indices already done. One is the map, the
 * other is the pin. We were mirroring the first and reading the second and
 * never putting them together.
 *
 * So this adds nothing invented:
 *
 * - **`mastery_region`** is lifted out of `rewards[]` where `type` is
 *   `Mastery`, because §12.1 asks for exactly one thing — *"boost achievements
 *   that award a Mastery Point needed by the user's currently selected
 *   region"* — and asking that question of a jsonb array 4,500 times per
 *   snapshot is a scan where a column is an index. 909 achievements carry one.
 *   Stored as the game spells it (`Desert`, `Sky`), not as the account
 *   endpoint spells it (`Path of Fire`, `Secrets of the Obscure`); the
 *   translation between those two lives in `MasteryRegions` and has since the
 *   day it cost us a working mastery rule.
 *
 * - **`prerequisites`**, **`description`**, **`locked_text`** and **`icon`**
 *   come along because they are in the same payload and we are already paying
 *   for the request.
 *
 * One honest note about `prerequisites`, since it is the field that looks like
 * it should solve mount guides and does not. Across the forty Skyscale
 * achievements exactly one has a prerequisite. The in-game chain — eggs, then
 * feeding, then flight — is real, and the API does not express it, not as a
 * prerequisite and not as a category either (the collections sit in "War
 * Eternal" beside thirty-one unrelated things). Which is why `achievement_ids`
 * below is a *curated* list and not a derived one. §9.5 said this would be the
 * shape before anyone checked: *"The acquisition path is content logic and must
 * be maintained as TechPlay curated data."* It was right.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gw2_achievements', function (Blueprint $table) {
            $table->text('description')->nullable();

            // What the game shows before the achievement is available. Often
            // the only place a requirement is spelled out in plain words.
            $table->text('locked_text')->nullable();

            $table->string('icon', 500)->nullable();
            $table->jsonb('prerequisites')->nullable();

            // Indexed because §12.1 is a filter, not a display field.
            $table->string('mastery_region', 32)->nullable()->index();
        });

        Schema::table('gw2_guides', function (Blueprint $table) {
            /*
             * The achievements this guide is about, in the order a player does
             * them. Curated, ordered, and the whole reason a mount page can
             * show live progress without anybody writing a step list by hand:
             * the membership and the order are ours, every step inside them is
             * ArenaNet's.
             */
            $table->jsonb('achievement_ids')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('gw2_achievements', function (Blueprint $table) {
            $table->dropColumn(['description', 'locked_text', 'icon', 'prerequisites', 'mastery_region']);
        });

        Schema::table('gw2_guides', function (Blueprint $table) {
            $table->dropColumn('achievement_ids');
        });
    }
};
