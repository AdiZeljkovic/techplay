<?php

namespace App\Console\Commands;

use App\Services\Gw2\Advisor\DailyFractals;
use App\Services\Gw2\Gw2Client;
use App\Services\Gw2\Gw2Unavailable;
use Illuminate\Console\Command;

/**
 * Read today's and tomorrow's daily fractals.
 *
 * One public request, just after the 00:00 UTC reset. A miss is not a failure
 * worth an alert: the read before it stored tomorrow's list too, and that is
 * what the fractals page falls back on.
 */
class SyncGw2DailyFractals extends Command
{
    protected $signature = 'gw2:daily-fractals';

    protected $description = "Read today's and tomorrow's Guild Wars 2 daily fractals";

    public function handle(Gw2Client $api, DailyFractals $fractals): int
    {
        try {
            $count = $fractals->refresh($api);
        } catch (Gw2Unavailable $e) {
            $this->warn('The API is not answering: '.$e->getMessage());

            return self::SUCCESS;
        }

        $this->info("{$count} daily fractal achievements stored for today.");

        return self::SUCCESS;
    }
}
