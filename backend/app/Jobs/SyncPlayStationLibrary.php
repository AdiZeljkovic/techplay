<?php

namespace App\Jobs;

use App\Models\ConnectedAccount;
use App\Models\UserGame;
use App\Services\GameMatchingService;
use App\Services\PlayStationService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Brings a PlayStation trophy list into the shelf.
 *
 * Sony reports which games an account has trophies in and how far through each
 * one it is — but not how long anybody played. So a PlayStation import fills
 * the shelf and the completion figure and leaves playtime alone, rather than
 * writing a zero that looks like a measurement.
 *
 * Like the Steam and Xbox jobs: match by name, never overwrite a status the
 * reader chose. A shelf is theirs to arrange.
 */
class SyncPlayStationLibrary implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;

    public int $timeout = 180;

    public function __construct(private readonly int $connectedAccountId) {}

    public function handle(PlayStationService $psn, GameMatchingService $matcher): void
    {
        $account = ConnectedAccount::with('user')->find($this->connectedAccountId);

        if (! $account || $account->provider !== 'playstation' || ! $account->user) {
            return;
        }

        $account->update(['sync_status' => 'syncing', 'sync_error' => null]);

        $token = $this->usableToken($psn, $account);

        if (! $token) {
            // The refresh window has closed and only the reader can reopen it.
            // Said plainly, because "sync failed" would send them looking for a
            // fault at our end.
            $account->update([
                'sync_status' => 'expired',
                'sync_error' => 'The PlayStation connection expired. Reconnect with a fresh npsso token.',
            ]);

            return;
        }

        try {
            $titles = $psn->trophyTitles($token, $account->provider_user_id);
            $matched = 0;

            foreach ($titles as $title) {
                $game = $matcher->matchByName($title['name']);

                if (! $game) {
                    continue;
                }

                $matched++;

                $existing = UserGame::where('user_id', $account->user_id)
                    ->where('game_id', $game->id)
                    ->first();

                // 100% of the trophies is the closest thing PSN has to "I
                // finished this", and it is only a guess for a shelf that is
                // still empty here.
                //
                // Everything short of that used to be filed as `playing`,
                // which claimed the reader was in the middle of every game
                // they had ever earned a single trophy in. Trophies prove the
                // game was played and nothing more, so that is what it says.
                $status = $title['progress'] >= 100 ? 'completed' : 'played';

                if ($existing) {
                    $existing->update(['progress' => max((int) $existing->progress, (int) $title['progress'])]);

                    continue;
                }

                UserGame::create([
                    'user_id' => $account->user_id,
                    'game_id' => $game->id,
                    'status' => $status,
                    'progress' => (int) $title['progress'],
                    'platform' => 'PlayStation',
                    // Sony reports when the title was last touched even though
                    // it reports no playtime, and the timeline is built from
                    // dates rather than hours.
                    'last_played_at' => ! empty($title['last_played'])
                        ? Carbon::parse($title['last_played'])
                        : null,
                    // No playtime: Sony does not report one, and a zero here
                    // would read as "played for no time at all".
                    'playtime_source' => null,
                ]);
            }

            $account->update([
                'sync_status' => 'done',
                'last_synced_at' => now(),
                'metadata' => array_merge($account->metadata ?? [], [
                    'titles' => count($titles),
                    'matched' => $matched,
                ]),
            ]);
        } catch (\Throwable $e) {
            Log::warning('SyncPlayStationLibrary failed', [
                'account' => $account->id,
                'error' => $e->getMessage(),
            ]);

            $account->update(['sync_status' => 'error', 'sync_error' => 'Could not reach PlayStation.']);
        }
    }

    /**
     * A live access token, refreshing it if the stored one has aged out.
     */
    private function usableToken(PlayStationService $psn, ConnectedAccount $account): ?string
    {
        if ($account->access_token && $account->token_expires_at?->isFuture()) {
            return $account->access_token;
        }

        if (! $account->refresh_token) {
            return null;
        }

        $tokens = $psn->refresh($account->refresh_token);

        if (! $tokens) {
            return null;
        }

        $account->update([
            'access_token' => $tokens['access_token'],
            'refresh_token' => $tokens['refresh_token'],
            'token_expires_at' => now()->addSeconds($tokens['expires_in']),
        ]);

        return $tokens['access_token'];
    }
}
