<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Where a game can be bought and where it lives online.
 *
 * Two sources, kept apart because they answer different questions.
 * `external_games` is IGDB's map of a game onto the storefronts that sell it —
 * 172,590 Steam pages, 29,473 Amazon, 25,015 itch.io, and so on down. `websites`
 * is where the game is *present*: its own site, its Discord, its subreddit.
 *
 * Neither goes into `game_store_links`. That table belongs to the release
 * aggregator, which scores forty points per distinct store on it and admits
 * games to the release calendar by counting its rows — so filling it from here
 * would move the calendar and every hype score on the site as a side effect of
 * adding buy buttons.
 *
 * The official site is the exception: `games.website` already exists and is
 * already what the page reads, so that one is filled in place, and only where
 * it is empty.
 */
class IgdbLinks extends Command
{
    protected $signature = 'igdb:links
                            {--chunk=5000 : Rows inserted at a time}
                            {--apply : Actually write. Without it nothing is saved}';

    protected $description = 'Uvozi veze na trgovine, sluzbene sajtove i drustvene mreze iz IGDB-a';

    /**
     * Their store sources, under the names a reader would recognise.
     *
     * Twitch and GiantBomb carry the most rows of any source and neither is a
     * shop — they are a stream and a wiki. Anything not listed here is not a
     * place to buy a game and does not belong under "where to get it".
     */
    private const STORES = [
        1 => 'Steam',
        5 => 'GOG',
        11 => 'Microsoft Store',
        13 => 'App Store',
        15 => 'Google Play',
        20 => 'Amazon',
        26 => 'Epic Games Store',
        30 => 'itch.io',
        31 => 'Xbox Marketplace',
        36 => 'PlayStation Store',
    ];

    /**
     * Website types worth a link, by their name in `website_types`.
     *
     * Steam is missing on purpose: `external_games` already carries it with a
     * store id beside it, and one Steam link per game is the point of the
     * unique key.
     */
    private const SOCIAL = [
        'Discord' => 'social',
        'Twitter' => 'social',
        'YouTube' => 'social',
        'Twitch' => 'social',
        'Reddit' => 'social',
        'Facebook' => 'social',
        'Instagram' => 'social',
        'Wikipedia' => 'reference',
        'Wikia' => 'reference',
        'Community Wiki' => 'reference',
    ];

    public function handle(): int
    {
        if (! DB::table('igdb_raw')->where('endpoint', 'external_game_sources')->exists()) {
            $this->error('Nema sifarnika izvora — pokreni igdb:pull --endpoint=external_game_sources --endpoint=website_types.');

            return self::FAILURE;
        }

        $ours = $this->ourGames();

        if ($ours === []) {
            $this->error('Nijedna nasa igra nije spojena s IGDB-om.');

            return self::FAILURE;
        }

        $apply = (bool) $this->option('apply');

        $this->line('  Citam veze na trgovine…');
        $links = $this->stores($ours);

        $this->line('  Citam sajtove…');
        [$sites, $official] = $this->websites($ours);

        foreach ($sites as $gameId => $rows) {
            $links[$gameId] = array_merge($links[$gameId] ?? [], $rows);
        }

        $written = $apply ? $this->write($links) : array_sum(array_map('count', $links));
        $siteCount = $apply ? $this->officialSites($official) : count($official);

        $this->newLine();
        $this->line(sprintf('  %s %s veza na %s igara.',
            $apply ? 'Upisano:' : 'Bilo bi upisano:',
            number_format($written), number_format(count($links))));
        $this->line(sprintf('  %s %s sluzbenih sajtova u games.website.',
            $apply ? 'Popunjeno:' : 'Bilo bi popunjeno:', number_format($siteCount)));

        $this->newLine();
        $this->byService($links);

        if (! $apply) {
            $this->warn('  Nista nije upisano. Dodaj --apply da se sacuva.');
        }

        return self::SUCCESS;
    }

    /** @return array<int, int> their game id => our game id */
    private function ourGames(): array
    {
        $out = [];

        foreach (DB::table('game_external_ids')->where('provider', 'igdb')->pluck('game_id', 'external_id') as $external => $gameId) {
            $out[(int) $external] = (int) $gameId;
        }

        return $out;
    }

    /** @return array<int, array<string, array{kind: string, url: string}>> */
    private function stores(array $ours): array
    {
        $out = [];

        $this->scan('external_games', function (array $p) use (&$out, $ours) {
            $game = $ours[(int) ($p['game'] ?? 0)] ?? null;
            $service = self::STORES[(int) ($p['external_game_source'] ?? 0)] ?? null;
            $url = trim((string) ($p['url'] ?? ''));

            if ($game === null || $service === null || ! str_starts_with($url, 'http')) {
                return;
            }

            /* First one wins: a game listed twice on the same store is the same
               shop, and the unique key allows one row for it. */
            $out[$game][$service] ??= ['kind' => 'store', 'url' => $url];
        });

        return $out;
    }

    /**
     * @return array{0: array<int, array<string, array{kind: string, url: string}>>, 1: array<int, string>}
     */
    private function websites(array $ours): array
    {
        $types = [];

        foreach (DB::table('igdb_raw')->where('endpoint', 'website_types')->get() as $row) {
            $p = json_decode($row->payload, true) ?: [];

            if (! empty($p['type'])) {
                $types[(int) $p['id']] = (string) $p['type'];
            }
        }

        $links = [];
        $official = [];

        $this->scan('websites', function (array $p) use (&$links, &$official, $ours, $types) {
            $game = $ours[(int) ($p['game'] ?? 0)] ?? null;
            $type = $types[(int) ($p['type'] ?? 0)] ?? null;
            $url = trim((string) ($p['url'] ?? ''));

            if ($game === null || $type === null || ! str_starts_with($url, 'http')) {
                return;
            }

            if ($type === 'Official Website') {
                $official[$game] ??= Str::limit($url, 500, '');

                return;
            }

            if ($kind = self::SOCIAL[$type] ?? null) {
                $links[$game][$type] ??= ['kind' => $kind, 'url' => $url];
            }
        });

        return [$links, $official];
    }

    private function write(array $links): int
    {
        $existing = [];

        foreach (DB::table('game_links')->select('game_id', 'service')->get() as $row) {
            $existing[$row->game_id.'|'.$row->service] = true;
        }

        $batch = [];
        $written = 0;
        $size = max(1, (int) $this->option('chunk'));
        $bar = $this->output->createProgressBar(count($links));

        foreach ($links as $gameId => $services) {
            $bar->advance();

            foreach ($services as $service => $link) {
                if (isset($existing[$gameId.'|'.$service])) {
                    continue;
                }

                $batch[] = [
                    'game_id' => $gameId,
                    'kind' => $link['kind'],
                    'service' => $service,
                    'url' => Str::limit($link['url'], 700, ''),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                $written++;

                if (count($batch) >= $size) {
                    DB::table('game_links')->insertOrIgnore($batch);
                    $batch = [];
                }
            }
        }

        if ($batch !== []) {
            DB::table('game_links')->insertOrIgnore($batch);
        }

        $bar->finish();
        $this->newLine();

        return $written;
    }

    /** Fill-only: a site somebody put there by hand is not replaced. */
    private function officialSites(array $official): int
    {
        $filled = 0;

        foreach (array_chunk($official, 2000, true) as $chunk) {
            $blank = DB::table('games')
                ->whereIn('id', array_keys($chunk))
                ->where(function ($q) {
                    $q->whereNull('website')->orWhere('website', '');
                })
                ->pluck('id');

            foreach ($blank as $id) {
                DB::table('games')->where('id', $id)->update(['website' => $chunk[$id]]);
                $filled++;
            }
        }

        return $filled;
    }

    private function byService(array $links): void
    {
        $counts = [];

        foreach ($links as $services) {
            foreach ($services as $service => $link) {
                $counts[$service] = ($counts[$service] ?? 0) + 1;
            }
        }

        arsort($counts);

        $this->table(
            ['servis', 'igara'],
            array_map(fn ($s, $n) => [$s, number_format($n)], array_keys($counts), $counts),
        );
    }

    private function scan(string $endpoint, callable $each): void
    {
        DB::table('igdb_raw')
            ->where('endpoint', $endpoint)
            ->orderBy('igdb_id')
            ->chunk(20000, function ($rows) use ($each) {
                foreach ($rows as $row) {
                    $each(json_decode($row->payload, true) ?: []);
                }
            });
    }
}
