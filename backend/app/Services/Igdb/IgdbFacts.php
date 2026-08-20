<?php

namespace App\Services\Igdb;

use Illuminate\Support\Facades\DB;

/**
 * Turns the staged IGDB rows for a set of games into the fields our `games`
 * table actually has.
 *
 * Loaded in bulk on purpose. IGDB's model is relational — a game holds the *ids*
 * of its cover, its videos, its companies — so assembling one game means five
 * lookups, and assembling 142,110 of them one at a time means seven hundred
 * thousand queries. Everything a batch needs is fetched once, keyed by game.
 *
 * What it deliberately does not produce:
 *
 *   age ratings   their row carries `organization: 1, rating_category: 6` and
 *                 nothing else. Turning that into "PEGI 12" needs two lookup
 *                 endpoints that have not been pulled, and writing the numbers
 *                 in the meantime would be worse than leaving the field empty.
 *   website       the game holds website ids; the URLs live in an endpoint
 *                 that is still downloading.
 *   screenshots   same, and it is the largest table they have.
 */
class IgdbFacts
{
    /** Their image CDN, at the size we want rather than the thumbnail they return. */
    private const IMAGE = 'https://images.igdb.com/igdb/image/upload/t_%s/%s.jpg';

    private array $covers = [];

    private array $videos = [];

    private array $companies = [];

    private array $altNames = [];

    private array $collections = [];

    private array $games = [];

    /**
     * @param  array<int>  $igdbIds  the games this batch will merge
     * @param  bool  $withGames  false when the caller already holds the game
     *                           payloads and will pass them to forGame() — an
     *                           import walking 185,000 of them has them in hand
     *                           and does not need a second copy here.
     */
    public function load(array $igdbIds, bool $withGames = true): void
    {
        /* Cleared first, not merged into. A run works through the catalogue in
           chunks and calls this once per chunk; companies and collections are
           built by appending, so without this the last chunk would carry every
           earlier one's studios around with it. */
        $this->games = $this->covers = $this->videos = [];
        $this->companies = $this->altNames = $this->collections = [];

        if ($igdbIds === []) {
            return;
        }

        if ($withGames) {
            $this->games = $this->payloads('games', $igdbIds, fn ($p) => $p['id']);
        }

        /* Covers, videos and alternative names are keyed by the game they belong
           to, so they are fetched by that rather than by their own id. */
        $this->covers = $this->byGame('covers', $igdbIds, fn ($p) => $p['image_id'] ?? null);

        /* A watchable URL, not their id. `videos` is read straight out of the
           column by the game page, which runs a YouTube regex over each entry —
           anything that is not a string crashes it. */
        $this->videos = $this->byGame('game_videos', $igdbIds, fn ($p) => isset($p['video_id'])
            ? 'https://www.youtube.com/watch?v='.$p['video_id']
            : null, true);

        /* Same story: the column holds {title, description} objects and the page
           reads `.title` off each one. 209,962 of their 212,482 rows carry a
           comment — "Japanese title", "Abbreviation" — which is exactly the
           description the panel already prints under the name. */
        $this->altNames = $this->byGame('alternative_names', $igdbIds, fn ($p) => isset($p['name'])
            ? ['title' => (string) $p['name'], 'description' => trim((string) ($p['comment'] ?? '')) ?: null]
            : null, true);

        $this->loadCompanies($igdbIds);
        $this->loadCollections($igdbIds);
    }

    /**
     * Everything we could write for one game, with our column names.
     *
     * @return array<string, mixed>
     */
    public function forGame(int $igdbId, ?array $payload = null): array
    {
        $game = $payload ?? $this->games[$igdbId] ?? [];
        $out = [];

        if ($summary = trim((string) ($game['summary'] ?? ''))) {
            $out['description'] = $summary;
        }

        if ($image = $this->covers[$igdbId] ?? null) {
            /* t_cover_big is 264×374 — the size a card actually renders. */
            $out['cover_url'] = sprintf(self::IMAGE, 'cover_big', $image);
        }

        if ($videos = $this->videos[$igdbId] ?? []) {
            $out['videos'] = array_values(array_slice(array_unique($videos), 0, 12));
        }

        foreach (['developers', 'publishers'] as $role) {
            if ($names = $this->companies[$igdbId][$role] ?? []) {
                $out[$role] = array_values(array_unique($names));
            }
        }

        if ($alt = $this->altNames[$igdbId] ?? []) {
            $seen = [];
            $titles = [];

            foreach ($alt as $entry) {
                if (! isset($seen[$entry['title']])) {
                    $seen[$entry['title']] = true;
                    $titles[] = $entry;
                }
            }

            $out['alt_titles'] = array_slice($titles, 0, 20);
        }

        if ($series = $this->collections[$igdbId] ?? null) {
            /* series_key is an integer column — it held the Moby group id before
               the rebuild renamed it. Their collection id goes in as it is; the
               slug is theirs to route by, not ours. */
            $out['series_key'] = $series['id'];
            $out['series_name'] = $series['name'];
        }

        if ($stamp = $game['first_release_date'] ?? null) {
            $out['released'] = gmdate('Y-m-d', (int) $stamp);
        }

        return $out;
    }

    /** @return array<int, mixed> keyed by igdb id of the row itself */
    private function payloads(string $endpoint, array $ids, callable $key): array
    {
        $out = [];

        DB::table('igdb_raw')
            ->where('endpoint', $endpoint)
            ->whereIn('igdb_id', $ids)
            ->orderBy('igdb_id')
            ->chunk(2000, function ($rows) use (&$out, $key) {
                foreach ($rows as $row) {
                    $payload = json_decode($row->payload, true) ?: [];
                    $out[$key($payload)] = $payload;
                }
            });

        return $out;
    }

    /** @return array<int, mixed> keyed by the game the row points at */
    private function byGame(string $endpoint, array $gameIds, callable $value, bool $many = false): array
    {
        $wanted = array_flip($gameIds);
        $out = [];

        DB::table('igdb_raw')
            ->where('endpoint', $endpoint)
            ->orderBy('igdb_id')
            ->chunk(5000, function ($rows) use (&$out, $wanted, $value, $many) {
                foreach ($rows as $row) {
                    $payload = json_decode($row->payload, true) ?: [];
                    $game = (int) ($payload['game'] ?? 0);

                    if (! isset($wanted[$game])) {
                        continue;
                    }

                    $v = $value($payload);

                    if ($v === null || $v === '') {
                        continue;
                    }

                    if ($many) {
                        $out[$game][] = $v;
                    } else {
                        $out[$game] ??= $v;
                    }
                }
            });

        return $out;
    }

    /** Who made it and who put it out, resolved through their two tables. */
    private function loadCompanies(array $gameIds): void
    {
        $wanted = array_flip($gameIds);
        $links = [];
        $companyIds = [];

        DB::table('igdb_raw')
            ->where('endpoint', 'involved_companies')
            ->orderBy('igdb_id')
            ->chunk(5000, function ($rows) use (&$links, &$companyIds, $wanted) {
                foreach ($rows as $row) {
                    $p = json_decode($row->payload, true) ?: [];
                    $game = (int) ($p['game'] ?? 0);

                    if (! isset($wanted[$game]) || empty($p['company'])) {
                        continue;
                    }

                    /* Porting and supporting studios are real credits, but they
                       are not who the game is by — those two columns answer
                       "whose game is this", so only the two roles that do. */
                    foreach (['developer' => 'developers', 'publisher' => 'publishers'] as $flag => $column) {
                        if (! empty($p[$flag])) {
                            $links[$game][$column][] = (int) $p['company'];
                            $companyIds[(int) $p['company']] = true;
                        }
                    }
                }
            });

        if ($companyIds === []) {
            return;
        }

        $names = [];
        DB::table('igdb_raw')
            ->where('endpoint', 'companies')
            ->whereIn('igdb_id', array_keys($companyIds))
            ->orderBy('igdb_id')
            ->chunk(2000, function ($rows) use (&$names) {
                foreach ($rows as $row) {
                    $p = json_decode($row->payload, true) ?: [];

                    if (! empty($p['name'])) {
                        $names[(int) $p['id']] = (string) $p['name'];
                    }
                }
            });

        foreach ($links as $game => $roles) {
            foreach ($roles as $column => $ids) {
                $this->companies[$game][$column] = array_values(array_filter(
                    array_map(fn ($id) => $names[$id] ?? null, $ids)
                ));
            }
        }
    }

    /**
     * The series a game belongs to.
     *
     * Read from the collections themselves, which list their games, rather than
     * from `collection_memberships` — one table instead of two, and it is the
     * one that carries the name we want to write.
     */
    private function loadCollections(array $gameIds): void
    {
        $wanted = array_flip($gameIds);

        DB::table('igdb_raw')
            ->where('endpoint', 'collections')
            ->orderBy('igdb_id')
            ->chunk(2000, function ($rows) use ($wanted) {
                foreach ($rows as $row) {
                    $p = json_decode($row->payload, true) ?: [];
                    $name = trim((string) ($p['name'] ?? ''));
                    $id = (int) ($p['id'] ?? 0);

                    if ($name === '' || $id === 0) {
                        continue;
                    }

                    foreach ((array) ($p['games'] ?? []) as $game) {
                        if (isset($wanted[(int) $game])) {
                            /* A game can sit in several collections — Tears of
                               the Kingdom is in both "Zelda" and "Breath of the
                               Wild". First one wins; the alternative is a column
                               that holds two answers. */
                            $this->collections[(int) $game] ??= ['name' => $name, 'id' => $id];
                        }
                    }
                }
            });
    }
}
