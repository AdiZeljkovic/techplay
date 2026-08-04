<?php

namespace App\Console\Commands;

use App\Services\Releases\NintendoSync;
use App\Services\Releases\SteamSync;
use App\Services\Releases\StoreSync;
use App\Services\Releases\TransientFailure;
use App\Services\Releases\XboxSync;
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
        {--store=all : Which store to read — steam, nintendo, xbox, or all}
        {--from= : First month of the window, YYYY-MM}
        {--to= : Last month of the window, YYYY-MM}';

    protected $description = 'Read upcoming releases from the stores into our own tables';

    public function handle(SteamSync $steam, NintendoSync $nintendo, XboxSync $xbox): int
    {
        $available = ['steam' => $steam, 'nintendo' => $nintendo, 'xbox' => $xbox];
        $wanted = $this->option('store');

        if ($wanted !== 'all' && ! isset($available[$wanted])) {
            $this->error("Unknown store '{$wanted}'. Available: ".implode(', ', array_keys($available)).', all.');

            return self::FAILURE;
        }

        $stores = $wanted === 'all' ? $available : [$wanted => $available[$wanted]];
        $failed = false;

        foreach ($stores as $name => $sync) {
            // One store being down is not a reason to skip the others.
            try {
                $this->syncOne($name, $sync);
            } catch (TransientFailure $e) {
                $this->error("  {$name} could not be read: {$e->getMessage()}");
                $failed = true;
            }

            $this->newLine();
        }

        return $failed ? self::FAILURE : self::SUCCESS;
    }

    private function syncOne(string $name, StoreSync $sync): void
    {
        [$from, $to] = $sync->window(
            $this->option('from') ? Carbon::createFromFormat('Y-m', $this->option('from'))->startOfMonth() : null,
            $this->option('to') ? Carbon::createFromFormat('Y-m', $this->option('to'))->endOfMonth() : null,
        );

        $this->info(ucfirst($name)." · {$from->toDateString()} → {$to->toDateString()}");
        $this->line('<fg=gray>Reading the listing…</>');

        // Xbox spends its whole run in discovery, so it narrates from there.
        $sync->reportUsing(fn (string $note) => $this->line("<fg=gray>  {$note}</>"));

        $started = now();
        $reasons = [];
        $bar = null;

        $tally = $sync->run(
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
            ['in window', 'new', 'delayed', 'rejected', 'unchanged', 'deferred', 'took'],
            [[
                $tally['seen'],
                $tally['created'],
                $tally['updated'],
                $tally['rejected'],
                $tally['unchanged'],
                $tally['skipped'],
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
    }
}
