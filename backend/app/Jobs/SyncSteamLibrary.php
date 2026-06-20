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

class SyncSteamLibrary implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(private readonly int $connectedAccountId) {}

    public function handle(SteamService $steam, GameMatchingService $matcher): void
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
                    // Only update playtime — never overwrite a user-set status
                    $existingEntry->update(['hours_played' => max($existingEntry->hours_played, $hoursPlayed)]);
                } else {
                    $status = $isRecent ? 'playing' : 'backlog';
                    UserGame::create([
                        'user_id' => $account->user_id,
                        'game_id' => $game->id,
                        'status' => $status,
                        'hours_played' => $hoursPlayed,
                    ]);
                }
            }

            // Sync achievements for top 10 most-played matched games
            $topGames = collect($ownedGames)
                ->sortByDesc('playtime_forever')
                ->take(10)
                ->all();

            foreach ($topGames as $steamGame) {
                $appId = (int) $steamGame['appid'];
                $game = $matcher->matchSteamGame($appId, $steamGame['name'] ?? '');

                try {
                    $achievements = $steam->getPlayerAchievements($steamId, $appId);
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
                } catch (\Throwable $e) {
                    Log::debug("Steam achievements skipped for appid={$appId}: {$e->getMessage()}");
                }
            }

            $account->update([
                'sync_status' => 'done',
                'last_synced_at' => now(),
                'sync_error' => null,
            ]);

            Log::info("Steam sync done for user {$account->user_id}: matched={$matched}, skipped={$skipped}");
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
