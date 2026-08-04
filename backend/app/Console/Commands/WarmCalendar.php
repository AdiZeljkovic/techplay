<?php

namespace App\Console\Commands;

use App\Http\Controllers\Api\V1\CalendarController;
use App\Services\RawgService;
use Illuminate\Console\Command;

/**
 * Keeps the release calendar's RAWG cache warm.
 *
 * Without this, the first visitor after every expiry pays for the whole month
 * — several round trips to an API we do not control — and the month arrows are
 * worse still, because every step lands on a month nobody has warmed. Doing it
 * on a schedule means a visitor never waits on RAWG at all.
 */
class WarmCalendar extends Command
{
    protected $signature = 'calendar:warm {--months=4 : How many months forward to warm}';

    protected $description = 'Pre-fetch the release calendar from RAWG so no visitor waits on it';

    public function handle(RawgService $rawg, CalendarController $calendar): int
    {
        // One back, because "what just came out" is a normal thing to look up.
        $start = now()->startOfMonth()->subMonth();
        $count = (int) $this->option('months') + 1;

        $warmed = 0;

        for ($i = 0; $i < $count; $i++) {
            $month = $start->copy()->addMonths($i);
            $games = $calendar->monthReleases($rawg, $month, force: true);

            if ($games === null) {
                $this->warn("  {$month->format('Y-m')} — RAWG did not answer");

                continue;
            }

            $warmed++;
            $this->line("  {$month->format('Y-m')} — {$games->count()} releases");
        }

        $followed = $calendar->warmMostFollowed($rawg);
        $this->line("  most followed — {$followed} games");

        $this->info("Warmed {$warmed}/{$count} months.");

        return $warmed === 0 ? self::FAILURE : self::SUCCESS;
    }
}
