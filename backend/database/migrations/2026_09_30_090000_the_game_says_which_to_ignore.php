<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Why an achievement was curated in or out, recorded rather than implied.
 *
 * The curation pass this column supports is not judgement — it is ArenaNet's
 * own metadata, which turns out to answer most of §12.1 directly:
 *
 *   IgnoreNearlyComplete   744   "do not surface this as nearly complete"
 *   Hidden                 773   §12.1: exclude hidden
 *   Daily / Weekly / Monthly     1,347 combined — they reset; "one step away"
 *                                on a daily is noise by tomorrow
 *   Repeatable             212   same
 *   Pvp                  2,128   §6.1 and §26 both defer PvP
 *   RequiresUnlock         365   §5: never turn missing data into certainty
 *
 * `IgnoreNearlyComplete` is the one that matters most and it is a defect rather
 * than a curation gap. The game publishes a flag meaning exactly "this one is
 * not a nearly-complete candidate", and the easy-wins engine has been ignoring
 * it since it shipped — recommending 744 achievements ArenaNet specifically
 * marked as unsuitable for the purpose.
 *
 * So the reader is filtered on that flag directly, not only through curation: a
 * catalogue refresh adds new achievements, and a new one carrying that flag
 * must be excluded the moment it arrives rather than when somebody gets round
 * to reviewing it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gw2_achievements', function (Blueprint $table) {
            /*
             * Which rule decided, in a word. So an editor looking at a row can
             * see what put it there, and so a change in the pass is visible in
             * the data rather than only in a commit.
             */
            $table->string('curation_reason', 40)->nullable()->after('effort_band');
        });
    }

    public function down(): void
    {
        Schema::table('gw2_achievements', function (Blueprint $table) {
            $table->dropColumn('curation_reason');
        });
    }
};
