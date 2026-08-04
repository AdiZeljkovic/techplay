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
        $reasons = [];

        $tally = $steam->run($from, $to, function (array $row, string $verdict, ?string $reason) use (&$reasons) {
            $title = mb_strimwidth($row['title'], 0, 52, '…');

            if ($verdict === 'created') {
                $this->line("  <fg=green>+</> {$title}");

                return;
            }

            $reasons[$reason] = ($reasons[$reason] ?? 0) + 1;
            $this->line("  <fg=gray>–</> <fg=gray>{$title} — {$reason}</>");
        });

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
