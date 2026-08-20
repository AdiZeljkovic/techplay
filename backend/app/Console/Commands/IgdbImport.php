<?php

namespace App\Console\Commands;

use App\Models\Game;
use App\Services\Igdb\IgdbFacts;
use App\Services\Releases\TitleNormalizer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Brings in the IGDB titles we do not have at all.
 *
 * Of their 372,828 entries, 314,252 are things a person would call a game —
 * main games, standalone expansions, remakes, remasters. The rest are DLC,
 * mods, packs, bundles, episodes, seasons, updates and ports, which are not
 * separate products and would each be a page saying the same thing as the page
 * beside it. Ports especially: the same game on another platform, not another
 * game.
 *
 * Three refusals shape the rest:
 *
 *   erotic          9,866 entries carry theme 42, and this catalogue was purged
 *                   of that deliberately in August.
 *   empty           30,457 have no cover, no date and no studio. A page with a
 *                   title on it is thin content at scale, not SEO.
 *   already ours    matched by IGDB id where the merge recorded one, otherwise
 *                   by normalised title and year — the same rule the merge uses,
 *                   run backwards.
 *
 * Two things it must not do, both of which are quiet rather than loud:
 *
 *   match_key stays NULL. A non-null match_key means "the release aggregator
 *   owns this row" — GameMerger::candidates, Notability::rescore and
 *   StoreSync's adoption query all key off it. Writing it on 185,000 imported
 *   rows would drag the whole import into passes built for a few thousand
 *   store listings. IGDB's keys live in `igdb_game_keys`, which is why that
 *   table exists.
 *
 *   game_tombstones is checked. There are 60,981 of them and nothing in the
 *   aggregator looks at them, so an import that ignored them would quietly
 *   resurrect every adult and clutter title the purges removed.
 */
class IgdbImport extends Command
{
    protected $signature = 'igdb:import
                            {--limit=0 : Stop after creating this many (0 = no cap)}
                            {--chunk=2000 : Rows built and inserted at a time}
                            {--apply : Actually write. Without it nothing is saved}';

    protected $description = 'Uvozi IGDB naslove kojih nemamo (bez --apply samo pregleda)';

    /** Main game, standalone expansion, remake, remaster. */
    private const TYPES = [0, 4, 8, 9];

    /** Their theme id for erotic content. */
    private const EROTIC = 42;

    /**
     * Every column an imported row writes, with the value it takes when IGDB
     * has nothing for it.
     *
     * Fixed on purpose. A bulk insert builds one VALUES list per row and
     * Postgres requires them all to be the same length, so a game without a
     * score cannot simply leave `rating` out — the whole batch fails on the
     * first row that differs. Columns absent from this list keep their table
     * defaults, which is fine because every row omits them equally.
     */
    private const COLUMNS = [
        'name' => null,
        'slug' => null,
        'description' => null,
        'cover_url' => null,
        'released' => null,
        'release_precision' => 'day',
        'rating' => null,
        'ratings_count' => 0,
        'website' => null,
        'series_key' => null,
        'series_name' => null,
        'genres' => '{}',
        'platforms' => '{}',
        'tags' => '{}',
        'developers' => '{}',
        'publishers' => '{}',
        'videos' => null,
        'alt_titles' => null,
    ];

    public function handle(IgdbFacts $facts, TitleNormalizer $normalizer): int
    {
        if (! DB::table('igdb_game_keys')->exists()) {
            $this->error('igdb_game_keys je prazna — pokreni prvo igdb:index.');

            return self::FAILURE;
        }

        $apply = (bool) $this->option('apply');
        $cap = max(0, (int) $this->option('limit'));

        $this->line('  Gradim zastite (slugovi, tombstones, nasi naslovi)…');
        $guards = $this->guards($normalizer);

        $this->line('  Biram sta ulazi…');
        $chosen = $this->choose($guards, $normalizer, $cap);

        if ($chosen['ids'] === []) {
            $this->warn('  Nema nijednog naslova za uvoz.');
            $this->reasons($chosen['skipped']);

            return self::SUCCESS;
        }

        $this->line(sprintf('  Ucitavam podatke za %s naslova…', number_format(count($chosen['ids']))));
        $facts->load($chosen['ids'], withGames: false);

        $lookups = $this->lookups();
        $created = $this->build($chosen['ids'], $facts, $lookups, $guards['slugs'], $apply);

        $this->newLine();
        $this->line(sprintf('  %s %s naslova.', $apply ? 'Uvezeno:' : 'Bilo bi uvezeno:', number_format($created)));
        $this->reasons($chosen['skipped']);

        if (! $apply) {
            $this->newLine();
            $this->warn('  Nista nije upisano. Dodaj --apply da se uvoz sacuva.');
        }

        return self::SUCCESS;
    }

    /**
     * Everything the choosing needs to say no with, built once.
     *
     * Held in memory on purpose: the alternative is a SELECT per candidate
     * across 314,252 of them, and these three sets together are a few hundred
     * thousand short strings.
     */
    private function guards(TitleNormalizer $normalizer): array
    {
        /* Two sets, and the difference between them matters. A slug an existing
           game holds is not a reason to refuse anything — Alien (1982) and Alien
           (2023) are different games and the second one takes `alien-2`. A
           tombstoned slug is a refusal: it is a page we removed on purpose and
           answer 410 for, and taking the name back would undo that silently. */
        $slugs = [];
        foreach (DB::table('games')->pluck('slug') as $slug) {
            $slugs[$slug] = true;
        }

        $tombstones = [];
        foreach (DB::table('game_tombstones')->pluck('slug') as $slug) {
            $tombstones[$slug] = true;
            $slugs[$slug] = true;
        }

        $linked = [];
        foreach (DB::table('game_external_ids')->where('provider', 'igdb')->pluck('external_id') as $id) {
            $linked[(int) $id] = true;
        }

        /* Our catalogue by normalised title, each title carrying the years we
           hold it in. `false` marks a title we hold with no year at all, which
           makes every one of theirs by that name unsafe to add. */
        $ours = [];
        DB::table('games')->select('name', 'released')->orderBy('id')->chunk(5000, function ($rows) use (&$ours, $normalizer) {
            foreach ($rows as $row) {
                $key = $normalizer->key((string) $row->name);

                if ($key === '') {
                    continue;
                }

                $year = $row->released ? (int) date('Y', strtotime((string) $row->released)) : null;

                if ($year === null) {
                    $ours[$key]['any'] = true;
                } else {
                    $ours[$key][$year] = true;
                }
            }
        });

        return ['slugs' => $slugs, 'tombstones' => $tombstones, 'linked' => $linked, 'ours' => $ours];
    }

    /**
     * Walks their catalogue once and decides, counting every refusal by reason.
     *
     * @return array{ids: array<int>, skipped: array<string, int>}
     */
    private function choose(array $guards, TitleNormalizer $normalizer, int $cap): array
    {
        $ids = [];
        $skipped = [];
        $bar = $this->output->createProgressBar(DB::table('igdb_raw')->where('endpoint', 'games')->count());

        DB::table('igdb_raw')
            ->where('endpoint', 'games')
            ->orderBy('igdb_id')
            ->chunk(5000, function ($rows) use (&$ids, &$skipped, $guards, $normalizer, $cap, $bar) {
                foreach ($rows as $row) {
                    $bar->advance();
                    $p = json_decode($row->payload, true) ?: [];
                    $reason = $this->refuse($p, $guards, $normalizer);

                    if ($reason !== null) {
                        $skipped[$reason] = ($skipped[$reason] ?? 0) + 1;

                        continue;
                    }

                    $ids[] = (int) $p['id'];
                }

                return ! ($cap > 0 && count($ids) >= $cap);
            });

        $bar->finish();
        $this->newLine();

        if ($cap > 0) {
            $ids = array_slice($ids, 0, $cap);
        }

        return ['ids' => $ids, 'skipped' => $skipped];
    }

    /** Why this one does not come in, or null if it does. */
    private function refuse(array $p, array $guards, TitleNormalizer $normalizer): ?string
    {
        if (! in_array((int) ($p['game_type'] ?? -1), self::TYPES, true)) {
            return 'nije samostalna igra (DLC, mod, port, paket…)';
        }

        if (in_array(self::EROTIC, (array) ($p['themes'] ?? []), true)) {
            return 'eroticna tema';
        }

        $name = trim((string) ($p['name'] ?? ''));

        if ($name === '') {
            return 'bez naziva';
        }

        if (! isset($p['cover']) && ! isset($p['first_release_date']) && ! isset($p['involved_companies'])) {
            return 'bez omota, datuma i studija';
        }

        if (isset($guards['linked'][(int) $p['id']])) {
            return 'vec spojena s nasom igrom';
        }

        $key = $normalizer->key($name);

        if ($key !== '' && isset($guards['ours'][$key])) {
            $held = $guards['ours'][$key];
            $year = isset($p['first_release_date']) ? (int) gmdate('Y', (int) $p['first_release_date']) : null;

            /* A title we hold without a year cannot be told apart from theirs,
               so none of theirs by that name is safe. */
            if (isset($held['any'])) {
                return 'isti naziv, nasa igra bez godine';
            }

            if ($year !== null && isset($held[$year])) {
                return 'vec imamo taj naziv i godinu';
            }
        }

        if (isset($guards['tombstones'][Str::slug($name)])) {
            return 'tombstone — obrisana namjerno';
        }

        return null;
    }

    /** Their id-keyed lookup tables, small enough to hold whole. */
    private function lookups(): array
    {
        $out = [];

        foreach (['genres', 'platforms', 'themes'] as $endpoint) {
            $out[$endpoint] = [];

            foreach (DB::table('igdb_raw')->where('endpoint', $endpoint)->get() as $row) {
                $p = json_decode($row->payload, true) ?: [];

                if (! empty($p['name'])) {
                    $out[$endpoint][(int) $p['id']] = (string) $p['name'];
                }
            }
        }

        return $out;
    }

    /** Builds and writes the rows, in chunks, re-reading payloads by id. */
    private function build(array $ids, IgdbFacts $facts, array $lookups, array &$slugs, bool $apply): int
    {
        $created = 0;
        $bar = $this->output->createProgressBar(count($ids));

        foreach (array_chunk($ids, max(1, (int) $this->option('chunk'))) as $batch) {
            $payloads = [];

            foreach (DB::table('igdb_raw')->where('endpoint', 'games')->whereIn('igdb_id', $batch)->get() as $row) {
                $p = json_decode($row->payload, true) ?: [];
                $payloads[(int) $p['id']] = $p;
            }

            $rows = [];
            $links = [];

            foreach ($batch as $igdbId) {
                if (! isset($payloads[$igdbId])) {
                    continue;
                }

                $row = $this->row($payloads[$igdbId], $facts, $lookups, $slugs);
                $rows[] = $row;
                $links[$row['slug']] = $igdbId;
                $created++;
                $bar->advance();
            }

            if ($apply && $rows !== []) {
                DB::transaction(function () use ($rows, $links) {
                    DB::table('games')->insert($rows);

                    $ids = DB::table('games')->whereIn('slug', array_keys($links))->pluck('id', 'slug');
                    $external = [];

                    foreach ($links as $slug => $igdbId) {
                        if ($gameId = $ids[$slug] ?? null) {
                            $external[] = [
                                'game_id' => $gameId,
                                'provider' => 'igdb',
                                'external_id' => (string) $igdbId,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                        }
                    }

                    if ($external !== []) {
                        DB::table('game_external_ids')->insert($external);
                    }
                });
            }
        }

        $bar->finish();

        return $created;
    }

    /**
     * One database-ready row.
     *
     * Built through a Game model rather than by hand so the casts do the
     * serialising — `genres` and friends are real TEXT[] and their literal
     * format lives in PostgresArray, which is the only place it should.
     */
    private function row(array $p, IgdbFacts $facts, array $lookups, array &$slugs): array
    {
        $name = trim((string) $p['name']);
        $slug = $this->freeSlug($name, $slugs);

        $attributes = $facts->forGame((int) $p['id'], $p) + [
            'name' => $name,
            'slug' => $slug,
            'genres' => $this->names($p['genres'] ?? [], $lookups['genres']),
            'platforms' => $this->names($p['platforms'] ?? [], $lookups['platforms']),
            'tags' => $this->names($p['themes'] ?? [], $lookups['themes']),
            'website' => null,
        ];

        /* Their 0-100 against our decimal(3,2), which stops at 9.99 — a perfect
           score written straight across overflows the column. */
        if (isset($p['total_rating'])) {
            $attributes['rating'] = min(9.99, round(((float) $p['total_rating']) / 10, 2));
            $attributes['ratings_count'] = (int) ($p['total_rating_count'] ?? 0);
        }

        /* The convention the catalogue already follows: a date IGDB knows only
           to the year lands on 1 January, and saying "day" about it is a lie the
           calendar would repeat. */
        $released = $attributes['released'] ?? null;
        $attributes['release_precision'] = ($released && str_ends_with($released, '-01-01')) ? 'year' : 'day';

        $model = new Game;
        $model->forceFill($attributes);
        $written = $model->getAttributes();

        $row = [];
        foreach (self::COLUMNS as $column => $default) {
            $row[$column] = $written[$column] ?? $default;
        }

        $row['created_at'] = $row['updated_at'] = now();

        return $row;
    }

    /** Str::slug plus the aggregator's -2, -3 walk, done against a set in memory. */
    private function freeSlug(string $name, array &$slugs): string
    {
        $base = Str::slug($name) ?: 'game';
        $slug = $base;
        $n = 2;

        while (isset($slugs[$slug])) {
            $slug = $base.'-'.$n++;
        }

        $slugs[$slug] = true;

        return $slug;
    }

    /** @return array<string> */
    private function names(array $ids, array $lookup): array
    {
        $out = [];

        foreach ($ids as $id) {
            if ($name = $lookup[(int) $id] ?? null) {
                $out[] = $name;
            }
        }

        return $out;
    }

    private function reasons(array $skipped): void
    {
        if ($skipped === []) {
            return;
        }

        arsort($skipped);
        $this->newLine();
        $this->table(
            ['preskoceno jer', 'broj'],
            array_map(fn ($reason, $n) => [$reason, number_format($n)], array_keys($skipped), $skipped),
        );
    }
}
