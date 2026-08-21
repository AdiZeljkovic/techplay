<?php

namespace App\Console\Commands;

use App\Services\Igdb\IgdbClient;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Downloads IGDB into `igdb_raw`, and nothing else.
 *
 * Deliberately nothing else. This is the first half of a two-part job: get the
 * data down once, correctly, so that the merge into `games` can be written and
 * rewritten against a local copy instead of against their rate limit. Nothing
 * this command does touches `games`, and it can be run again at any point — the
 * upsert keys on (endpoint, igdb_id), so a second run refreshes rather than
 * duplicates.
 *
 * It is resumable because it will be interrupted: about 5.7 million rows at four
 * requests a second is an hour of uninterrupted network on a good day, and there
 * are no good days. Each endpoint remembers the highest id it wrote, so a
 * restart carries on from there rather than from the top.
 */
class IgdbPull extends Command
{
    protected $signature = 'igdb:pull
                            {--endpoint=* : Only these endpoints, otherwise all of them}
                            {--fresh : Start each endpoint from the beginning rather than resuming}
                            {--limit=0 : Stop after roughly this many rows per endpoint — for a trial run}';

    protected $description = 'Povlaci IGDB bazu u igdb_raw (ne dira tabelu games)';

    /**
     * What to pull, in the order that makes a half-finished pull most useful.
     *
     * Games first: with only that table down, the merge can already be tried.
     * The lookups after it are tiny and make the games readable. The three big
     * ones — screenshots, websites, external ids — come last because they are
     * four fifths of the rows and none of the earlier work waits on them.
     */
    private const ENDPOINTS = [
        'games',
        'companies',
        'involved_companies',

        /* A company row carries the id of its logo and the ids of its sites,
           not the values. Without these two the studio pages have a name and
           nothing to look at — 17,902 logos and 19,065 sites, both small. */
        'company_logos',
        'company_websites',
        'covers',
        'game_videos',
        'age_ratings',

        /* An age rating row is `organization: 1, rating_category: 6` and
           nothing else. These two say that means PEGI 12 — without them the
           field is a pair of numbers and stays out of the merge entirely. */
        'age_rating_organizations',
        'age_rating_categories',

        'alternative_names',
        'genres',
        'themes',
        'game_modes',
        'player_perspectives',
        'platforms',
        'franchises',
        'collections',
        'collection_memberships',
        'game_engines',
        'multiplayer_modes',
        'game_time_to_beats',
        'languages',
        /* Audio, subtitles or interface — a language row carries only the id. */
        'language_support_types',
        'language_supports',
        /* Which part of the world a release date belongs to. */
        'regions',
        'artworks',
        'release_dates',
        /* The primitives are numbered, not named — `popularity_type: 5` on its
           own says nothing. This is the twenty-row table that says which number
           is Steam's peak players and which is IGDB's want-to-play. */
        'popularity_types',
        'popularity_primitives',

        /* Three more numbered-to-named tables. Without them a game's status is
           "8", a website is "type 2" and a store link is "source 14". */
        'game_statuses',
        'website_types',
        'external_game_sources',
        'screenshots',
        'websites',
        'external_games',
    ];

    public function handle(IgdbClient $igdb): int
    {
        if (! $igdb->configured()) {
            $this->error('IGDB_CLIENT_ID i IGDB_CLIENT_SECRET nisu postavljeni u .env.');

            return self::FAILURE;
        }

        $only = (array) $this->option('endpoint');
        $endpoints = $only ? array_values(array_intersect(self::ENDPOINTS, $only)) : self::ENDPOINTS;

        if ($endpoints === []) {
            $this->error('Nijedan poznat endpoint nije naveden.');

            return self::FAILURE;
        }

        $cap = (int) $this->option('limit');

        foreach ($endpoints as $endpoint) {
            try {
                $this->pull($igdb, $endpoint, $cap);
            } catch (Throwable $e) {
                /*
                 * One endpoint failing is not the run failing. The rest are
                 * independent, and whatever this one managed is kept — the next
                 * run resumes from it.
                 */
                $this->newLine();
                $this->error("  {$endpoint}: {$e->getMessage()}");
            }
        }

        $this->newLine();
        $this->info('Ukupno u igdb_raw: '.number_format(DB::table('igdb_raw')->count()).' zapisa.');

        return self::SUCCESS;
    }

    private function pull(IgdbClient $igdb, string $endpoint, int $cap): void
    {
        $after = 0;

        if (! $this->option('fresh')) {
            $after = (int) DB::table('igdb_raw')->where('endpoint', $endpoint)->max('igdb_id');
        }

        $total = $igdb->count($endpoint);
        $have = (int) DB::table('igdb_raw')->where('endpoint', $endpoint)->count();

        if ($total > 0 && $have >= $total && ! $this->option('fresh')) {
            $this->line(sprintf('  %-24s %s — vec kompletno', $endpoint, number_format($total)));

            return;
        }

        $this->line(sprintf(
            '  %-24s %s zapisa%s',
            $endpoint,
            number_format($total),
            $after ? ' — nastavljam od id '.number_format($after) : ''
        ));

        $bar = $this->output->createProgressBar(max(1, $total - $have));
        $bar->start();

        $written = 0;
        foreach ($igdb->each($endpoint, $after) as $page) {
            $rows = [];
            $now = now();

            foreach ($page as $row) {
                if (! isset($row['id'])) {
                    continue;
                }

                $rows[] = [
                    'endpoint' => $endpoint,
                    'igdb_id' => (int) $row['id'],
                    'payload' => json_encode($row, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    'fetched_at' => $now,
                ];
            }

            if ($rows !== []) {
                DB::table('igdb_raw')->upsert($rows, ['endpoint', 'igdb_id'], ['payload', 'fetched_at']);
                $written += count($rows);
                $bar->advance(count($rows));
            }

            if ($cap > 0 && $written >= $cap) {
                break;
            }
        }

        $bar->finish();
        $this->newLine();
    }
}
