<?php

namespace App\Jobs;

use App\Jobs\Concerns\ReleasesTheSyncLock;
use App\Models\ConnectedAccount;
use App\Models\UserGame;
use App\Services\EpicService;
use App\Services\GameMatchingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Brings an Epic library onto the shelf.
 *
 * Epic reports what an account owns and what it is called. Nothing else: no
 * playtime a third party may read, no last-played date, no achievements
 * outside EOS. So entries land as `backlog` carrying no measurement, the same
 * as GOG — a zero in the hours column would be a claim Epic never made.
 *
 * The list Epic hands back is artifacts rather than games, so engine builds,
 * plugins, soundtracks and DLC arrive alongside the real ones and are dropped
 * against the catalogue. A three-hundred-item Epic account is usually eighty
 * games and a great deal of everything else.
 *
 * Like the four before it: match by name, never overwrite a status the reader
 * chose, and record that Epic reported the game rather than stamping the
 * platform label they may have set themselves.
 */
class SyncEpicLibrary implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, ReleasesTheSyncLock, SerializesModels;

    public int $tries = 2;

    /**
     * The catalogue is asked once per publisher, and a large account has many.
     * Five minutes is the ceiling that a real library of three hundred
     * artifacts fits inside without the job being killed halfway and leaving a
     * shelf half-imported.
     */
    public int $timeout = 300;

    public function __construct(private readonly int $connectedAccountId) {}

    public function handle(EpicService $epic, GameMatchingService $matcher): void
    {
        $account = ConnectedAccount::with('user')->find($this->connectedAccountId);

        if (! $account || $account->provider !== 'epic' || ! $account->user) {
            return;
        }

        $account->update(['sync_status' => 'syncing', 'sync_error' => null]);

        $token = $this->usableToken($epic, $account);

        if (! $token) {
            $account->update([
                'sync_status' => 'expired',
                'sync_error' => 'The Epic connection expired. Reconnect with a fresh code.',
            ]);

            return;
        }

        try {
            $artifacts = $epic->ownedArtifacts($token);

            // Refused, not empty. Epic answering with something we cannot read
            // is a different statement from an account that owns nothing.
            if ($artifacts === null) {
                $account->update([
                    'sync_status' => 'error',
                    'sync_error' => 'Epic would not hand over the library. Try reconnecting.',
                ]);

                return;
            }

            $titles = $epic->titlesFor($token, $artifacts);
            $matched = 0;

            foreach ($titles as $product) {
                $game = $matcher->matchByName($product['title']);

                if (! $game) {
                    continue;
                }

                $matched++;

                $existing = UserGame::where('user_id', $account->user_id)
                    ->where('game_id', $game->id)
                    ->first();

                if ($existing) {
                    // Nothing to merge but the provenance — Epic has no figure
                    // to bring that another store might not already hold.
                    $existing->update(['sources' => UserGame::withSource($existing->sources, 'epic')]);

                    continue;
                }

                UserGame::create([
                    'user_id' => $account->user_id,
                    'game_id' => $game->id,
                    'status' => 'backlog',
                    'platform' => 'Epic Games',
                    'sources' => ['epic'],
                    'playtime_source' => null,
                ]);
            }

            $account->update([
                'sync_status' => 'done',
                'last_synced_at' => now(),
                'metadata' => array_merge($account->metadata ?? [], [
                    'artifacts' => count($artifacts),
                    'games' => count($titles),
                    'matched' => $matched,
                ]),
            ]);
        } catch (\Throwable $e) {
            Log::warning('SyncEpicLibrary failed', [
                'account' => $account->id,
                'error' => $e->getMessage(),
            ]);

            $account->update(['sync_status' => 'error', 'sync_error' => 'Could not reach Epic.']);
        }
    }

    /** A live access token, refreshing the stored one when it has aged out. */
    private function usableToken(EpicService $epic, ConnectedAccount $account): ?string
    {
        if ($account->access_token && $account->token_expires_at?->isFuture()) {
            return $account->access_token;
        }

        if (! $account->refresh_token) {
            return null;
        }

        $tokens = $epic->refresh($account->refresh_token);

        if (! $tokens) {
            return null;
        }

        $account->update([
            'access_token' => $tokens['access_token'],
            'refresh_token' => $tokens['refresh_token'] ?? $account->refresh_token,
            'token_expires_at' => now()->addSeconds($tokens['expires_in']),
        ]);

        return $tokens['access_token'];
    }
}
