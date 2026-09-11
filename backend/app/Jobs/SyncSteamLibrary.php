<?php

namespace App\Jobs;

use App\Jobs\Concerns\ReleasesTheSyncLock;
use App\Models\ConnectedAccount;
use App\Models\UserGame;
use App\Services\GameMatchingService;
use App\Services\SessionSuggestionService;
use App\Services\SteamService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncSteamLibrary implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, ReleasesTheSyncLock, SerializesModels;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(private readonly int $connectedAccountId) {}

    public function handle(SteamService $steam, GameMatchingService $matcher, SessionSuggestionService $suggestions): void
    {
        $account = ConnectedAccount::with('user')->find($this->connectedAccountId);

        if (! $account || $account->provider !== 'steam') {
            return;
        }

        $account->update(['sync_status' => 'syncing', 'sync_error' => null]);

        try {
            $steamId = $account->provider_user_id;
            $ownedGames = $steam->getOwnedGames($steamId);

            /*
             * Steam answered, but declined to say what is in there.
             *
             * A library kept private returns an empty `response` object with a
             * 200, which is indistinguishable from an empty library unless you
             * look for `game_count`. Without that check the job wrote "done"
             * after three seconds and the reader was told "Synced" over an
             * empty shelf — the one state where the fix belongs entirely to
             * them and nothing on the page said so.
             */
            if ($ownedGames === null) {
                $account->update([
                    'sync_status' => 'private',
                    'sync_error' => 'Steam is not sharing your games. Open Steam → Profile → Edit Profile → Privacy Settings and set "Game details" to Public, then sync again.',
                ]);

                return;
            }
            $recentAppIds = collect($steam->getRecentlyPlayedGames($steamId))
                ->pluck('appid')
                ->flip();

            $matched = 0;
            $skipped = 0;

            foreach ($ownedGames as $steamGame) {
                $appId = (int) $steamGame['appid'];
                $name = $steamGame['name'] ?? '';
                $minutesPlayed = (int) ($steamGame['playtime_forever'] ?? 0);
                $hoursPlayed = (int) round($minutesPlayed / 60);

                /*
                 * When it was last opened, from Steam rather than from us.
                 *
                 * `last_played_at` used to be set to `now()` for anything in
                 * the recently-played list and null for everything else, which
                 * threw away a date Steam sends with every game: 114 of 215 in
                 * a real library carry one, spanning 2016 to 2026. Games never
                 * launched carry a zero, which stays null.
                 */
                $lastPlayed = (int) ($steamGame['rtime_last_played'] ?? 0);
                $lastPlayedAt = $lastPlayed > 0 ? Carbon::createFromTimestamp($lastPlayed) : null;

                /*
                 * Where the hours were spent. Steam splits them by device and
                 * we dropped the split every time — including the Deck figure,
                 * which is the one nothing else on the web will show a reader.
                 * Zeroes are left out so a row carries only what happened.
                 */
                $devices = array_filter([
                    'windows' => (int) ($steamGame['playtime_windows_forever'] ?? 0),
                    'mac' => (int) ($steamGame['playtime_mac_forever'] ?? 0),
                    'linux' => (int) ($steamGame['playtime_linux_forever'] ?? 0),
                    'deck' => (int) ($steamGame['playtime_deck_forever'] ?? 0),
                    'offline' => (int) ($steamGame['playtime_disconnected'] ?? 0),
                ]);

                $game = $matcher->matchSteamGame($appId, $name);

                if (! $game) {
                    $skipped++;

                    continue;
                }

                $matched++;

                // Determine best status guess
                $isRecent = $recentAppIds->has($appId);
                $existingEntry = UserGame::where('user_id', $account->user_id)
                    ->where('game_id', $game->id)
                    ->first();

                if ($existingEntry) {
                    // The difference between this reading and the last one is a
                    // session that happened. Steam has been telling us this all
                    // along; nothing was listening.
                    $suggestions->noticeSteamPlaytime($existingEntry, $minutesPlayed);

                    // Only update playtime — never overwrite a user-set status.
                    // Steam reports lifetime playtime, so it wins over any
                    // session total we accumulated ourselves.
                    // array_filter() drops nulls, so a game Steam has no date
                    // for leaves whatever is already recorded alone.
                    $existingEntry->update(array_filter([
                        // Steam reported hours on something this import filed
                        // as unplayed. See correctedStatus().
                        'status' => $this->correctedStatus($existingEntry, $minutesPlayed, $isRecent),
                        'hours_played' => max($existingEntry->hours_played, $hoursPlayed),
                        'playtime_minutes' => max((int) $existingEntry->playtime_minutes, $minutesPlayed),
                        'playtime_source' => 'steam',
                        'last_played_at' => $lastPlayedAt,
                        'device_playtime' => $devices ?: null,
                        // Steam reported it, whoever created the row. This is
                        // the path that used to leave Morrowind's 243 hours
                        // under an Xbox mark, because `platform` was set by
                        // whichever importer arrived first and never revisited.
                        'sources' => UserGame::withSource($existingEntry->sources, 'steam'),
                    ]));

                    $existingEntry->forceFill(['playtime_seen_minutes' => $minutesPlayed])->save();
                } else {
                    /*
                     * Three buckets, and the middle one is the point.
                     *
                     * This read `$isRecent ? 'playing' : 'backlog'`, so
                     * everything not touched in the last fortnight was filed
                     * as unplayed no matter how many hours Steam reported.
                     * On the first real import that put 91 of 189 backlog
                     * entries in the wrong place, including 1,602 hours of
                     * Lord of the Rings Online, and handed the Backlog Advisor
                     * a pile of games its reader had already finished with.
                     *
                     * Steam tells us two things and no more: whether it was
                     * played in the last two weeks, and how long it has been
                     * played in total. So that is exactly what is recorded —
                     * nothing here decides that a game was completed or
                     * abandoned, because Steam never said either.
                     */
                    $status = match (true) {
                        $isRecent => 'playing',
                        $minutesPlayed > 0 => 'played',
                        default => 'backlog',
                    };
                    UserGame::create([
                        'user_id' => $account->user_id,
                        'game_id' => $game->id,
                        'status' => $status,
                        // Where it came from. The Xbox and PlayStation imports
                        // have always written this and Steam never did, so a
                        // shelf built from Steam had 191 entries that could not
                        // say where they arrived from — and the card had no way
                        // to wear a mark.
                        'platform' => 'Steam',
                        'hours_played' => $hoursPlayed,
                        'playtime_minutes' => $minutesPlayed,
                        'playtime_source' => 'steam',
                        'device_playtime' => $devices ?: null,
                        'last_played_at' => $lastPlayedAt,
                        'sources' => ['steam'],
                        // The baseline, not a session. A first sync sees a
                        // lifetime total, and offering "you played for 300
                        // hours yesterday" would be worse than offering
                        // nothing.
                        'playtime_seen_minutes' => $minutesPlayed,
                    ]);
                }
            }

            /*
             * Achievements, handed to a job that can take as long as it needs.
             *
             * Steam has no "all achievements for this player" endpoint — it is
             * one call per game — and this used to make every one of them right
             * here. That is fine for a small shelf and impossible for a large
             * one: a member with 1,335 played games needs 1,335 sequential HTTP
             * calls, and this job is allowed 120 seconds. It failed on all
             * three tries, every time, and spent six minutes of the default
             * queue doing it.
             *
             * The shelf itself is already saved by this point, which is the
             * part somebody is waiting for. Achievements are a top-up, so they
             * go to SyncSteamAchievements, which works to a clock and hands
             * itself the remainder until the list runs out.
             */
            $playedGames = collect($ownedGames)
                ->filter(fn ($g) => (int) ($g['playtime_forever'] ?? 0) > 0)
                ->sortByDesc('playtime_forever')
                ->map(fn ($g) => ['appid' => (int) $g['appid'], 'name' => (string) ($g['name'] ?? '')])
                ->values()
                ->all();

            if ($playedGames !== []) {
                SyncSteamAchievements::dispatch($account->id, $playedGames);
            }

            $account->update([
                'sync_status' => 'done',
                'last_synced_at' => now(),
                'sync_error' => null,
            ]);

            Log::info(sprintf(
                'Steam library synced for user %d: matched=%d, skipped=%d, achievements queued for %d game(s)',
                $account->user_id,
                $matched,
                $skipped,
                count($playedGames),
            ));
        } catch (\Throwable $e) {
            $account->update([
                'sync_status' => 'error',
                'sync_error' => $e->getMessage(),
            ]);

            Log::error("Steam sync failed for account {$this->connectedAccountId}: {$e->getMessage()}");

            throw $e;
        }
    }

    /**
     * The one status this import may revise: its own wrong guess.
     *
     * A first sync files anything Steam reports zero minutes for as `backlog`,
     * which is right on the day and wrong the moment somebody plays it. This
     * job then never revisits status — deliberately, so it cannot overwrite a
     * member's own filing — so `backlog` on a game with hours on it was a state
     * nothing in the system could leave. It updated the hours every week and
     * left the shelf saying the game had never been started.
     *
     * Backlog means unplayed, so backlog *with* playtime is not a preference to
     * respect but a contradiction to settle, and Steam is the one that knows.
     * Every other status is a verdict somebody reached — `completed`,
     * `dropped`, `played`, `wishlist` — and returns null, which the
     * array_filter around the update drops.
     */
    private function correctedStatus(UserGame $entry, int $minutesPlayed, bool $isRecent): ?string
    {
        if ($entry->status !== 'backlog' || $minutesPlayed <= 0) {
            return null;
        }

        return $isRecent ? 'playing' : 'played';
    }
}
