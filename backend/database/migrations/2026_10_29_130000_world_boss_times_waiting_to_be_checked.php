<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The fifteen world bosses, prefilled — and still unpublished.
 *
 * The table shipped empty on purpose: spawn times are external knowledge, and
 * typing a timetable from memory is the invented data this project refuses.
 * These rows are not from memory. They were researched on 28 October 2026
 * and the times agree in every source that lists them; for the thirteen core
 * bosses that includes ArenaNet's own 2014 UTC table, which still matches. The
 * waypoints are the game's own, from `/v2/continents`.
 *
 * They still go in with `is_published = false` and no `verified_at`. The rule
 * the table was built on stands: a row reaches a reader once somebody has
 * checked it against the game. `sources` says what the prefill rests on, so the
 * person checking knows what they are confirming.
 *
 * `slug` is the `/v2/worldbosses` id, which is what lets the tonight page say
 * "not killed today" from the account's own read.
 *
 * Durations are left empty: no source gives an event's real length, only each
 * timer site's display window, and those disagree.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gw2_events', function (Blueprint $table) {
            $table->string('waypoint', 64)->nullable()->change();
            $table->string('waypoint_chat_link', 32)->nullable();
            $table->text('sources')->nullable();
        });

        $official = 'ArenaNet, "The Megaserver System: World Bosses and Events" (2014) and its UTC table '
            .'https://www.guildwars2.com/en/news/the-megaserver-system-world-bosses-and-events/ — '
            .'matched in 2026 by the wiki World boss page (Wayback 2026-10-06), GuildJen event timers (2026-06-30) and qjv/event-timers (2026-09-27). '
            .'Waypoint from /v2/continents.';

        $community = 'No ArenaNet source. Times agree in the wiki event timer data (Wayback 2025-12-12), GuildJen event timers (2026-06-30) '
            .'and qjv/event-timers (2026-09-27). Waypoint from /v2/continents.';

        $rows = json_decode((string) file_get_contents(database_path('data/gw2_world_bosses.json')), true) ?: [];

        foreach ($rows as $boss) {
            if (DB::table('gw2_events')->where('slug', $boss['slug'])->exists()) {
                continue;
            }

            DB::table('gw2_events')->insert([
                'name' => $boss['name'],
                'slug' => $boss['slug'],
                'kind' => 'world_boss',
                'region' => $boss['region'],
                'waypoint' => $boss['waypoint'],
                'waypoint_chat_link' => $boss['waypoint_chat_link'],
                'daily_times_utc' => json_encode($boss['times']),
                'duration_minutes' => null,
                'is_published' => false,
                'verified_at' => null,
                'sources' => $boss['official'] ? $official : $community,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('gw2_events', function (Blueprint $table) {
            $table->dropColumn(['waypoint_chat_link', 'sources']);
        });
    }
};
