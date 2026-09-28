<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The two things the working document asks for that the advisor has been
 * missing, and both are about trust rather than features.
 *
 * ── Goals ───────────────────────────────────────────────────────────────
 *
 * §8.2 makes **Goal relevance (0–35)** the largest single component of a
 * recommendation's score — larger than blocker removal at 0–25. The advisor has
 * been accepting `?goal=` since the day it shipped, carrying it through `Intent`,
 * and using it in exactly one place: deciding whether to skip the cache. The
 * public promise of the product is "Connect your account. Pick a goal — or let
 * us show you the most useful next steps", and the first half of that has not
 * worked.
 *
 * A goal is a row rather than an enum for the same reason a rule is: which goals
 * exist is an editorial decision about the game, and the game changes.
 *
 * ── Provenance ──────────────────────────────────────────────────────────
 *
 * §24: *"Every rule has owner, source(s), reviewed_at, game_build/patch context
 * and version."* The table has had `reviewed_at` and `version` and none of the
 * other three, which means that when a recommendation turns out to be wrong
 * there is no record of who added it, on what authority, or for which build of
 * the game.
 *
 * §25 names exactly that failure — *"Incorrect recommendation → Trust damage in
 * a knowledgeable MMO community"* — and lists provenance as its first control.
 * A Guild Wars 2 audience will find a wrong rule, and the difference between a
 * correction and a credibility problem is whether the rule can be traced.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gw2_goals', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 48)->unique();
            $table->string('title', 120);

            /*
             * What picking this changes, in the player's words. Shown on the
             * picker, because "Fractals" alone does not tell somebody whether
             * it is the right choice for them.
             */
            $table->string('summary', 200)->nullable();

            // The domain a goal mostly pulls from, for ordering and for the
            // one-line explanation of what a pick will do.
            $table->string('domain', 24)->nullable();
            $table->string('icon', 40)->nullable();

            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('gw2_sources', function (Blueprint $table) {
            $table->id();
            $table->string('label', 120);
            $table->string('url', 500);

            // wiki | official | community | measured | editorial
            $table->string('kind', 24)->default('wiki');

            /*
             * When somebody last opened it and agreed it still says what the
             * rule claims. A source is not a citation, it is a thing that can
             * go stale — and a link nobody has checked since a balance patch is
             * worse than no link, because it looks like diligence.
             */
            $table->timestamp('checked_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::table('gw2_rules', function (Blueprint $table) {
            /*
             * Which goals this rule advances.
             *
             * An array of goal slugs, not a foreign key: one rule advances
             * several goals — finishing an ascended ring serves both "first
             * ascended set" and "get into fractals" — and §8.1 step 7 makes
             * that overlap explicit, since deduplication exists precisely
             * because one activity pushes several goals.
             */
            $table->jsonb('goals')->nullable();

            // Who added it, and who answers for it.
            $table->string('owner', 60)->nullable();

            /*
             * Source ids from gw2_sources. An array rather than a pivot table:
             * a rule has two or three and nothing ever queries from the source
             * back to the rules.
             */
            $table->jsonb('source_ids')->nullable();

            /*
             * The game build this rule was last judged against.
             *
             * §24 asks for patch context because a rule that was right in
             * August can be wrong in September without anybody touching it.
             * Nothing enforces this yet; recording it is what makes a "review
             * everything older than the last balance patch" pass possible
             * later.
             */
            $table->unsignedBigInteger('game_build')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('gw2_rules', function (Blueprint $table) {
            $table->dropColumn(['goals', 'owner', 'source_ids', 'game_build']);
        });

        Schema::dropIfExists('gw2_sources');
        Schema::dropIfExists('gw2_goals');
    }
};
