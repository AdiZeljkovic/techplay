<?php

namespace App\Jobs;

use App\Jobs\Concerns\ReleasesTheSyncLock;
use App\Models\ConnectedAccount;
use App\Models\GameExternalId;
use App\Models\UserGame;
use App\Services\GameMatchingService;
use App\Services\GogService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Brings a GOG library onto the shelf.
 *
 * GOG says less than any store we already read. It reports what an account
 * owns and nothing else: no playtime — Galaxy keeps that in a local database
 * on the reader's own machine and never exposes it — no last-played date, no
 * achievements a third party may see. So every entry lands as `backlog` and
 * carries no measurement at all, which is honest. A zero in the hours column
 * would read as "played for no time"; an absence reads as "not tracked", and
 * that is what the card already says.
 *
 * Like Steam, Xbox and PlayStation before it: match by name, never overwrite a
 * status the reader chose, and record that GOG reported the game rather than
 * stamping the platform label they may have set themselves.
 */
class SyncGogLibrary implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, ReleasesTheSyncLock, SerializesModels;

    public int $tries = 2;

    public int $timeout = 180;

    public function __construct(private readonly int $connectedAccountId) {}

    public function handle(GogService $gog, GameMatchingService $matcher): void
    {
        $account = ConnectedAccount::with('user')->find($this->connectedAccountId);

        if (! $account || $account->provider !== 'gog' || ! $account->user) {
            return;
        }

        $account->update(['sync_status' => 'syncing', 'sync_error' => null]);

        $token = $this->usableToken($gog, $account);

        if (! $token) {
            // GOG's access token lives an hour and the refresh token behind it
            // does eventually stop working. Only the reader can reopen that
            // door, so this says so rather than reading as a fault of ours.
            $account->update([
                'sync_status' => 'expired',
                'sync_error' => 'The GOG connection expired. Reconnect with a fresh code.',
            ]);

            return;
        }

        try {
            $ids = $gog->ownedProductIds($token);

            // Refused, not empty. GOG answering with something we cannot read
            // is a different statement from an account that owns nothing, and
            // the reader must not be told "Synced" over an empty shelf.
            if ($ids === null) {
                $account->update([
                    'sync_status' => 'error',
                    'sync_error' => 'GOG would not hand over the library. Try reconnecting.',
                ]);

                return;
            }

            $titles = $gog->titlesFor($ids);
            $matched = 0;

            foreach ($titles as $product) {
                $game = $matcher->matchByName($product['title']);

                if (! $game) {
                    continue;
                }

                $matched++;

                /*
                 * GOG's own id for the game, kept.
                 *
                 * It was in hand on every import and thrown away, so a game
                 * GOG sells and Steam does not had no identity anywhere and no
                 * way to be priced. GOG publishes a price endpoint that takes
                 * exactly this id; the shelf-price job uses it for the titles
                 * Steam has never heard of.
                 */
                if (! empty($product['id'])) {
                    GameExternalId::firstOrCreate(
                        ['provider' => 'gog', 'external_id' => (string) $product['id']],
                        ['game_id' => $game->id],
                    );
                }

                $existing = UserGame::where('user_id', $account->user_id)
                    ->where('game_id', $game->id)
                    ->first();

                if ($existing) {
                    // Nothing to merge but the provenance — GOG has no figure
                    // to bring that another store might not already hold.
                    $existing->update(['sources' => UserGame::withSource($existing->sources, 'gog')]);

                    continue;
                }

                UserGame::create([
                    'user_id' => $account->user_id,
                    'game_id' => $game->id,
                    // Owned, and that is the whole of what GOG said.
                    'status' => 'backlog',
                    'platform' => 'GOG',
                    'sources' => ['gog'],
                    'playtime_source' => null,
                ]);
            }

            $account->update(array_filter([
                'sync_status' => 'done',
                'last_synced_at' => now(),
                'metadata' => array_merge($account->metadata ?? [], [
                    'owned' => count($ids),
                    'games' => count($titles),
                    'matched' => $matched,
                ]),
                // Backfill for accounts linked before the name was asked for.
                // Only when it is missing: a sync should not overwrite a name
                // somebody is already shown under.
                'display_name' => $account->display_name ?: $this->nameOrNull($gog, $token),
            ], fn ($v) => $v !== null && $v !== ''));
        } catch (\Throwable $e) {
            Log::warning('SyncGogLibrary failed', [
                'account' => $account->id,
                'error' => $e->getMessage(),
            ]);

            $account->update(['sync_status' => 'error', 'sync_error' => 'Could not reach GOG.']);
        }
    }

    /**
     * The account name, or nothing, and never an exception.
     *
     * This sits inside the block that decides whether the import succeeded, and
     * a name is decoration: a library of a hundred and eighty games must not be
     * reported as a failed sync because GOG would not say what the account is
     * called. Caught here rather than relied on being caught outside, where it
     * would land in the same handler that writes "Could not reach GOG".
     */
    private function nameOrNull(GogService $gog, string $token): ?string
    {
        try {
            return $gog->username($token);
        } catch (\Throwable) {
            return null;
        }
    }

    /** A live access token, refreshing the stored one when it has aged out. */
    private function usableToken(GogService $gog, ConnectedAccount $account): ?string
    {
        if ($account->access_token && $account->token_expires_at?->isFuture()) {
            return $account->access_token;
        }

        if (! $account->refresh_token) {
            return null;
        }

        $tokens = $gog->refresh($account->refresh_token);

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
