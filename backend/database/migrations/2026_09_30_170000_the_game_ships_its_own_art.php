<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Two columns so the tool can stop looking like a spreadsheet.
 *
 * Everything this advisor knows has been text and numbers, because that is all
 * the payloads carry. It was never a design decision — the art is right there
 * in the same responses we already pay for, and we were dropping it on the
 * floor:
 *
 * - **`gw2_masteries.background`** is a scene render per track, served from
 *   render.guildwars2.com. It is the one piece of real photography-scale art
 *   the API hands out, and it is exactly what the mockups put behind a mastery
 *   row.
 *
 * - **`gw2_achievements.category_id`** exists to solve a coverage problem
 *   rather than a layout one. Only 1,418 of 8,339 achievements carry an icon of
 *   their own — but all 360 categories do, and every achievement belongs to
 *   one. So a card falls back to its category's icon and the gap closes from
 *   83% to almost nothing.
 *
 * The mapping is not on the achievement, by the way. It is on the category, as
 * an `achievements` array, which is why this is filled in when the categories
 * are stored rather than when the achievements are.
 *
 * What the API does **not** ship, and no column here pretends otherwise: the
 * expansion key art behind the mockups' hero banners, and the map screenshots
 * on their event rows. Those are ArenaNet's marketing renders. Mastery
 * backgrounds are the closest thing the API gives, and they are genuine.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gw2_masteries', function (Blueprint $table) {
            $table->string('background', 500)->nullable();
        });

        Schema::table('gw2_achievements', function (Blueprint $table) {
            // Indexed: "every achievement in this category" is how a collection
            // page would be built, and how the icon fallback joins.
            $table->unsignedInteger('category_id')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('gw2_masteries', function (Blueprint $table) {
            $table->dropColumn('background');
        });

        Schema::table('gw2_achievements', function (Blueprint $table) {
            $table->dropColumn('category_id');
        });
    }
};
