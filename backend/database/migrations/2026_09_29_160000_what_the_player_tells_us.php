<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Three things the player says that the account cannot.
 *
 * Everything the advisor knows so far was read from ArenaNet. These are the
 * three places the working document says that is not enough.
 *
 * ── Pinned goals (§26.5, §21) ──────────────────────────────────────────
 *
 * The goal picker built alongside this is a hint for one request. A pin is the
 * same choice made durable, and §21 is explicit about why it matters: *"Pinned
 * goals: player returns to see the next blocker."* Without persistence the
 * advisor forgets what somebody is working on the moment they close the tab,
 * which is the opposite of a retention loop.
 *
 * ── The character (§26.2) ──────────────────────────────────────────────
 *
 * `primaryCharacter()` picks the highest level and best geared. That is a
 * reasonable guess and it is still a guess — a veteran with fifteen characters
 * has a main, and nothing in the API says which. §26 lists a character selector
 * as a V1 must-have and this is the column behind it.
 *
 * ── Confirmations (§17.3, §5) ──────────────────────────────────────────
 *
 * *"Unknown must be a first-class state. Use 'We cannot verify this from the
 * API' with a small confirm control. Never render unknown as 0%."*
 *
 * The clearest case is elite specialisation: `/characters/:id/training` is
 * documented as returning empty in all cases, so a slotted elite spec proves it
 * is usable and proves nothing about whether the track is finished. The honest
 * options are to say nothing or to ask. This table is asking.
 *
 * A confirmation is the player's claim, not ours — `source` records that, so a
 * later reader cannot mistake it for something the API said.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gw2_user_goals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gw2_account_id')->constrained()->cascadeOnDelete();
            $table->foreignId('gw2_goal_id')->constrained()->cascadeOnDelete();

            /*
             * Which character this goal is about, by name.
             *
             * Optional: "spend my mastery points" is an account goal and
             * "finish an ascended set" is a character one. By name rather than
             * by id because that is how this API addresses characters and how a
             * player thinks of them.
             */
            $table->string('character_name', 64)->nullable();

            $table->unsignedSmallInteger('priority')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            // One pin per goal per account. Pinning twice is pinning.
            $table->unique(['gw2_account_id', 'gw2_goal_id']);
        });

        Schema::table('gw2_accounts', function (Blueprint $table) {
            /*
             * The character the player chose, overriding our guess. Null means
             * "you pick", which stays the default and is right for the great
             * majority who have one character they care about.
             */
            $table->string('featured_character', 64)->nullable()->after('name');
        });

        Schema::create('gw2_confirmations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gw2_account_id')->constrained()->cascadeOnDelete();

            /*
             * What is being confirmed, as a stable string.
             *
             * `elite_spec:Isara Moonbloom:Daredevil`, `story:path_of_fire`. A
             * string rather than a typed relation because the set of things the
             * API cannot see is open-ended and each new one should not need a
             * migration.
             */
            $table->string('subject', 160);

            // yes | no | unsure — and unsure is a real answer worth storing,
            // because it stops us asking again next week.
            $table->string('answer', 12);

            /*
             * Where this came from. Always the player for now, and recorded
             * anyway: a later reader must never mistake somebody's own claim
             * for something ArenaNet said.
             */
            $table->string('source', 24)->default('player');

            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['gw2_account_id', 'subject']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gw2_confirmations');
        Schema::dropIfExists('gw2_user_goals');

        Schema::table('gw2_accounts', function (Blueprint $table) {
            $table->dropColumn('featured_character');
        });
    }
};
