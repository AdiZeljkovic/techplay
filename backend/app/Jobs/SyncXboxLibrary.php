<?php

namespace App\Jobs;

use App\Jobs\Concerns\ReleasesTheSyncLock;
use App\Models\ConnectedAccount;
use App\Models\GameExternalId;
use App\Models\UserGame;
use App\Services\GameMatchingService;
use App\Services\OpenXblService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Imports a user's Xbox title history into their TechPlay collection.
 * Mirrors SyncSteamLibrary: matches by external id first, then by name;
 * never overwrites a user-curated status.
 */
class SyncXboxLibrary implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, ReleasesTheSyncLock, SerializesModels;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(private readonly int $connectedAccountId) {}

    public function handle(OpenXblService $xbl, GameMatchingService $matcher): void
    {
        $account = ConnectedAccount::with('user')->find($this->connectedAccountId);

        if (! $account || $account->provider !== 'xbox') {
            return;
        }

        $account->update(['sync_status' => 'syncing', 'sync_error' => null]);

        try {
            $titles = $xbl->playerTitles($account->provider_user_id);

            $matched = 0;
            $skipped = 0;

            foreach ($titles as $title) {
                if (($title['type'] ?? '') !== 'Game' || empty($title['name'])) {
                    continue;
                }

                $titleId = (string) ($title['titleId'] ?? '');
                $name = $title['name'];

                // 1. Trusted external-id mapping, 2. name match (then store the id)
                $game = null;
                if ($titleId !== '') {
                    $game = GameExternalId::where('provider', 'xbox')
                        ->where('external_id', $titleId)
                        ->with('game')
                        ->first()?->game;
                }
                if (! $game) {
                    $game = $matcher->matchByName($name);
                    if ($game && $titleId !== '') {
                        GameExternalId::firstOrCreate(
                            ['provider' => 'xbox', 'external_id' => $titleId],
                            ['game_id' => $game->id],
                        );
                    }
                }

                if (! $game) {
                    $skipped++;

                    continue;
                }

                $matched++;

                $lastPlayed = ! empty($title['titleHistory']['lastTimePlayed'])
                    ? Carbon::parse($title['titleHistory']['lastTimePlayed'])
                    : null;
                $progressPct = (int) ($title['achievement']['progressPercentage'] ?? 0);

                $existingEntry = UserGame::where('user_id', $account->user_id)
                    ->where('game_id', $game->id)
                    ->first();

                /*
                 * Xbox reports no playtime, so the first version of this
                 * skipped an existing row outright — and with it the two
                 * things Xbox *does* keep current. A library imported once
                 * then sat frozen: the last-played date never moved again and
                 * achievement progress never caught up, so a game finished
                 * last week still read as it did on the day it was linked.
                 *
                 * The reader's own status is still theirs. Everything written
                 * below is a measurement, not a decision.
                 */
                if ($existingEntry) {
                    $update = [
                        'sources' => UserGame::withSource($existingEntry->sources, 'xbox'),
                    ];

                    // Never walk a date backwards: Steam may have set a later
                    // one for the same game on another store.
                    if ($lastPlayed && (! $existingEntry->last_played_at || $lastPlayed->gt($existingEntry->last_played_at))) {
                        $update['last_played_at'] = $lastPlayed;
                    }

                    if ($progressPct > (int) $existingEntry->progress) {
                        $update['progress'] = min(100, $progressPct);
                    }

                    // Every achievement in the game, which is the same reading
                    // the Steam import takes as "finished". A status the reader
                    // chose stays theirs — only the three the importers assign
                    // are promoted.
                    if ($progressPct >= 100 && in_array($existingEntry->status, ['playing', 'played', 'backlog'], true)) {
                        $update['status'] = 'completed';
                        $update['completed_at'] = $existingEntry->completed_at ?? $lastPlayed ?? now();
                    }

                    $existingEntry->update($update);

                    continue;
                }

                UserGame::create([
                    'user_id' => $account->user_id,
                    'game_id' => $game->id,
                    /*
                     * Xbox reports no total playtime, but a title history
                     * entry carries a last-played date — and a date is proof
                     * enough that the game was played. This used to file
                     * anything older than a fortnight as backlog, which is the
                     * same mistake the Steam import made: "unplayed" claimed
                     * about games with years of history behind them.
                     */
                    'status' => match (true) {
                        // Every achievement earned is the strongest thing Xbox
                        // says about finishing, and the same reading the Steam
                        // import takes.
                        $progressPct >= 100 => 'completed',
                        $lastPlayed && $lastPlayed->gt(now()->subDays(14)) => 'playing',
                        (bool) $lastPlayed => 'played',
                        default => 'backlog',
                    },
                    // The reader's label, which they may edit. Which store
                    // reported it is `sources`, below.
                    'platform' => 'Xbox',
                    'sources' => ['xbox'],
                    'progress' => min(100, max(0, $progressPct)),
                    // The date was already read to decide the status above and
                    // then thrown away; the timeline is built out of exactly
                    // this, so it is kept.
                    'last_played_at' => $lastPlayed,
                    'completed_at' => $progressPct >= 100 ? ($lastPlayed ?? now()) : null,
                ]);
            }

            // Refresh public profile stats (gamerscore) alongside the library
            try {
                $summary = $xbl->playerSummary($account->provider_user_id);
                if ($summary) {
                    $account->metadata = array_merge($account->metadata ?? [], [
                        'gamerscore' => $summary['gamerscore'],
                        'avatar' => $summary['avatar'],
                    ]);
                }
            } catch (\Throwable) {
            }

            $account->update([
                'sync_status' => 'done',
                'last_synced_at' => now(),
                'sync_error' => null,
            ]);

            Log::info("Xbox sync done for user {$account->user_id}: matched={$matched}, skipped={$skipped}");
        } catch (\Throwable $e) {
            $account->update([
                'sync_status' => 'error',
                'sync_error' => $e->getMessage(),
            ]);

            Log::error("Xbox sync failed for account {$this->connectedAccountId}: {$e->getMessage()}");

            throw $e;
        }
    }
}
