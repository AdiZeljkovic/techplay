<?php

namespace App\Observers;

use App\Models\GiveawayEntry;
use App\Services\QuestService;

/**
 * The most-used thing on the site, and the progression system never knew.
 *
 * Twenty-one of fifty-five members have entered a giveaway — more than have
 * done anything else except confirm an email address. It runs an economy of
 * its own (`giveaway_entries.total_points`, its own streak table) that talks
 * to neither XP, Bounty, quests nor achievements, so the single widest door
 * into TechPlay led into a room with no exit.
 *
 * An observer rather than a controller hook because entries are created in
 * three places — entering, completing a task, and claiming the daily bonus —
 * each through `firstOrCreate`. `created` fires on the first of those and not
 * on the two that follow, which is exactly the once-per-giveaway payment we
 * want.
 */
class GiveawayEntryObserver
{
    public function created(GiveawayEntry $entry): void
    {
        if (! $entry->user_id) {
            return;
        }

        try {
            app(QuestService::class)->progress($entry->user, 'giveaway_entered');
        } catch (\Throwable) {
            // A quest must never be the reason somebody fails to enter a draw.
        }
    }
}
