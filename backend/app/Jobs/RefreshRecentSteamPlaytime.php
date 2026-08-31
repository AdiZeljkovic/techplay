<?php

namespace App\Jobs;

use App\Models\ConnectedAccount;
use App\Models\UserGame;
use App\Services\GameMatchingService;
use App\Services\SessionSuggestionService;
use App\Services\SteamService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * The hours you put in today, today.
 *
 * A full library sync costs one achievements call per played game — ninety-odd
 * on a real library — so it runs weekly, and `platforms:resync` skips anybody
 * synced in the last six days so it cannot undo a member's own Re-sync. Both
 * are right, and together they meant the shelf could be a week behind: a game
 * bought and played on Thursday did not exist here until the following
 * Wednesday, and the hours on a game already there did not move either.
 *
 * Presence covered none of that. It knows what is running right now and says so
 * on the profile, but for anything Steam owns it deliberately banks no minutes
 * — Steam reports a lifetime total and is the authority — so "playing Metro
 * Exodus" sat above a shelf entry reading zero hours.
 *
 * This is the cheap half of the sync: GetRecentlyPlayedGames is one call per
 * account and returns exactly the games touched in the last fortnight, with
 * their lifetime totals. No achievements, no walk of the full library. At
 * half-hourly that is 48 calls a day per connected account against an
 * allowance orders of magnitude larger.
 */
class RefreshRecentSteamPlaytime implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 120;

    public function handle(SteamService $steam, GameMatchingService $matcher, SessionSuggestionService $suggestions): void
    {
        /*
         * `syncing` is left alone: a full sync is walking the same rows and
         * would race this one. Everything else is fair game — this reads two
         * dozen games at most and writes no status a member chose, so unlike
         * the weekly pass it needs no freshness window to stay out of the way.
         */
        $accounts = ConnectedAccount::where('provider', 'steam')
            ->whereNotNull('provider_user_id')
            ->where(fn ($q) => $q->whereNull('sync_status')->orWhere('sync_status', '!=', 'syncing'))
            ->get(['id', 'user_id', 'provider_user_id']);

        foreach ($accounts as $account) {
            try {
                $this->refresh($account, $steam, $matcher, $suggestions);
            } catch (\Throwable $e) {
                // One unreachable account must not stop the rest.
                Log::warning('RefreshRecentSteamPlaytime failed', [
                    'connected_account_id' => $account->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    private function refresh(
        ConnectedAccount $account,
        SteamService $steam,
        GameMatchingService $matcher,
        SessionSuggestionService $suggestions,
    ): void {
        $recent = $steam->getRecentlyPlayedGames($account->provider_user_id);

        foreach ($recent as $steamGame) {
            $appId = (int) ($steamGame['appid'] ?? 0);
            $minutes = (int) ($steamGame['playtime_forever'] ?? 0);

            if ($appId === 0) {
                continue;
            }

            $game = $matcher->matchSteamGame($appId, $steamGame['name'] ?? '');

            if (! $game) {
                continue;
            }

            $entry = UserGame::where('user_id', $account->user_id)
                ->where('game_id', $game->id)
                ->first();

            if (! $entry) {
                /*
                 * Bought this week and played the same day — the case that used
                 * to wait for Wednesday. It arrives on the shelf as `playing`
                 * because Steam only lists a game here if it was played in the
                 * last fortnight, and `playtime_seen_minutes` starts at the
                 * lifetime total so the first reading cannot be mistaken for a
                 * session that just happened.
                 */
                UserGame::create([
                    'user_id' => $account->user_id,
                    'game_id' => $game->id,
                    'status' => 'playing',
                    'platform' => 'Steam',
                    'hours_played' => (int) round($minutes / 60),
                    'playtime_minutes' => $minutes,
                    'playtime_source' => 'steam',
                    'playtime_seen_minutes' => $minutes,
                    'last_played_at' => now(),
                    'sources' => ['steam'],
                ]);

                continue;
            }

            // The difference between this reading and the last one is a session
            // that happened; the weekly sync makes the same call.
            $suggestions->noticeSteamPlaytime($entry, $minutes);

            /*
             * Only stamped when the total actually moved, so the date means
             * "played since we last looked" rather than "was in the fortnight
             * list when we happened to ask". The weekly sync replaces it with
             * Steam's own rtime_last_played either way.
             */
            $grew = $minutes > (int) $entry->playtime_seen_minutes;

            $entry->update(array_filter([
                'hours_played' => max((int) $entry->hours_played, (int) round($minutes / 60)),
                'playtime_minutes' => max((int) $entry->playtime_minutes, $minutes),
                'playtime_source' => 'steam',
                'last_played_at' => $grew ? now() : null,
                'sources' => UserGame::withSource($entry->sources, 'steam'),
                // Backlog with hours on it is a contradiction, not a filing.
                // Anything a member chose is left exactly where it is.
                'status' => $entry->status === 'backlog' && $minutes > 0 ? 'playing' : null,
            ]));

            $entry->forceFill(['playtime_seen_minutes' => $minutes])->save();
        }
    }
}
