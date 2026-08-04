<?php

namespace App\Console\Commands;

use App\Models\GameStoreLink;
use Illuminate\Console\Command;

/**
 * Throws away what a store told us, so it can be asked again from scratch.
 *
 * The syncs are built to never re-ask about anything, which is what makes them
 * cheap — and exactly what gets in the way when a source turns out to have been
 * reading the wrong thing. This is the undo.
 *
 * It refuses to touch listings that became calendar entries unless told to, so
 * clearing out a mistaken sweep cannot quietly delete a month of the calendar.
 */
class ForgetStoreListings extends Command
{
    protected $signature = 'releases:forget
        {store : Which store to forget}
        {--including-listed : Also forget listings that became calendar entries}';

    protected $description = 'Forget what a store told us so the next sync asks again';

    public function handle(): int
    {
        $store = $this->argument('store');

        $query = GameStoreLink::where('store', $store)
            ->when(! $this->option('including-listed'), fn ($q) => $q->whereNull('game_id'));

        $count = (clone $query)->count();

        if ($count === 0) {
            $this->info("Nothing recorded for {$store}.");

            return self::SUCCESS;
        }

        $listed = GameStoreLink::where('store', $store)->whereNotNull('game_id')->count();

        $this->warn("This forgets {$count} {$store} listings.");

        if ($listed > 0 && ! $this->option('including-listed')) {
            $this->line("<fg=gray>{$listed} that became calendar entries are being kept. Pass --including-listed to drop those too.</>");
        }

        if (! $this->confirm('Go ahead?', false)) {
            return self::SUCCESS;
        }

        $query->delete();

        $this->info("Forgotten. The next {$store} sync will ask about them again.");

        return self::SUCCESS;
    }
}
