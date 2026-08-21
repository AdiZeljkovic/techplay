<?php

namespace App\Console\Commands;

use App\Models\Game;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Fills the columns the rewritten game page is built on.
 *
 * Same rule as the merge: it fills, it does not replace. 90,920 of our games
 * already carry screenshots from the store aggregator, and those are the store's
 * own captioned pictures — better than IGDB's for a game that has them.
 *
 * Everything here is read once and held: a game's languages live in a table of
 * 567,500 rows keyed by game, its screenshots in one of 1,691,397, and asking
 * per game would be three hundred thousand queries against tables that do not
 * have an index for the question. One pass each, then the whole catalogue is
 * written from memory.
 *
 * What it deliberately leaves out: release dates by region. IGDB's `regions`
 * table has three rows and the release rows reference ids well past them, so
 * the field would be mostly "region 8" — a number pretending to be a place.
 */
class IgdbDetails extends Command
{
    protected $signature = 'igdb:details
                            {--chunk=2000 : Games written at a time}
                            {--apply : Actually write. Without it nothing is saved}';

    protected $description = 'Popunjava detalje igara iz IGDB-a (vrijeme prelaska, jezici, slike, oznake)';

    /** Their CDN, at the size each picture is actually shown. */
    private const IMAGE = 'https://images.igdb.com/igdb/image/upload/t_%s/%s.jpg';

    /** Fields this command owns. Empty ones get filled; full ones are left. */
    private const FIELDS = [
        'time_to_beat', 'game_modes', 'player_perspectives', 'multiplayer',
        'languages', 'artworks', 'similar_games', 'screenshots', 'age_ratings',
        'engines',
    ];

    public function handle(): int
    {
        $ours = $this->ourGames();

        if ($ours === []) {
            $this->error('Nijedna nasa igra nije spojena s IGDB-om — pokreni prvo igdb:merge.');

            return self::FAILURE;
        }

        $apply = (bool) $this->option('apply');

        $this->line('  Citam sifarnike…');
        $lookups = $this->lookups();

        $this->line('  Citam detalje (jednom po tabeli)…');
        $facts = [
            'time_to_beat' => $this->timeToBeat($ours),
            'multiplayer' => $this->multiplayer($ours),
            'languages' => $this->languages($ours, $lookups),
            'screenshots' => $this->pictures('screenshots', $ours, 'screenshot_huge', 'screenshot_med'),
            'artworks' => $this->pictures('artworks', $ours, '1080p', 'screenshot_med'),
        ];

        $this->line('  Citam igre (nacini igre, perspektive, slicne)…');
        $fromGame = $this->fromGamePayload($ours, $lookups);

        $filled = array_fill_keys(self::FIELDS, 0);
        $bar = $this->output->createProgressBar(count($ours));

        foreach (array_chunk($ours, max(1, (int) $this->option('chunk')), true) as $chunk) {
            $models = Game::whereIn('id', array_values($chunk))->get()->keyBy('id');

            foreach ($chunk as $igdbId => $gameId) {
                $bar->advance();
                $game = $models->get($gameId);

                if (! $game) {
                    continue;
                }

                $available = [];

                foreach ($facts as $field => $byGame) {
                    if (isset($byGame[$igdbId])) {
                        $available[$field] = $byGame[$igdbId];
                    }
                }

                foreach ($fromGame[$igdbId] ?? [] as $field => $value) {
                    $available[$field] = $value;
                }

                $updates = [];
                $locked = (array) ($game->locked_fields ?? []);

                foreach (self::FIELDS as $field) {
                    if (! isset($available[$field]) || in_array($field, $locked, true)) {
                        continue;
                    }

                    if (! $this->isEmpty($game->{$field})) {
                        continue;   // ours stays
                    }

                    $updates[$field] = $available[$field];
                    $filled[$field]++;
                }

                if ($updates !== [] && $apply) {
                    $game->forceFill($updates)->save();
                }
            }
        }

        $bar->finish();
        $this->newLine(2);

        $rows = [];
        foreach (self::FIELDS as $field) {
            if ($filled[$field] > 0) {
                $rows[] = [$field, number_format($filled[$field])];
            }
        }

        $this->table(['polje', $apply ? 'popunjeno' : 'bilo bi popunjeno'], $rows ?: [['—', '0']]);

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

    /** The small numbered tables that turn ids into words. */
    private function lookups(): array
    {
        $out = ['game_modes' => [], 'player_perspectives' => [], 'languages' => [], 'support_types' => [], 'organizations' => [], 'categories' => [], 'engines' => []];

        foreach ([
            'game_modes' => ['game_modes', 'name'],
            'player_perspectives' => ['player_perspectives', 'name'],
            'languages' => ['languages', 'name'],
            'support_types' => ['language_support_types', 'name'],
            'organizations' => ['age_rating_organizations', 'name'],
            'engines' => ['game_engines', 'name'],
        ] as $key => [$endpoint, $field]) {
            foreach (DB::table('igdb_raw')->where('endpoint', $endpoint)->get() as $row) {
                $p = json_decode($row->payload, true) ?: [];

                if (! empty($p[$field])) {
                    $out[$key][(int) $p['id']] = (string) $p[$field];
                }
            }
        }

        /* A rating category carries the label and which body issued it —
           "E10+" belongs to ESRB, "12" to PEGI, and the two mean different
           things. */
        foreach (DB::table('igdb_raw')->where('endpoint', 'age_rating_categories')->get() as $row) {
            $p = json_decode($row->payload, true) ?: [];

            if (! empty($p['rating'])) {
                $out['categories'][(int) $p['id']] = [
                    'rating' => (string) $p['rating'],
                    'organization' => (int) ($p['organization'] ?? 0),
                ];
            }
        }

        return $out;
    }

    /** @return array<int, array> keyed by their game id */
    private function timeToBeat(array $ours): array
    {
        $out = [];

        $this->scan('game_time_to_beats', function (array $p) use (&$out, $ours) {
            $game = (int) ($p['game_id'] ?? 0);

            if (! isset($ours[$game])) {
                return;
            }

            $hours = [];
            foreach (['hastily', 'normally', 'completely'] as $pace) {
                if (! empty($p[$pace])) {
                    $hours[$pace] = (int) $p[$pace];   // seconds, as they give them
                }
            }

            if ($hours !== []) {
                $out[$game] = $hours + ['count' => (int) ($p['count'] ?? 0)];
            }
        });

        return $out;
    }

    /** @return array<int, array> */
    private function multiplayer(array $ours): array
    {
        $flags = ['onlinecoop', 'offlinecoop', 'splitscreen', 'campaigncoop', 'dropin', 'lancoop'];
        $out = [];

        $this->scan('multiplayer_modes', function (array $p) use (&$out, $ours, $flags) {
            $game = (int) ($p['game'] ?? 0);

            if (! isset($ours[$game])) {
                return;
            }

            $mode = [];
            foreach ($flags as $flag) {
                if (! empty($p[$flag])) {
                    $mode[$flag] = true;
                }
            }

            foreach (['onlinemax', 'offlinemax'] as $count) {
                if (! empty($p[$count])) {
                    $mode[$count] = (int) $p[$count];
                }
            }

            /* A game has one of these rows per platform. Anything true on any
               platform is true of the game, which is the question a reader is
               asking when they look for split-screen. */
            if ($mode !== []) {
                $out[$game] = array_merge($out[$game] ?? [], $mode);
            }
        });

        return $out;
    }

    /** @return array<int, array> */
    private function languages(array $ours, array $lookups): array
    {
        $byGame = [];

        $this->scan('language_supports', function (array $p) use (&$byGame, $ours, $lookups) {
            $game = (int) ($p['game'] ?? 0);
            $language = $lookups['languages'][(int) ($p['language'] ?? 0)] ?? null;
            $support = $lookups['support_types'][(int) ($p['language_support_type'] ?? 0)] ?? null;

            if (! isset($ours[$game]) || $language === null || $support === null) {
                return;
            }

            $byGame[$game][$language][strtolower($support)] = true;
        });

        $out = [];

        foreach ($byGame as $game => $languages) {
            ksort($languages);
            $rows = [];

            foreach ($languages as $name => $support) {
                $rows[] = [
                    'name' => $name,
                    'audio' => (bool) ($support['audio'] ?? false),
                    'subtitles' => (bool) ($support['subtitles'] ?? false),
                    'interface' => (bool) ($support['interface'] ?? false),
                ];
            }

            $out[$game] = $rows;
        }

        return $out;
    }

    /**
     * Screenshots and key art, in the shape the game page already reads.
     *
     * @return array<int, array>
     */
    private function pictures(string $endpoint, array $ours, string $full, string $thumb): array
    {
        $out = [];

        $this->scan($endpoint, function (array $p) use (&$out, $ours, $full, $thumb) {
            $game = (int) ($p['game'] ?? 0);
            $image = $p['image_id'] ?? null;

            if (! isset($ours[$game]) || ! $image || count($out[$game] ?? []) >= 24) {
                return;
            }

            $out[$game][] = [
                'image' => sprintf(self::IMAGE, $full, $image),
                'thumbnail_image' => sprintf(self::IMAGE, $thumb, $image),
                'width' => (int) ($p['width'] ?? 0),
                'height' => (int) ($p['height'] ?? 0),
            ];
        });

        return $out;
    }

    /**
     * What the game row itself carries: modes, perspectives, age ratings and
     * the games IGDB thinks are like it.
     *
     * @return array<int, array>
     */
    private function fromGamePayload(array $ours, array $lookups): array
    {
        /* Age ratings are their own endpoint, keyed by their own id, and the
           game points at them — so they are read first and looked up here. */
        $ratings = [];
        $this->scan('age_ratings', function (array $p) use (&$ratings, $lookups) {
            $category = $lookups['categories'][(int) ($p['rating_category'] ?? 0)] ?? null;

            if ($category === null) {
                return;
            }

            $organization = $lookups['organizations'][$category['organization']]
                ?? $lookups['organizations'][(int) ($p['organization'] ?? 0)]
                ?? null;

            if ($organization === null) {
                return;
            }

            /* "ESRB Rating", not "ESRB": GameController picks the ESRB entry out
               by that exact string, and the 8,391 ratings already in the table
               are spelled that way. */
            $ratings[(int) $p['id']] = [
                'rating_name' => $category['rating'],
                'rating_system_name' => $organization.' Rating',
            ];
        });

        $out = [];

        $this->scan('games', function (array $p) use (&$out, $ours, $lookups, $ratings) {
            $game = (int) ($p['id'] ?? 0);

            if (! isset($ours[$game])) {
                return;
            }

            $row = [];

            /* Their field name on the left, our column on the right. The two
               agree for modes and perspectives and do not for engines, which
               is exactly why the mapping is spelled out rather than assumed. */
            foreach ([
                'game_modes' => 'game_modes',
                'player_perspectives' => 'player_perspectives',
                'game_engines' => 'engines',
            ] as $theirs => $column) {
                $names = [];

                foreach ((array) ($p[$theirs] ?? []) as $id) {
                    if ($name = $lookups[$column][(int) $id] ?? null) {
                        $names[] = $name;
                    }
                }

                if ($names !== []) {
                    $row[$column] = array_values(array_unique($names));
                }
            }

            $rated = [];
            foreach ((array) ($p['age_ratings'] ?? []) as $id) {
                if ($rating = $ratings[(int) $id] ?? null) {
                    $rated[] = $rating;
                }
            }

            if ($rated !== []) {
                $row['age_ratings'] = $rated;
            }

            /* Kept as their ids for now; resolved to our slugs below, once the
               whole set is known. */
            if (! empty($p['similar_games'])) {
                $row['_similar'] = array_slice((array) $p['similar_games'], 0, 12);
            }

            if ($row !== []) {
                $out[$game] = $row;
            }
        });

        return $this->resolveSimilar($out, $ours);
    }

    /**
     * Their ids into our pages.
     *
     * A similar game we do not carry is dropped rather than linked — an IGDB id
     * on this site is a link nobody can follow.
     */
    private function resolveSimilar(array $rows, array $ours): array
    {
        $wanted = [];

        foreach ($rows as $row) {
            foreach ($row['_similar'] ?? [] as $id) {
                $wanted[(int) $id] = true;
            }
        }

        $pages = [];

        if ($wanted !== []) {
            $ids = array_values(array_intersect_key($ours, $wanted));

            foreach (array_chunk($ids, 5000) as $chunk) {
                foreach (DB::table('games')->whereIn('id', $chunk)->get(['id', 'name', 'slug']) as $game) {
                    $pages[(int) $game->id] = ['name' => $game->name, 'slug' => $game->slug];
                }
            }
        }

        foreach ($rows as $game => $row) {
            $similar = [];

            foreach ($row['_similar'] ?? [] as $id) {
                $ourId = $ours[(int) $id] ?? null;

                if ($ourId !== null && isset($pages[$ourId])) {
                    $similar[] = $pages[$ourId];
                }
            }

            unset($rows[$game]['_similar']);

            if ($similar !== []) {
                $rows[$game]['similar_games'] = $similar;
            }
        }

        return $rows;
    }

    /** One pass over an endpoint, decoding each row once. */
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

    /** Empty enough to fill — `{}` and `[]` mean nothing here as surely as null. */
    private function isEmpty(mixed $value): bool
    {
        if ($value === null || $value === '' || $value === '{}' || $value === '[]') {
            return true;
        }

        return is_array($value) && $value === [];
    }
}
