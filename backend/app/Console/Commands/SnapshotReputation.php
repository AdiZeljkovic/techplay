<?php

namespace App\Console\Commands;

use App\Models\ReputationSnapshot;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;

/**
 * Captures a per-user reputation + monthly contribution snapshot for a period
 * (defaults to the month that just ended). Powers the month-over-month deltas
 * on the profile dashboard. Scheduled monthly; --period=YYYY-MM to backfill.
 */
class SnapshotReputation extends Command
{
    protected $signature = 'profile:snapshot-reputation
        {--period= : Period to snapshot as YYYY-MM (defaults to last month)}
        {--weekly : Snapshot the CURRENT week baseline (period like 2026-W29) for weekly leaderboards}';

    protected $description = 'Snapshot each user\'s reputation/XP and monthly contribution for deltas and weekly leaderboards';

    public function handle(): int
    {
        // Weekly mode: capture the start-of-week baseline (run Monday 00:10).
        // Weekly leaderboards rank users by current value minus this baseline.
        if ($this->option('weekly')) {
            return $this->snapshotWeekly();
        }

        $period = $this->option('period') ?: now()->subMonth()->format('Y-m');

        if (! preg_match('/^\d{4}-\d{2}$/', $period)) {
            $this->error("Invalid period '{$period}'. Use YYYY-MM.");

            return self::FAILURE;
        }

        $start = Carbon::createFromFormat('Y-m-d', "{$period}-01")->startOfMonth();
        $end = (clone $start)->endOfMonth();
        $weights = config('ranking.contribution_weights') ?: ['post' => 5, 'comment' => 2, 'thread' => 10];

        $this->info("Snapshotting reputation for {$period}…");
        $count = 0;

        User::query()->chunkById(200, function ($users) use ($period, $start, $end, $weights, &$count) {
            foreach ($users as $user) {
                $posts = $user->posts()->whereBetween('created_at', [$start, $end])->count();
                $comments = $user->comments()->where('status', 'approved')->whereBetween('created_at', [$start, $end])->count();
                $threads = $user->threads()->whereBetween('created_at', [$start, $end])->count();
                $contribution = $posts * $weights['post'] + $comments * $weights['comment'] + $threads * $weights['thread'];

                ReputationSnapshot::updateOrCreate(
                    ['user_id' => $user->id, 'period' => $period],
                    [
                        'reputation' => (int) ($user->forum_reputation ?? 0),
                        'xp' => (int) ($user->xp ?? 0),
                        'contribution_points' => $contribution,
                    ],
                );
                $count++;
            }
        });

        $this->info("Done — {$count} snapshots written for {$period}. ✓");

        return self::SUCCESS;
    }

    private function snapshotWeekly(): int
    {
        $period = now()->format('o-\WW'); // e.g. 2026-W29

        $this->info("Snapshotting weekly baseline for {$period}…");
        $count = 0;

        User::query()->chunkById(500, function ($users) use ($period, &$count) {
            foreach ($users as $user) {
                ReputationSnapshot::updateOrCreate(
                    ['user_id' => $user->id, 'period' => $period],
                    [
                        'reputation' => (int) ($user->forum_reputation ?? 0),
                        'xp' => (int) ($user->xp ?? 0),
                        'contribution_points' => 0,
                    ],
                );
                $count++;
            }
        });

        $this->info("Done — {$count} weekly baselines written for {$period}. ✓");

        return self::SUCCESS;
    }
}
