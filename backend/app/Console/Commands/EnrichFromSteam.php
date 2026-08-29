<?php

namespace App\Console\Commands;

use App\Jobs\EnrichSteamBatch;
use App\Services\Releases\TalksToStores;
use App\Services\Releases\TitleNormalizer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Marries the catalogue to Steam, in two moves.
 *
 * The matching pass is one HTTP request: Steam's full applist (~200k rows)
 * is cached to disk, every app name goes through the same TitleNormalizer
 * the store aggregator trusts, and a catalogue game whose normalized name
 * matches EXACTLY ONE Steam app gets that appid written to
 * game_external_ids as a candidate. Ambiguous names — and Steam's own
 * demo/soundtrack/DLC listings — are skipped outright; a wrong match is
 * worse than no match (the Batman Returns lesson).
 *
 * The slow half is EnrichSteamBatch: a queue job that drips through the
 * candidates against Steam's appdetails endpoint, validates that the thing
 * really is a game from the right year, and fills ONLY empty columns.
 * Dispatched once from here; it reschedules itself until the queue is dry.
 */
class EnrichFromSteam extends Command
{
    use TalksToStores;

    protected $signature = 'games:enrich-steam
        {--match-only : Build the candidate list, do not start the drip}
        {--fresh-applist : Refetch the applist even if a recent copy exists}';

    protected $description = 'Match catalogue games to Steam appids, then drip-fill empty columns from appdetails';

    /** An applist name ending in these is not the game, it is merchandise. */
    private const NOT_A_GAME = [
        'demo', 'playtest', 'soundtrack', 'ost', 'trailer', 'artbook',
        'art book', 'dedicated server', 'sdk', 'beta', 'wallpaper',
    ];

    public function handle(TitleNormalizer $normalizer): int
    {
        $apps = $this->applist();
        $this->info(number_format(count($apps)).' Steam apps in the list.');

        // ── normalized name → appids (null marks an ambiguous name) ─────
        $byKey = [];
        foreach ($apps as $app) {
            $name = trim((string) ($app['name'] ?? ''));
            if ($name === '' || $this->looksLikeMerchandise($name)) {
                continue;
            }

            $key = $normalizer->key($name);
            if ($key === '') {
                continue;
            }

            // Two different apps, one key: nobody gets it.
            $byKey[$key] = array_key_exists($key, $byKey) && $byKey[$key] !== $app['appid']
                ? null
                : $app['appid'];
        }

        // ── walk the catalogue, claim unique matches ─────────────────────
        $already = DB::table('game_external_ids')->where('provider', 'steam')->pluck('game_id')->flip();
        $candidates = 0;

        // chunkById, not chunk: the second seeks past the last id it read, the
        // first re-counts from the top with an OFFSET on every pass. Sixty-seven
        // passes over this catalogue, hourly, made it the third most expensive
        // statement on the database — 16,624 calls for 38 minutes of it.
        DB::table('games')
            ->select(['id', 'name'])
            ->chunkById(5000, function ($games) use ($normalizer, $byKey, $already, &$candidates) {
                $rows = [];
                foreach ($games as $game) {
                    if (isset($already[$game->id])) {
                        continue;
                    }

                    $appid = $byKey[$normalizer->key($game->name)] ?? null;
                    if ($appid === null) {
                        continue;
                    }

                    $rows[] = [
                        'game_id' => $game->id,
                        'provider' => 'steam',
                        'external_id' => (string) $appid,
                        'metadata' => json_encode(['status' => 'candidate']),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                    $candidates++;
                }

                if ($rows !== []) {
                    DB::table('game_external_ids')->insertOrIgnore($rows);
                }
            });

        $total = DB::table('game_external_ids')
            ->where('provider', 'steam')
            ->whereRaw($this->statusIs('candidate'))
            ->count();

        $this->info(sprintf('Novih kandidata: %s | ukupno u redu za obradu: %s',
            number_format($candidates), number_format($total)));

        if ($this->option('match-only')) {
            return self::SUCCESS;
        }

        if ($total > 0) {
            EnrichSteamBatch::dispatch();
            $this->info('Drip job krenuo — '.EnrichSteamBatch::PER_RUN.' igara u minuti, dok red ne presuši.');
        }

        return self::SUCCESS;
    }

    /**
     * The full list of games on Steam, via IStoreService (the old
     * ISteamApps/GetAppList answers 404 now). Needs the same STEAM_API_KEY
     * the achievements integration already uses; `include_games=1` with
     * DLC/software/videos off means Steam itself filters the merchandise.
     *
     * @return array<int,array{appid:int,name:string}>
     */
    private function applist(): array
    {
        $path = storage_path('app/steam-applist.json');

        if (! $this->option('fresh-applist')
            && is_file($path)
            && filemtime($path) > now()->subDays(7)->getTimestamp()) {
            return json_decode((string) file_get_contents($path), true) ?? [];
        }

        $key = (string) config('services.steam.key');
        if ($key === '') {
            $this->error('STEAM_API_KEY nije postavljen — IStoreService/GetAppList ga zahtijeva.');

            return [];
        }

        $this->line('Povlačim Steam applist…');
        $apps = [];
        $lastAppid = 0;

        do {
            $response = $this->http(120)
                ->get('https://api.steampowered.com/IStoreService/GetAppList/v1/', [
                    'key' => $key,
                    'include_games' => 1,
                    'include_dlc' => 0,
                    'include_software' => 0,
                    'include_videos' => 0,
                    'include_hardware' => 0,
                    'max_results' => 50000,
                    'last_appid' => $lastAppid,
                ])
                ->throw()
                ->json('response') ?? [];

            foreach ($response['apps'] ?? [] as $app) {
                $apps[] = ['appid' => (int) $app['appid'], 'name' => (string) ($app['name'] ?? '')];
            }

            $lastAppid = (int) ($response['last_appid'] ?? 0);
            $more = (bool) ($response['have_more_results'] ?? false);
            $this->line('  …'.number_format(count($apps)).' igara');
            sleep(1);
        } while ($more && $lastAppid > 0);

        file_put_contents($path, json_encode($apps));

        return $apps;
    }

    private function looksLikeMerchandise(string $name): bool
    {
        $lower = mb_strtolower($name);
        foreach (self::NOT_A_GAME as $suffix) {
            if (str_ends_with($lower, $suffix)) {
                return true;
            }
        }

        return false;
    }

    /** Driver-safe json probe for metadata->status. */
    private function statusIs(string $status): string
    {
        return DB::getDriverName() === 'pgsql'
            ? "metadata::jsonb ->> 'status' = '{$status}'"
            : "json_extract(metadata, '$.status') = '{$status}'";
    }
}
