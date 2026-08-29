<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Four tables that only ever grew, trimmed to what anything still reads.
 *
 * None of them is large today — the site is young — and that is exactly why
 * they are worth bounding now: each one gains rows with every reader, none has
 * ever lost one, and the day any of them matters is the day it is expensive to
 * fix. Every window below is set by what actually reads the table, not by a
 * round number.
 */
class PruneDerivedHistory extends Command
{
    protected $signature = 'prune:derived-history {--dry-run : Count without deleting}';

    protected $description = 'Trim signal, suggestion, notification and version history to what is still read';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');

        $plans = [
            /*
             * ChronicleBuilder reads a rolling window of roughly ninety days
             * when it works out somebody's taste; a signal older than that has
             * no reader. One row per user, game, type and day.
             */
            [
                'table' => 'player_signals',
                'column' => 'day',
                'keep' => now()->subDays(120)->toDateString(),
                'why' => 'chronicle reads ~90 days',
            ],
            /*
             * A suggestion is an offer to log a session. Unanswered after two
             * months it is not going to be answered, and the playtime it was
             * derived from has been overwritten several times since.
             */
            [
                'table' => 'session_suggestions',
                'column' => 'created_at',
                'keep' => now()->subDays(60),
                'why' => 'an unanswered suggestion expires',
                'extra' => fn ($q) => $q->where('status', '!=', 'accepted'),
            ],
            /*
             * The bell shows twenty per page and nobody scrolls a year back.
             * Read ones go first and sooner: an unread notification from four
             * months ago is still something the reader has not seen.
             */
            [
                'table' => 'notifications',
                'column' => 'created_at',
                'keep' => now()->subDays(90),
                'why' => 'read notifications, older than the bell shows',
                'extra' => fn ($q) => $q->whereNotNull('read_at'),
            ],
            [
                'table' => 'notifications',
                'column' => 'created_at',
                'keep' => now()->subDays(365),
                'why' => 'unread notifications, after a year',
            ],
        ];

        foreach ($plans as $plan) {
            $query = DB::table($plan['table'])->where($plan['column'], '<', $plan['keep']);

            if (isset($plan['extra'])) {
                $query = $plan['extra']($query);
            }

            $count = (clone $query)->count();

            if ($count === 0) {
                $this->line("  {$plan['table']}: ništa za brisanje ({$plan['why']})");

                continue;
            }

            if ($dry) {
                $this->line("  {$plan['table']}: {$count} redova bi bilo obrisano ({$plan['why']})");

                continue;
            }

            $query->delete();
            $this->info("  {$plan['table']}: obrisano {$count} ({$plan['why']})");
        }

        $this->pruneContentVersions($dry);

        return self::SUCCESS;
    }

    /**
     * Versions are kept by count, not by age.
     *
     * A snapshot of the whole body is written on every save that touches the
     * title or the content, so a piece worked on for a day can carry thirty.
     * What the restore panel is for is going back a few steps, not to the first
     * draft — and by age alone a heavily edited article would still keep all
     * thirty while an old one kept none.
     */
    private function pruneContentVersions(bool $dry): void
    {
        $keep = 20;

        $over = DB::table('content_versions')
            ->select('versionable_type', 'versionable_id')
            ->groupBy('versionable_type', 'versionable_id')
            ->havingRaw('count(*) > ?', [$keep])
            ->get();

        $removed = 0;

        foreach ($over as $row) {
            $ids = DB::table('content_versions')
                ->where('versionable_type', $row->versionable_type)
                ->where('versionable_id', $row->versionable_id)
                ->orderByDesc('id')
                ->skip($keep)
                ->take(1000)
                ->pluck('id');

            if ($ids->isEmpty()) {
                continue;
            }

            $removed += $ids->count();

            if (! $dry) {
                DB::table('content_versions')->whereIn('id', $ids)->delete();
            }
        }

        $verb = $dry ? 'bi bilo obrisano' : 'obrisano';
        $this->line("  content_versions: {$verb} {$removed} (zadnjih {$keep} po tekstu ostaje)");
    }
}
