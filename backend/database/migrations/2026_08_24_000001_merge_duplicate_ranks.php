<?php

use App\Models\Rank;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;

/**
 * One rung per threshold.
 *
 * The ladder was seeded twice under two sets of names. `RankSeeder` and
 * `LevelService::ANCHORS` both describe the modern one — Newcomer, Player,
 * …, Legend, Radiant, Apex, Eternal — but an older set (Noob, Newbie,
 * Legendary, Global Elite, God of Gaming) was already in the table, so the
 * seeder's `updateOrCreate(['name' => …])` matched fifteen rows by name and
 * created five more beside the ones it could not match.
 *
 * Twenty-five rows for a twenty-rung ladder, five thresholds holding two
 * rungs each. Nothing crashed; it just meant "next rank" was decided by row
 * order. A reader at 98 XP was told they were 2 XP from Player while another
 * panel could as easily have said Newbie — same threshold, different row.
 *
 * Fifty-one accounts move here: fifty from Noob to Newcomer, one from Newbie
 * to Player. The other three pairs are empty and are merged for the same
 * reason a spare key is thrown out — not because it opens the wrong door.
 *
 * Icons are normalised at the same time. The rows carried two conventions:
 * `ranks/*.png` on the storage disk (what the seeder writes) and
 * `/ranks/*.webp` served by the frontend (what an August migration wrote).
 * Both resolve — `getStorageUrl` branches on the leading slash — but only one
 * can be the answer to "where does rank art live", and the webp set is
 * smaller, deployed with the frontend and already on seventeen of the twenty.
 */
return new class extends Migration
{
    /** The older name, and the canonical rung it belongs to. */
    private const MERGES = [
        'Noob' => 'Newcomer',
        'Newbie' => 'Player',
        'Legendary' => 'Legend',
        'Global Elite' => 'Radiant',
        'God of Gaming' => 'Eternal',
    ];

    public function up(): void
    {
        foreach (self::MERGES as $oldName => $canonicalName) {
            $old = Rank::where('name', $oldName)->first();

            if (! $old) {
                continue;
            }

            $canonical = Rank::where('name', $canonicalName)->first();

            // Only the old name exists — which is the state of any database
            // that never ran the seeder. Rename it rather than delete it:
            // dropping the only rung at a threshold would strand everyone
            // standing on it.
            if (! $canonical) {
                $old->update(['name' => $canonicalName]);

                continue;
            }

            User::where('rank_id', $old->id)->update(['rank_id' => $canonical->id]);
            $old->delete();
        }

        // One convention, applied to whatever survived. Every one of the
        // twenty stems exists in frontend/public/ranks.
        foreach (Rank::all() as $rank) {
            $rank->update(['icon' => '/ranks/'.strtolower(str_replace(' ', '-', $rank->name)).'.webp']);
        }
    }

    /**
     * There is no down.
     *
     * Reversing would mean re-creating rungs that were duplicates by
     * definition and guessing which of the fifty-one accounts had been
     * standing on which of two identical thresholds. The rank a reader wears
     * is derived from their XP, so nothing here is lost that `xp:sync` cannot
     * work out again from the number that earned it.
     */
    public function down(): void
    {
        // Intentionally empty.
    }
};
