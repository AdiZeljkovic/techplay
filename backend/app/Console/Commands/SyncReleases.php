<?php

namespace App\Console\Commands;

use App\Services\Releases\SteamSync;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

/**
 * Pulls the release window in from the stores.
 *
 * Run monthly for the new far month, and weekly for everything already in the
 * window — the weekly pass is nearly free, because a title we already know
 * costs nothing but its share of a listing page.
 */
class SyncReleases extends Command
{
    protected $signature = 'releases:sync
        {--store=steam : Which store to read}
        {--from= : First month of the window, YYYY-MM}
        {--to= : Last month of the window, YYYY-MM}';

    protected $description = 'Read upcoming releases from the stores into our own tables';

    public function handle(SteamSync $steam): int
    {
        if ($this->option('store') !== 'steam') {
            $this->error('Only steam is wired up so far.');

            return self::FAILURE;
        }

        [$from, $to] = $steam->window(
            $this->option('from') ? Carbon::createFromFormat('Y-m', $this->option('from'))->startOfMonth() : null,
            $this->option('to') ? Carbon::createFromFormat('Y-m', $this->option('to'))->endOfMonth() : null,
        );

        $this->info("Steam · {$from->toDateString()} → {$to->toDateString()}");

        $started = now();
        $tally = $steam->run($from, $to, fn (array $row) => $this->line("  + {$row['title']}"));

        $this->newLine();
        $this->table(
            ['in window', 'new', 'delayed', 'rejected', 'unchanged', 'took'],
            [[
                $tally['seen'],
                $tally['created'],
                $tally['updated'],
                $tally['rejected'],
                $tally['unchanged'],
                $started->diffForHumans(now(), true),
            ]]
        );

        return self::SUCCESS;
    }
}
