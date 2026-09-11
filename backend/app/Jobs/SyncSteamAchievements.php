<?php

namespace App\Jobs;

use App\Models\ConnectedAccount;
use App\Models\SteamAchievement;
use App\Models\UserGame;
use App\Services\GameMatchingService;
use App\Services\SteamService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Achievements, fetched for as long as there is time and then handed on.
 *
 * Steam has no endpoint for "all achievements for this player". There is one
 * call per game, and that was being done inline inside SyncSteamLibrary for
 * every game with minutes on it — which is fine for a small shelf and
 * impossible for a large one. One member has 1,916 games, 1,335 of them
 * played: 1,335 sequential HTTP calls inside a job allowed 120 seconds, which
 * works out to 0.09 seconds per call when Steam's best is around 0.3. It could
 * not finish, it never would, and it failed identically on all three tries —
 * six minutes of the default queue spent on a certainty.
 *
 * Raising the timeout only moves the wall. This works to a clock instead: it
 * takes games off the front of the list until its budget is nearly spent, then
 * dispatches itself with whatever is left. However long Steam takes and however
 * large the library, no single run overruns and no work is repeated.
 *
 * The budget is deliberately well under the timeout. A run that stops with
 * forty seconds to spare ends by itself; one that stops at the timeout is
 * killed mid-request, and then the whole pass is retried from the top.
 */
class SyncSteamAchievements implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 120;

    /** Long enough to be worth a pass, short enough to always land. */
    private const BUDGET_SECONDS = 75;

    /**
     * A ceiling on passes, so a permanently unhappy account cannot circle.
     *
     * 1,335 games at roughly 200 a pass is seven; sixty is far past any real
     * library and still a number that ends.
     */
    private const MAX_PASSES = 60;

    /**
     * @param  array<int, array{appid:int, name:string}>  $games
     */
    public function __construct(
        private readonly int $connectedAccountId,
        private readonly array $games,
        private readonly int $pass = 1,
    ) {}

    public function handle(SteamService $steam, GameMatchingService $matcher): void
    {
        $account = ConnectedAccount::find($this->connectedAccountId);

        if (! $account || $account->provider !== 'steam' || $this->games === []) {
            return;
        }

        $steamId = $account->provider_user_id;
        $startedAt = microtime(true);

        $remaining = $this->games;
        $attempted = 0;
        $completed = 0;

        while ($remaining !== [] && (microtime(true) - $startedAt) < self::BUDGET_SECONDS) {
            /*
             * Taken off the list before it is tried, not after.
             *
             * A game whose call times out every time would otherwise sit at the
             * head of the queue and be retried on every pass for ever. Counting
             * attempts rather than successes is what guarantees the list gets
             * shorter.
             */
            $steamGame = array_shift($remaining);
            $attempted++;

            $appId = (int) ($steamGame['appid'] ?? 0);

            if ($appId <= 0) {
                continue;
            }

            try {
                $game = $matcher->matchSteamGame($appId, $steamGame['name'] ?? '');
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
                 * Every achievement earned is the closest thing Steam has to
                 * "I finished this" — the same reading the PlayStation import
                 * takes from a full trophy list.
                 *
                 * It only promotes a status this import set itself. A reader
                 * who filed the game as dropped, wishlisted or already
                 * completed keeps their own answer.
                 */
                $total = count($achievements);
                $earned = collect($achievements)->filter(fn ($a) => (bool) ($a['achieved'] ?? false))->count();

                if ($game && $total > 0 && $earned === $total) {
                    $completed += UserGame::where('user_id', $account->user_id)
                        ->where('game_id', $game->id)
                        ->whereIn('status', ['playing', 'played', 'backlog'])
                        ->update(['status' => 'completed', 'progress' => 100]);
                }
            } catch (\Throwable $e) {
                Log::debug("Steam achievements skipped for appid={$appId}: {$e->getMessage()}");
            }
        }

        if ($remaining === []) {
            Log::info(sprintf(
                'Steam achievements finished for user %d after %d pass(es)',
                $account->user_id,
                $this->pass,
            ));

            return;
        }

        if ($this->pass >= self::MAX_PASSES) {
            Log::warning(sprintf(
                'Steam achievements gave up for user %d: %d games still unread after %d passes',
                $account->user_id,
                count($remaining),
                $this->pass,
            ));

            return;
        }

        // A short pause between passes. Nothing here is urgent, and the default
        // queue also carries the publish fan-out and the store enrichment.
        self::dispatch($this->connectedAccountId, array_values($remaining), $this->pass + 1)
            ->delay(now()->addSeconds(10));

        Log::info(sprintf(
            'Steam achievements pass %d for user %d: %d read, %d left, %d marked complete',
            $this->pass,
            $account->user_id,
            $attempted,
            count($remaining),
            $completed,
        ));
    }
}
