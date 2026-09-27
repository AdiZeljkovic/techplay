<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A player's Guild Wars 2 account, as TechPlay last observed it.
 *
 * The key itself lives in `connected_accounts` — encrypted, hidden from
 * serialisation, with the sync state and the granted scopes already modelled.
 * GW2 is the sixth provider there, beside Steam, Xbox, PlayStation, GOG and
 * Epic. Nothing about key storage needed inventing.
 *
 * What did need inventing is the snapshot. Measured on 27 September 2026, a
 * full read is eighteen requests: seventeen account endpoints and one
 * `characters?ids=all`, which returns the worn equipment, bags,
 * specializations, skills, recipes and crafting in a single response. That is
 * cheap enough to take regularly and far too expensive to take per page view,
 * so the site reads these tables and the API is touched by a queued job.
 *
 * One reason this matters beyond caching: `/v2/account/raids` returns only
 * what has been cleared since the weekly reset, and there is no lifetime
 * history anywhere in the API. From the day an account connects, these
 * snapshots become the only record that history exists at all — which is why
 * `gw2_progress_events` is written from the difference between two reads
 * rather than from anything ArenaNet sends.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gw2_accounts', function (Blueprint $table) {
            $table->id();

            /*
             * The key lives on connected_accounts. This row is the game-side
             * account it points at, and dies with it: disconnecting has to
             * take the derived state too, or "delete my data" is a lie.
             */
            $table->foreignId('connected_account_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // ArenaNet's own GUID for the account.
            $table->string('arena_account_id', 64)->unique();
            $table->string('name', 64)->nullable();

            $table->unsignedInteger('world')->nullable();
            $table->unsignedSmallInteger('fractal_level')->nullable();
            $table->unsignedInteger('daily_ap')->nullable();
            $table->unsignedInteger('monthly_ap')->nullable();
            $table->unsignedInteger('wvw_rank')->nullable();
            $table->timestamp('game_account_created_at')->nullable();

            /*
             * Which expansions the account can play, exactly as the API words
             * it — and not interpreted here.
             *
             * The test account on 27 September answered GuildWars2,
             * PlayForFree, PathOfFire, EndOfDragons, SecretsOfTheObscure,
             * JanthirWilds — with no HeartOfThorns, despite owning Path of
             * Fire. Whatever that means, a plain in_array over this list would
             * hide Heart of Thorns content from somebody who can reach it.
             * Stored raw until the rule is understood.
             */
            $table->jsonb('access')->nullable();

            $table->timestamp('last_full_sync_at')->nullable();
            $table->timestamp('last_quick_sync_at')->nullable();
            $table->timestamps();
        });

        Schema::create('gw2_characters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gw2_account_id')->constrained()->cascadeOnDelete();

            // Characters are addressed by name in this API; there is no id.
            $table->string('name', 64);
            $table->string('profession', 24)->nullable();
            $table->string('race', 24)->nullable();
            $table->unsignedSmallInteger('level')->default(0);
            $table->unsignedBigInteger('age')->nullable();
            $table->unsignedInteger('deaths')->nullable();
            $table->timestamp('character_created_at')->nullable();

            /*
             * The worn set, not a template.
             *
             * `characters?ids=all` returns an `equipment` array with no `tabs`
             * field — that is what the character has on right now. Agony
             * Resistance is summed from this and from nothing else; totalling
             * an inactive build's infusions would report armour the player is
             * not wearing.
             */
            $table->jsonb('equipment')->nullable();
            $table->jsonb('specializations')->nullable();
            $table->jsonb('skills')->nullable();
            $table->jsonb('crafting')->nullable();

            $table->timestamp('observed_at')->nullable();
            $table->timestamps();

            $table->unique(['gw2_account_id', 'name']);
        });

        /*
         * One row per account, overwritten on every sync.
         *
         * History is not kept here — it is kept as differences, in
         * gw2_progress_events. Storing every read whole would mean a hundred
         * kilobytes an account a day for data that mostly did not change.
         */
        Schema::create('gw2_account_state', function (Blueprint $table) {
            $table->foreignId('gw2_account_id')->primary()->constrained()->cascadeOnDelete();

            $table->jsonb('achievements')->nullable();
            $table->jsonb('masteries')->nullable();
            $table->jsonb('mastery_points')->nullable();
            $table->jsonb('wallet')->nullable();
            $table->jsonb('unlocks')->nullable();
            $table->jsonb('progression')->nullable();
            $table->jsonb('raids')->nullable();
            $table->jsonb('world_bosses')->nullable();
            $table->jsonb('daily_crafting')->nullable();
            $table->jsonb('wizards_vault')->nullable();

            $table->timestamp('observed_at')->nullable();
        });

        /*
         * Everything the account owns, wherever it sits.
         *
         * A material can be in material storage, the bank, the shared
         * inventory or a character's bags; equipment can be worn, in an
         * inactive template, or in the Legendary Armory. They are separate
         * endpoints and separate shapes, and a planner that reads only one of
         * them will tell somebody to buy what they already have.
         */
        Schema::create('gw2_item_ledger', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gw2_account_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('item_id')->index();
            $table->unsignedInteger('quantity')->default(0);

            // materials | bank | shared | character | equipped | armory
            $table->string('location_type', 16);
            // Character name, bank slot, whatever identifies the place.
            $table->string('location_ref', 64)->nullable();

            $table->unsignedInteger('stats_id')->nullable();
            $table->jsonb('upgrades')->nullable();
            $table->timestamp('observed_at')->nullable();

            $table->index(['gw2_account_id', 'item_id']);
        });

        /*
         * What changed between two reads.
         *
         * The product promise "since your last sync" has no API behind it, and
         * neither does raid history: /v2/account/raids reports only the
         * current week. These rows are TechPlay's own record, and the only one
         * that will ever exist for an account.
         */
        Schema::create('gw2_progress_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gw2_account_id')->constrained()->cascadeOnDelete();
            $table->string('type', 40)->index();
            $table->jsonb('payload')->nullable();
            $table->timestamp('occurred_at')->index();

            $table->index(['gw2_account_id', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gw2_progress_events');
        Schema::dropIfExists('gw2_item_ledger');
        Schema::dropIfExists('gw2_account_state');
        Schema::dropIfExists('gw2_characters');
        Schema::dropIfExists('gw2_accounts');
    }
};
