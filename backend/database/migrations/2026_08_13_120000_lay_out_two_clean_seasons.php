<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Two seasons, three months each, one after the other.
 *
 * Production carried two seasons flagged active at once — "Summer of Gaming
 * 2026" (20 Jun – 21 Sep) and "Season 1: Ignition" (7 Aug – 7 Nov) — overlapping
 * for six weeks. Season::active() breaks that tie by lowest id, so Summer won
 * and Ignition was invisible the whole time it was supposed to be running: its
 * multipliers never applied and anything bound to it would never have shown.
 *
 * Summer is left exactly as it is. It is running now, people have been earning
 * under its 1.25×, and moving its end date would rewrite what already happened.
 * Ignition slides to the day after Summer closes, and Overdrive follows it, so
 * the calendar reads as one continuous ladder with no two seasons ever live at
 * the same time.
 */
return new class extends Migration
{
    /** Both new seasons run at 1.00×. See down() note for why. */
    private const SEASONS = [
        [
            'slug' => 'season-1-ignition',
            'name' => 'Season 1: Ignition',
            'description' => 'The first numbered season. Build your shelf, log your sessions, and earn your place on the ladder.',
            'start_date' => '2026-09-22',
            'end_date' => '2026-12-21',
        ],
        [
            'slug' => 'season-2-overdrive',
            'name' => 'Season 2: Overdrive',
            'description' => 'Three months to push past what you built in Ignition. Deeper quests, a longer ladder, and a badge that stops being available the day it ends.',
            'start_date' => '2026-12-22',
            'end_date' => '2027-03-21',
        ],
    ];

    public function up(): void
    {
        foreach (self::SEASONS as $season) {
            DB::table('seasons')->updateOrInsert(
                ['slug' => $season['slug']],
                [
                    'name' => $season['name'],
                    'description' => $season['description'],
                    'start_date' => $season['start_date'],
                    'end_date' => $season['end_date'],
                    'is_active' => true,
                    // Deliberately 1.00. A multiplier makes XP mean a different
                    // amount of work depending on when it was earned, and XP is
                    // the single number the whole rank ladder is built on. A
                    // season should matter through its quests, its leaderboard
                    // and its badge — not by inflating the currency. Boosts
                    // belong to short events, where the distortion is bounded.
                    'xp_multiplier' => 1.00,
                    'bounty_multiplier' => 1.00,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        // "Season Grind" and "Season Chronicler" are generic monthly quests —
        // finish games, log sessions — that were pinned to whichever season
        // happened to exist when they were written. Left that way they would
        // vanish the day that season closed, for no reason anyone could see.
        // Unpinned, they stay monthly quests; the real seasonal arcs get
        // authored per season.
        DB::table('quests')
            ->whereIn('criteria_type', ['game_completed', 'session_logged'])
            ->where('type', 'monthly')
            ->update(['season_id' => null]);
    }

    public function down(): void
    {
        // Overdrive never existed before this migration; Ignition did, with the
        // dates that put it on top of Summer.
        DB::table('seasons')->where('slug', 'season-2-overdrive')->delete();

        DB::table('seasons')->where('slug', 'season-1-ignition')->update([
            'start_date' => '2026-08-07',
            'end_date' => '2026-11-07',
        ]);
    }
};
