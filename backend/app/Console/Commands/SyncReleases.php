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
        $this->line('<fg=gray>Reading the listing…</>');

        $started = now();
        $reasons = [];
        $bar = null;

        $tally = $steam->run(
            $from,
            $to,
            function (array $row, string $verdict, ?string $reason) use (&$reasons, &$bar) {
                if ($reason !== null) {
                    $reasons[$reason] = ($reasons[$reason] ?? 0) + 1;
                }

                // Newly kept titles are the only ones worth a line of their
                // own; everything else just moves the bar.
                if ($verdict === 'created' && $bar) {
                    $bar->clear();
                    $this->line('  <fg=green>+</> '.mb_strimwidth($row['title'], 0, 60, '…'));
                    $bar->display();
                }

                $bar?->advance();
            },
            function (int $total) use (&$bar) {
                $this->line("<fg=gray>{$total} titles in the window.</>");
                $this->newLine();

                $bar = $this->output->createProgressBar($total);
                $bar->start();
            },
        );

        $bar?->finish();
        $this->newLine(2);
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

        // Which rule did the rejecting matters more than the total: it is how
        // we tell "the gate is working" from "the gate is too tight".
        if ($reasons !== []) {
            arsort($reasons);
            $this->newLine();
            $this->line('<fg=gray>Rejected by rule:</>');

            foreach ($reasons as $reason => $count) {
                $this->line(sprintf('  <fg=gray>%-36s %d</>', $reason, $count));
            }
        }

        return self::SUCCESS;
    }
}
