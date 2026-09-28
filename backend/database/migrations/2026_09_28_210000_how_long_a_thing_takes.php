<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * How long a recommendation takes, and when things happen in Tyria.
 *
 * ── The minutes ─────────────────────────────────────────────────────────
 *
 * The "Tonight" mockup draws a schedule: 0–10 the vault, 10–20 a fractal, 20–35
 * a hero point train. Nothing computes any of those numbers and nothing could —
 * the game does not report how long anything takes and people play at different
 * speeds.
 *
 * So they are an **editorial estimate**, and they live where every other
 * editorial decision in this tool lives: on the rule, with a date, editable
 * without a deploy. A range rather than a figure, because "about ten to fifteen
 * minutes" is a claim somebody can stand behind and "10 min" is not. The UI
 * shows them as estimates, in those words.
 *
 * Nullable on purpose. A rule with no estimate is not a rule with a zero — it is
 * one nobody has judged yet, and a session plan simply orders it without
 * claiming a duration.
 *
 * ── The schedule ────────────────────────────────────────────────────────
 *
 * World boss and meta event times are real, fixed and published, and they are
 * not in the API anywhere: `/v2/account/worldbosses` says which ones this account
 * killed today, never when the next one spawns.
 *
 * This table ships **empty**. The times are external knowledge, and typing a
 * timetable from memory is exactly the kind of invented data this project has
 * spent the whole build refusing. The machinery is here and the admin screen is
 * here; the rows come from somebody who has checked them against the game.
 * Until then the panel does not render at all, rather than rendering wrong.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gw2_rules', function (Blueprint $table) {
            $table->unsignedSmallInteger('minutes_low')->nullable()->after('effort_band');
            $table->unsignedSmallInteger('minutes_high')->nullable()->after('minutes_low');
        });

        Schema::create('gw2_events', function (Blueprint $table) {
            $table->id();

            $table->string('name', 120);
            $table->string('slug', 140)->unique();

            // world_boss | meta | festival
            $table->string('kind', 24)->index();
            $table->string('region', 48)->nullable();
            $table->string('waypoint', 32)->nullable();

            /*
             * Minutes past midnight UTC, one row per daily occurrence.
             *
             * UTC because the game resets on it and a player's timezone is the
             * client's problem, not the database's. Stored as an integer rather
             * than a time so arithmetic against "now" needs no casting.
             */
            $table->jsonb('daily_times_utc')->nullable();

            // How long the thing itself runs, for "is it on right now".
            $table->unsignedSmallInteger('duration_minutes')->nullable();

            $table->string('rewards', 200)->nullable();
            $table->boolean('is_published')->default(false)->index();

            /*
             * Who checked it, and when. An unchecked row never reaches a reader:
             * a wrong spawn time sends somebody to an empty map, which is worse
             * than telling them nothing.
             */
            $table->timestamp('verified_at')->nullable();
            $table->string('verified_source', 200)->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gw2_events');

        Schema::table('gw2_rules', function (Blueprint $table) {
            $table->dropColumn(['minutes_low', 'minutes_high']);
        });
    }
};
