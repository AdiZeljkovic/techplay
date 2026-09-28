<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The public page families, as a system rather than nine hardcoded routes.
 *
 * §20.1 of the working document names nine of them — `/gw2/level-80-what-next`,
 * `/gw2/fractals/agony-resistance`, `/gw2/mounts/{mount}` and the rest — and
 * §20 says why they matter more than the dashboard does:
 *
 * > *"The strongest acquisition model is public, indexable guide pages that
 * > become personalized after account connection. Private dashboards themselves
 * > do not rank."*
 *
 * None of the nine existed. What did exist was 13,024 generated recipe pages,
 * which is a different kind of page and the kind §25 warns about.
 *
 * ── Why a table and not nine files ─────────────────────────────────────
 *
 * Because a guide is editorial. A fractal threshold changes with a patch, a
 * mount acquisition route changes with a living world release, and §24 is
 * explicit that rules are living game knowledge to be treated like code —
 * owned, sourced, dated, reviewed. A page in a repository is a deploy away from
 * every correction; a page in a table is an edit.
 *
 * ── What makes it more than a blog post ────────────────────────────────
 *
 * `personalise_as`. §3.1 lists guide personalisation as a strategic pillar:
 * *"Public TechPlay guides become account-aware: completed steps collapse;
 * missing steps are highlighted."* A guide names what it is about — the agony
 * shortfall, a mastery region, a goal — and a signed-in reader gets their own
 * figures inlined into prose that reads perfectly well without them.
 *
 * That ordering is the rule: the page has to be worth reading with no account
 * at all, because §20.2 requires it and because a page that is empty without a
 * key cannot rank.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gw2_guides', function (Blueprint $table) {
            $table->id();

            /*
             * The URL family, from §20.1: progression, masteries, achievements,
             * fractals, goals, mounts, legendary, wizards-vault, level-80.
             * A guide lives at /gw2/{family}/{slug}, or at /gw2/{slug} when it
             * is the only one of its kind.
             */
            $table->string('family', 32)->index();
            $table->string('slug', 120);

            $table->string('title', 180);

            /*
             * The sentence under the title. Separate from the body because it
             * is also the meta description fallback and the card text, and
             * because a guide whose first paragraph has to do three jobs ends
             * up doing none of them well.
             */
            $table->string('standfirst', 300)->nullable();

            $table->longText('body')->nullable();

            /*
             * What the reader's own account adds, if they have one connected.
             *
             * A key like `agony`, `mastery:Heart of Thorns`, `goal:fractals`,
             * `ascended-set`. Null means the guide is purely editorial, which
             * is a legitimate answer — not every page has a number to show.
             *
             * The guide must read correctly without it. §20.2: "Public content
             * must remain useful without an API key; personalized data is
             * enhancement, not thin content."
             */
            $table->string('personalise_as', 64)->nullable();

            // Where a reader goes next, as an ordered list of {label, href}.
            $table->jsonb('next_steps')->nullable();

            $table->string('seo_title', 200)->nullable();
            $table->string('seo_description', 320)->nullable();
            $table->jsonb('keywords')->nullable();
            $table->string('hero_image', 500)->nullable();

            // §24 again: owner, sources, build, review date. The same contract
            // the rules carry, for the same reason.
            $table->string('owner', 60)->nullable();
            $table->jsonb('source_ids')->nullable();
            $table->unsignedBigInteger('game_build')->nullable();
            $table->timestamp('reviewed_at')->nullable();

            $table->boolean('is_published')->default(false)->index();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->unsignedInteger('views')->default(0);

            $table->timestamps();

            /*
             * Unique within a family, not globally. Two families can both have
             * an "overview", and forcing a global slug would push the family
             * name into every slug for no benefit.
             */
            $table->unique(['family', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gw2_guides');
    }
};
