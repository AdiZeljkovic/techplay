<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Which of the 13,024 recipe pages Google should be told about.
 *
 * The working document forbids the thing we built, twice: §20.2 wants
 * "programmatic pages generated from reviewed data, not thousands of low-value
 * API dump pages", and §25 lists "thousands of shallow generated pages" as the
 * SEO risk with "only reviewed, useful public guide families" as its control.
 *
 * The pages are not shallow — each carries a full material tree and links into
 * the rest — but thirteen thousand of them are unreviewed, and that is the part
 * the control is about. So the whole set stays reachable and only a reviewed
 * subset is indexed; the rest are `noindex, follow`, which keeps the graph
 * walkable without asking Google to rank it.
 *
 * ── The default, and why it is a default rather than a rule ─────────────
 *
 * Measured on 28 September 2026 against the live catalogue:
 *
 *   Ascended + Legendary craftables              1,904
 *   + materials used in 50 or more recipes       1,990
 *   + materials used in 20 or more recipes       2,597
 *   + Exotic                                     5,738
 *
 * Exotic alone is 3,187 craftable items, so including it barely narrows
 * anything. The 50-recipe threshold picks exactly what it should: Glob of
 * Ectoplasm (907 recipes), Vision Crystal (899), Pile of Crystalline Dust (280),
 * Mithril Ingot (174).
 *
 * `gw2:pick-indexable` applies that default. `reviewed_at` is how a person
 * overrides it — a row somebody has looked at is never recomputed, exactly as
 * `advisor_eligible` works on achievements. Widening or narrowing the set is
 * then an admin decision, not a deploy.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gw2_items', function (Blueprint $table) {
            $table->boolean('is_indexable')->default(false)->index();

            /*
             * Why this one is in. Written by the command so an editor looking
             * at a row can see what put it there, and so a change in the rule
             * is visible in the data rather than only in a commit.
             */
            $table->string('indexable_reason', 40)->nullable();

            // Set by a person. The command never touches a row that has it.
            $table->timestamp('indexable_reviewed_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('gw2_items', function (Blueprint $table) {
            $table->dropColumn(['is_indexable', 'indexable_reason', 'indexable_reviewed_at']);
        });
    }
};
