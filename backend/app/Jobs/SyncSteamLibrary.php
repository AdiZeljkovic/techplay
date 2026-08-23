<?php

namespace App\Jobs;

use App\Models\ConnectedAccount;
use App\Models\SteamAchievement;
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
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

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
                        'hours_played' => max($existingEntry->hours_played, $hoursPlayed),
                        'playtime_minutes' => max((int) $existingEntry->playtime_minutes, $minutesPlayed),
                        'playtime_source' => 'steam',
                        'last_played_at' => $lastPlayedAt,
                        'device_playtime' => $devices ?: null,
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
                        // The baseline, not a session. A first sync sees a
                        // lifetime total, and offering "you played for 300
                        // hours yesterday" would be worse than offering
                        // nothing.
                        'playtime_seen_minutes' => $minutesPlayed,
                    ]);
                }
            }

            /*
             * Achievements, for everything actually played.
             *
             * This used to take the ten most-played games, which on a library
             * of 195 meant six of them ended up with achievements — the
             * profile's achievement panel described a fraction of a shelf and
             * gave no clue that the rest existed. A game with no minutes on it
             * has nothing to report, so playtime is the line: it costs one API
             * call per played game, 92 rather than 195 in that same library,
             * and Steam's daily allowance is orders of magnitude above it.
             */
            $playedGames = collect($ownedGames)
                ->filter(fn ($g) => (int) ($g['playtime_forever'] ?? 0) > 0)
                ->sortByDesc('playtime_forever')
                ->all();

            $completed = 0;

            foreach ($playedGames as $steamGame) {
                $appId = (int) $steamGame['appid'];
                $game = $matcher->matchSteamGame($appId, $steamGame['name'] ?? '');

                try {
                    $achievements = $steam->getPlayerAchievements($steamId, $appId);

                    if ($achievements === []) {
                        continue;
                    }

                    foreach ($achievements as $ach) {
                        SteamAchievement::updateOrCreate(
                            ['user_id' => $account->user_id, 'steam_appid' => $appId, 'api_name' => $ach['apiname'] ?? $ach['name'] ?? ''],
                            [
                                'game_id' => $game?->id,
                                'display_name' => $ach['name'] ?? null,
                                'description' => $ach['description'] ?? null,
                                'icon_url' => $ach['icon'] ?? null,
                                'achieved' => (bool) ($ach['achieved'] ?? false),
                                'achieved_at' => ! empty($ach['unlocktime']) && $ach['unlocktime'] > 0
                                    ? Carbon::createFromTimestamp($ach['unlocktime'])
                                    : null,
                            ]
                        );
                    }

                    /*
                     * Every achievement earned is the closest thing Steam has
                     * to "I finished this" — the same reading the PlayStation
                     * import already takes from a full trophy list. Nothing
                     * filled the Completed shelf for Steam before, so it sat
                     * empty however much somebody had finished.
                     *
                     * It only promotes a status this import set itself. A
                     * reader who filed the game as dropped, wishlisted, or
                     * already completed keeps their own answer.
                     */
                    $total = count($achievements);
                    $earned = collect($achievements)->filter(fn ($a) => (bool) ($a['achieved'] ?? false))->count();

                    if ($game && $total > 0 && $earned === $total) {
                        $promoted = UserGame::where('user_id', $account->user_id)
                            ->where('game_id', $game->id)
                            ->whereIn('status', ['playing', 'played', 'backlog'])
                            ->update(['status' => 'completed', 'progress' => 100]);

                        $completed += $promoted;
                    }
                } catch (\Throwable $e) {
                    Log::debug("Steam achievements skipped for appid={$appId}: {$e->getMessage()}");
                }
            }

            $account->update([
                'sync_status' => 'done',
                'last_synced_at' => now(),
                'sync_error' => null,
            ]);

            Log::info("Steam sync done for user {$account->user_id}: matched={$matched}, skipped={$skipped}, completed={$completed}");
        } catch (\Throwable $e) {
            $account->update([
                'sync_status' => 'error',
                'sync_error' => $e->getMessage(),
            ]);

            Log::error("Steam sync failed for account {$this->connectedAccountId}: {$e->getMessage()}");

            throw $e;
        }
    }
}
