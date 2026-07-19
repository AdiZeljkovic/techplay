<?php

namespace App\Jobs;

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
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

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

                if ($existingEntry) {
                    // Never overwrite a user-set status; nothing else to merge
                    // (Xbox exposes no total playtime).
                    continue;
                }

                UserGame::create([
                    'user_id' => $account->user_id,
                    'game_id' => $game->id,
                    'status' => $lastPlayed && $lastPlayed->gt(now()->subDays(14)) ? 'playing' : 'backlog',
                    'platform' => 'Xbox',
                    'progress' => min(100, max(0, $progressPct)),
                    'completed_at' => null,
                ]);
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
