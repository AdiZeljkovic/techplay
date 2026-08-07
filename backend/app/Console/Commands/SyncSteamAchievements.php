<?php

namespace App\Console\Commands;

use App\Models\ConnectedAccount;
use App\Services\SteamService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * The writer the steam_achievements table waited for since its migration.
 *
 * For every connected Steam account: the games played in the last two
 * weeks (plus the most-played overall on a first sync), each matched to
 * our catalogue through game_external_ids — the appids the Steam
 * enrichment already wrote — and their achievements upserted. The
 * chronicle reads the result: genres you earn achievements in are
 * genres you demonstrably play, not just own.
 *
 * Steam profiles set to private simply return nothing; the sync skips
 * quietly rather than nagging.
 */
class SyncSteamAchievements extends Command
{
    protected $signature = 'games:sync-steam-achievements
        {--user= : Only this user id}
        {--apps=6 : How many games per user per run}';

    protected $description = 'Pull Steam achievements for connected accounts into steam_achievements';

    public function handle(SteamService $steam): int
    {
        $accounts = ConnectedAccount::where('provider', 'steam')
            ->when($this->option('user'), fn ($q) => $q->where('user_id', $this->option('user')))
            ->get(['user_id', 'provider_user_id']);

        if ($accounts->isEmpty()) {
            $this->info('Nema povezanih Steam naloga.');

            return self::SUCCESS;
        }

        $appLimit = max(1, (int) $this->option('apps'));
        $synced = 0;

        foreach ($accounts as $account) {
            try {
                $synced += $this->syncAccount($steam, $account->user_id, $account->provider_user_id, $appLimit);
            } catch (\Throwable $e) {
                Log::warning('[SyncSteamAchievements] user '.$account->user_id.': '.$e->getMessage());
            }

            sleep(1);
        }

        $this->info(sprintf('Korisnika: %d | achievementa upisano/osvježeno: %s',
            $accounts->count(), number_format($synced)));

        return self::SUCCESS;
    }

    private function syncAccount(SteamService $steam, int $userId, string $steamId, int $appLimit): int
    {
        // Recently played first; a first sync (empty table) widens to the
        // most-played overall so the profile fills immediately.
        $apps = collect($steam->getRecentlyPlayedGames($steamId))->pluck('appid');

        if ($apps->isEmpty() || ! DB::table('steam_achievements')->where('user_id', $userId)->exists()) {
            $owned = collect($steam->getOwnedGames($steamId))
                ->sortByDesc('playtime_forever')
                ->pluck('appid');
            $apps = $apps->concat($owned)->unique();
        }

        $apps = $apps->take($appLimit);
        if ($apps->isEmpty()) {
            return 0;
        }

        // appid → our game, through the enrichment's external ids.
        $gameIds = DB::table('game_external_ids')
            ->where('provider', 'steam')
            ->whereIn('external_id', $apps->map(fn ($a) => (string) $a))
            ->pluck('game_id', 'external_id');

        $written = 0;

        foreach ($apps as $appid) {
            $achievements = $steam->getPlayerAchievements($steamId, (int) $appid);
            if ($achievements === []) {
                continue;
            }

            $rows = collect($achievements)->map(fn ($a) => [
                'user_id' => $userId,
                'game_id' => $gameIds[(string) $appid] ?? null,
                'steam_appid' => (int) $appid,
                'api_name' => (string) ($a['apiname'] ?? ''),
                'display_name' => (string) ($a['name'] ?? ($a['apiname'] ?? '')),
                'description' => $a['description'] ?? null,
                'icon_url' => null,
                'achieved' => (bool) ($a['achieved'] ?? false),
                'achieved_at' => ! empty($a['unlocktime']) ? date('Y-m-d H:i:s', (int) $a['unlocktime']) : null,
                'created_at' => now(),
                'updated_at' => now(),
            ])->filter(fn ($r) => $r['api_name'] !== '')->values()->all();

            foreach (array_chunk($rows, 500) as $chunk) {
                DB::table('steam_achievements')->upsert(
                    $chunk,
                    ['user_id', 'steam_appid', 'api_name'],
                    ['achieved', 'achieved_at', 'game_id', 'updated_at']
                );
            }

            $written += count($rows);
            sleep(1); // Steam-friendly pacing
        }

        return $written;
    }
}
