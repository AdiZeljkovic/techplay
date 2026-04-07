<?php

namespace App\Services;

use App\Models\Game;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class IgdbService
{
    private const BASE_URL  = 'https://api.igdb.com/v4';
    private const TOKEN_URL = 'https://id.twitch.tv/oauth2/token';

    private string $clientId;
    private string $clientSecret;

    public function __construct()
    {
        $this->clientId     = config('services.igdb.client_id', '');
        $this->clientSecret = config('services.igdb.client_secret', '');
    }

    // -------------------------------------------------------------------------
    // Auth
    // -------------------------------------------------------------------------

    public function getToken(): string
    {
        return Cache::remember('igdb.access_token', 3600 * 24 * 50, function () {
            $response = Http::post(self::TOKEN_URL, [
                'client_id'     => $this->clientId,
                'client_secret' => $this->clientSecret,
                'grant_type'    => 'client_credentials',
            ]);

            if (! $response->successful()) {
                throw new \RuntimeException('Failed to get IGDB token: ' . $response->body());
            }

            return $response->json('access_token');
        });
    }

    private function headers(): array
    {
        return [
            'Client-ID'     => $this->clientId,
            'Authorization' => 'Bearer ' . $this->getToken(),
        ];
    }

    // -------------------------------------------------------------------------
    // HTTP helper — auto-retries once on 401 (expired token)
    // -------------------------------------------------------------------------

    private function post(string $endpoint, string $body): ?array
    {
        try {
            $response = Http::withHeaders($this->headers())
                ->withBody($body, 'text/plain')
                ->timeout(30)
                ->post(self::BASE_URL . $endpoint);

            if ($response->status() === 401) {
                Cache::forget('igdb.access_token');
                $response = Http::withHeaders($this->headers())
                    ->withBody($body, 'text/plain')
                    ->timeout(30)
                    ->post(self::BASE_URL . $endpoint);
            }

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('IGDB API error', [
                'endpoint' => $endpoint,
                'status'   => $response->status(),
                'body'     => $response->body(),
            ]);
        } catch (\Exception $e) {
            Log::error('IGDB API exception: ' . $e->getMessage());
        }

        return null;
    }

    // -------------------------------------------------------------------------
    // Total game count (used by crawl command to calculate batch count)
    // -------------------------------------------------------------------------

    public function getTotalCount(): int
    {
        $result = $this->post('/games/count', 'where version_parent = null;');
        return $result['count'] ?? 0;
    }

    // -------------------------------------------------------------------------
    // Crawl batch — discover + full details in a single API call (500 games)
    // -------------------------------------------------------------------------

    public function crawlBatch(int $offset): int
    {
        $body = <<<QUERY
fields id,name,slug,first_release_date,
  rating,rating_count,aggregated_rating,aggregated_rating_count,
  cover.url,
  summary,storyline,status,
  genres.name,genres.slug,
  platforms.name,platforms.abbreviation,
  keywords.name,keywords.slug,
  game_modes.name,
  themes.name,
  involved_companies.company.name,involved_companies.developer,involved_companies.publisher,
  websites.url,websites.category,
  age_ratings.category,age_ratings.rating,
  screenshots.url,screenshots.width,screenshots.height,
  videos.video_id,videos.name,
  similar_games.name,similar_games.slug,similar_games.cover.url,similar_games.first_release_date,similar_games.aggregated_rating,similar_games.rating,
  dlcs.name,dlcs.slug,dlcs.cover.url,dlcs.first_release_date,dlcs.aggregated_rating,dlcs.rating;
limit 500;
offset {$offset};
where version_parent = null;
sort id asc;
QUERY;

        $games = $this->post('/games', $body);

        if ($games === null) {
            throw new \RuntimeException("IGDB crawlBatch failed at offset {$offset}");
        }

        foreach ($games as $game) {
            if (empty($game['slug'])) {
                continue;
            }

            $coverUrl        = $this->imageUrl($game['cover']['url'] ?? null, 't_1080p');
            $released        = isset($game['first_release_date']) ? date('Y-m-d', $game['first_release_date']) : null;
            $rating          = isset($game['rating']) ? round($game['rating'] / 20, 2) : null;
            $metacritic      = isset($game['aggregated_rating']) ? (int) round($game['aggregated_rating']) : null;
            $screenshotsData = $this->transformScreenshots($game['screenshots'] ?? []);
            $moviesData      = $this->transformVideos($game['videos'] ?? []);
            $suggestedData   = $this->transformRelatedGames($game['similar_games'] ?? []);
            $additionsData   = $this->transformRelatedGames($game['dlcs'] ?? []);
            $detailsData     = $this->transformGame($game);

            Game::updateOrCreate(['slug' => $game['slug']], [
                'igdb_id'                => $game['id'],
                'name'                   => $game['name'],
                'released'               => $released,
                'rating'                 => $rating,
                'metacritic'             => $metacritic,
                'background_image'       => $coverUrl,
                'platforms'              => array_map(
                    fn ($p) => ['platform' => ['name' => $p['name'] ?? '', 'slug' => $p['abbreviation'] ?? '']],
                    $game['platforms'] ?? []
                ),
                'short_screenshots'      => array_slice($screenshotsData['results'], 0, 5),
                'details_data'           => $detailsData,
                'screenshots_data'       => $screenshotsData,
                'movies_data'            => $moviesData,
                'series_data'            => ['count' => 0, 'results' => []],
                'suggested_data'         => $suggestedData,
                'additions_data'         => $additionsData,
                'details_crawled_at'     => now(),
                'screenshots_crawled_at' => now(),
                'movies_crawled_at'      => now(),
                'series_crawled_at'      => now(),
                'suggested_crawled_at'   => now(),
                'additions_crawled_at'   => now(),
            ]);
        }

        return count($games);
    }

    // -------------------------------------------------------------------------
    // Individual game (DB-first + IGDB fallback for unknown slugs)
    // -------------------------------------------------------------------------

    public function getGameDetails(string $slug): ?array
    {
        $game = Game::where('slug', $slug)->whereNotNull('details_crawled_at')->first();
        if ($game && $game->details_crawled_at->gt(now()->subDays(30))) {
            return $game->details_data;
        }

        $body = <<<QUERY
fields id,name,slug,first_release_date,
  rating,rating_count,aggregated_rating,aggregated_rating_count,
  cover.url,
  summary,storyline,status,
  genres.name,genres.slug,
  platforms.name,platforms.abbreviation,
  keywords.name,keywords.slug,
  game_modes.name,themes.name,
  involved_companies.company.name,involved_companies.developer,involved_companies.publisher,
  websites.url,websites.category,
  age_ratings.category,age_ratings.rating,
  screenshots.url,screenshots.width,screenshots.height,
  videos.video_id,videos.name,
  similar_games.name,similar_games.slug,similar_games.cover.url,similar_games.first_release_date,similar_games.aggregated_rating,similar_games.rating,
  dlcs.name,dlcs.slug,dlcs.cover.url,dlcs.first_release_date,dlcs.aggregated_rating,dlcs.rating;
where slug = "{$slug}";
limit 1;
QUERY;

        $games = $this->post('/games', $body);
        if (empty($games)) {
            return null;
        }

        $g               = $games[0];
        $screenshotsData = $this->transformScreenshots($g['screenshots'] ?? []);
        $moviesData      = $this->transformVideos($g['videos'] ?? []);
        $suggestedData   = $this->transformRelatedGames($g['similar_games'] ?? []);
        $additionsData   = $this->transformRelatedGames($g['dlcs'] ?? []);
        $detailsData     = $this->transformGame($g);

        Game::updateOrCreate(['slug' => $slug], [
            'igdb_id'                => $g['id'],
            'name'                   => $g['name'],
            'released'               => isset($g['first_release_date']) ? date('Y-m-d', $g['first_release_date']) : null,
            'rating'                 => isset($g['rating']) ? round($g['rating'] / 20, 2) : null,
            'metacritic'             => isset($g['aggregated_rating']) ? (int) round($g['aggregated_rating']) : null,
            'background_image'       => $this->imageUrl($g['cover']['url'] ?? null, 't_1080p'),
            'platforms'              => array_map(
                fn ($p) => ['platform' => ['name' => $p['name'] ?? '', 'slug' => $p['abbreviation'] ?? '']],
                $g['platforms'] ?? []
            ),
            'short_screenshots'      => array_slice($screenshotsData['results'], 0, 5),
            'details_data'           => $detailsData,
            'screenshots_data'       => $screenshotsData,
            'movies_data'            => $moviesData,
            'series_data'            => ['count' => 0, 'results' => []],
            'suggested_data'         => $suggestedData,
            'additions_data'         => $additionsData,
            'details_crawled_at'     => now(),
            'screenshots_crawled_at' => now(),
            'movies_crawled_at'      => now(),
            'series_crawled_at'      => now(),
            'suggested_crawled_at'   => now(),
            'additions_crawled_at'   => now(),
        ]);

        return $detailsData;
    }

    // -------------------------------------------------------------------------
    // Passthrough reads — data is already stored in DB
    // -------------------------------------------------------------------------

    public function getGameScreenshots(string $slug): ?array
    {
        $game = Game::where('slug', $slug)->first();
        return $game?->screenshots_data ?? ['count' => 0, 'results' => []];
    }

    public function getGameMovies(string $slug): ?array
    {
        $game = Game::where('slug', $slug)->first();
        return $game?->movies_data ?? ['count' => 0, 'results' => []];
    }

    public function getGameSeries(string $slug): ?array
    {
        $game = Game::where('slug', $slug)->first();
        return $game?->series_data ?? ['count' => 0, 'results' => []];
    }

    public function getGameSuggested(string $slug): ?array
    {
        $game = Game::where('slug', $slug)->first();
        return $game?->suggested_data ?? ['count' => 0, 'results' => []];
    }

    public function getGameAdditions(string $slug): ?array
    {
        $game = Game::where('slug', $slug)->first();
        return $game?->additions_data ?? ['count' => 0, 'results' => []];
    }

    // -------------------------------------------------------------------------
    // Search (for /games browse page)
    // -------------------------------------------------------------------------

    public function searchGames(string $query = '', array $filters = []): ?array
    {
        // DB-first: if we have games, search locally
        if (Game::whereNotNull('details_crawled_at')->exists()) {
            return $this->searchDb($query, $filters);
        }

        return $this->searchApi($query, $filters);
    }

    private function searchDb(string $query, array $filters): array
    {
        $limit  = (int) ($filters['page_size'] ?? 24);
        $page   = (int) ($filters['page'] ?? 1);
        $offset = ($page - 1) * $limit;

        $q = Game::whereNotNull('details_crawled_at');

        if ($query) {
            $q->where('name', 'ilike', '%' . $query . '%');
        }

        $total   = $q->count();
        $results = $q->orderByDesc('rating')
            ->offset($offset)
            ->limit($limit)
            ->get(['id', 'slug', 'name', 'released', 'rating', 'metacritic', 'background_image', 'platforms'])
            ->map(fn ($g) => [
                'id'               => $g->id,
                'name'             => $g->name,
                'slug'             => $g->slug,
                'released'         => $g->released?->format('Y-m-d'),
                'background_image' => $g->background_image,
                'rating'           => $g->rating,
                'metacritic'       => $g->metacritic,
                'platforms'        => $g->platforms ?? [],
                'genres'           => [],
            ]);

        return [
            'count'    => $total,
            'next'     => $page * $limit < $total ? true : null,
            'previous' => $page > 1 ? true : null,
            'results'  => $results->toArray(),
        ];
    }

    private function searchApi(string $query, array $filters): ?array
    {
        $limit  = (int) ($filters['page_size'] ?? 24);
        $offset = ((int) ($filters['page'] ?? 1) - 1) * $limit;

        $searchLine = $query ? "search \"{$query}\";" : 'sort rating desc;';
        $where      = 'where version_parent = null & rating > 0';

        $body = <<<QUERY
fields id,name,slug,cover.url,first_release_date,aggregated_rating,rating,platforms.name,genres.name;
{$searchLine}
{$where};
limit {$limit};
offset {$offset};
QUERY;

        $games = $this->post('/games', $body);
        if ($games === null) {
            return null;
        }

        return [
            'count'   => count($games),
            'results' => array_map(fn ($g) => [
                'id'               => $g['id'],
                'name'             => $g['name'],
                'slug'             => $g['slug'],
                'released'         => isset($g['first_release_date']) ? date('Y-m-d', $g['first_release_date']) : null,
                'background_image' => $this->imageUrl($g['cover']['url'] ?? null, 't_cover_big'),
                'rating'           => isset($g['rating']) ? round($g['rating'] / 20, 2) : null,
                'metacritic'       => isset($g['aggregated_rating']) ? (int) round($g['aggregated_rating']) : null,
                'platforms'        => array_map(fn ($p) => ['platform' => ['name' => $p['name']]], $g['platforms'] ?? []),
                'genres'           => array_map(fn ($x) => ['name' => $x['name']], $g['genres'] ?? []),
            ], $games),
        ];
    }

    // -------------------------------------------------------------------------
    // Upcoming releases (for /calendar page)
    // -------------------------------------------------------------------------

    public function getUpcomingReleases(string $startDate, string $endDate): ?array
    {
        // DB-first
        if (Game::whereNotNull('details_crawled_at')->exists()) {
            $results = Game::whereNotNull('released')
                ->where('released', '>=', $startDate)
                ->where('released', '<=', $endDate)
                ->orderBy('released')
                ->limit(40)
                ->get(['id', 'slug', 'name', 'released', 'rating', 'metacritic', 'background_image', 'platforms'])
                ->map(fn ($g) => [
                    'id'               => $g->id,
                    'name'             => $g->name,
                    'slug'             => $g->slug,
                    'released'         => $g->released?->format('Y-m-d'),
                    'background_image' => $g->background_image,
                    'rating'           => $g->rating,
                    'metacritic'       => $g->metacritic,
                    'platforms'        => $g->platforms ?? [],
                ]);

            return ['count' => $results->count(), 'results' => $results->toArray()];
        }

        // API fallback
        $start = strtotime($startDate);
        $end   = strtotime($endDate);

        $body = <<<QUERY
fields game.name,game.slug,game.cover.url,game.platforms.name,date;
where date >= {$start} & date <= {$end} & game.version_parent = null;
sort date asc;
limit 40;
QUERY;

        $releases = $this->post('/release_dates', $body);
        if ($releases === null) {
            return null;
        }

        $seen    = [];
        $results = [];
        foreach ($releases as $r) {
            $g = $r['game'] ?? null;
            if (! $g || in_array($g['id'] ?? 0, $seen)) {
                continue;
            }
            $seen[]    = $g['id'];
            $results[] = [
                'id'               => $g['id'],
                'name'             => $g['name'],
                'slug'             => $g['slug'] ?? '',
                'released'         => date('Y-m-d', $r['date']),
                'background_image' => $this->imageUrl($g['cover']['url'] ?? null, 't_cover_big'),
                'rating'           => null,
                'metacritic'       => null,
                'platforms'        => array_map(fn ($p) => ['platform' => ['name' => $p['name']]], $g['platforms'] ?? []),
            ];
        }

        return ['count' => count($results), 'results' => $results];
    }

    // -------------------------------------------------------------------------
    // Data transformers (IGDB → RAWG-compatible format for frontend)
    // -------------------------------------------------------------------------

    private function transformGame(array $g): array
    {
        $platforms  = array_map(
            fn ($p) => ['platform' => ['name' => $p['name'] ?? '', 'slug' => $p['abbreviation'] ?? '']],
            $g['platforms'] ?? []
        );
        $genres     = array_map(fn ($x) => ['name' => $x['name']], $g['genres'] ?? []);
        $tags       = array_map(
            fn ($k) => ['name' => $k['name'], 'slug' => $k['slug'] ?? '', 'language' => 'eng'],
            $g['keywords'] ?? []
        );

        $developers = [];
        $publishers = [];
        foreach ($g['involved_companies'] ?? [] as $ic) {
            $name = $ic['company']['name'] ?? null;
            if (! $name) continue;
            if ($ic['developer'] ?? false) $developers[] = ['name' => $name];
            if ($ic['publisher'] ?? false) $publishers[] = ['name' => $name];
        }

        $website   = null;
        $redditUrl = null;
        $stores    = [];
        foreach ($g['websites'] ?? [] as $ws) {
            $cat = $ws['category'] ?? 0;
            $url = $ws['url'] ?? '';
            if ($cat === 1)  $website   = $url;
            if ($cat === 14) $redditUrl = $url;
            $storeName = match ($cat) {
                13      => 'Steam',
                17      => 'GOG',
                16      => 'Epic Games',
                default => null,
            };
            if ($storeName) {
                $stores[] = [
                    'id'    => $ws['id'] ?? 0,
                    'url'   => $url,
                    'store' => ['id' => $cat, 'name' => $storeName, 'domain' => parse_url($url, PHP_URL_HOST) ?? ''],
                ];
            }
        }

        $esrbRating = null;
        foreach ($g['age_ratings'] ?? [] as $ar) {
            if (($ar['category'] ?? 0) === 1) {
                $map  = [6 => 'RP', 7 => 'EC', 8 => 'E', 9 => 'E10+', 10 => 'T', 11 => 'M', 12 => 'AO'];
                $name = $map[$ar['rating'] ?? 0] ?? null;
                if ($name) {
                    $esrbRating = ['name' => $name, 'slug' => strtolower(str_replace('+', 'plus', $name))];
                }
                break;
            }
        }

        $screenshotCount = count($g['screenshots'] ?? []);
        $videoCount      = count($g['videos'] ?? []);
        $dlcCount        = count($g['dlcs'] ?? []);
        $released        = isset($g['first_release_date']) ? date('Y-m-d', $g['first_release_date']) : null;
        $rating          = isset($g['rating']) ? round($g['rating'] / 20, 2) : null;
        $metacritic      = isset($g['aggregated_rating']) ? (int) round($g['aggregated_rating']) : null;

        return [
            'id'                          => $g['id'],
            'name'                        => $g['name'],
            'slug'                        => $g['slug'],
            'description'                 => nl2br(htmlspecialchars($g['summary'] ?? '')),
            'description_raw'             => $g['summary'] ?? '',
            'storyline'                   => $g['storyline'] ?? null,
            'released'                    => $released,
            'background_image'            => $this->imageUrl($g['cover']['url'] ?? null, 't_1080p'),
            'background_image_additional' => null,
            'website'                     => $website,
            'rating'                      => $rating,
            'rating_top'                  => 5,
            'ratings'                     => [],
            'ratings_count'               => $g['rating_count'] ?? 0,
            'metacritic'                  => $metacritic,
            'metacritic_url'              => null,
            'metacritic_platforms'        => [],
            'playtime'                    => null,
            'esrb_rating'                 => $esrbRating,
            'achievements_count'          => 0,
            'movies_count'                => $videoCount,
            'additions_count'             => $dlcCount,
            'game_series_count'           => 0,
            'screenshots_count'           => $screenshotCount,
            'reddit_url'                  => $redditUrl,
            'reddit_count'                => 0,
            'platforms'                   => $platforms,
            'developers'                  => $developers,
            'publishers'                  => $publishers,
            'genres'                      => $genres,
            'tags'                        => $tags,
            'stores'                      => $stores,
        ];
    }

    private function transformScreenshots(array $screenshots): array
    {
        $results = array_values(array_map(
            fn ($s) => [
                'id'     => $s['id'] ?? 0,
                'image'  => $this->imageUrl($s['url'] ?? null, 't_1080p'),
                'width'  => $s['width'] ?? 1920,
                'height' => $s['height'] ?? 1080,
            ],
            array_filter($screenshots, fn ($s) => ! empty($s['url']))
        ));

        return ['count' => count($results), 'results' => $results];
    }

    private function transformVideos(array $videos): array
    {
        $results = array_values(array_map(
            fn ($v) => [
                'id'      => $v['id'] ?? 0,
                'name'    => $v['name'] ?? 'Trailer',
                'preview' => "https://img.youtube.com/vi/{$v['video_id']}/maxresdefault.jpg",
                'data'    => [
                    '480' => "https://www.youtube.com/embed/{$v['video_id']}",
                    'max' => "https://www.youtube.com/embed/{$v['video_id']}",
                ],
            ],
            array_filter($videos, fn ($v) => ! empty($v['video_id']))
        ));

        return ['count' => count($results), 'results' => $results];
    }

    private function transformRelatedGames(array $games): array
    {
        $results = array_values(array_map(
            fn ($g) => [
                'id'               => $g['id'] ?? 0,
                'name'             => $g['name'] ?? '',
                'slug'             => $g['slug'] ?? '',
                'background_image' => $this->imageUrl($g['cover']['url'] ?? null, 't_cover_big'),
                'released'         => isset($g['first_release_date']) ? date('Y-m-d', $g['first_release_date']) : null,
                'metacritic'       => isset($g['aggregated_rating']) ? (int) round($g['aggregated_rating']) : null,
                'rating'           => isset($g['rating']) ? round($g['rating'] / 20, 2) : null,
            ],
            array_filter($games, fn ($g) => ! empty($g['slug']))
        ));

        return ['count' => count($results), 'results' => $results];
    }

    private function imageUrl(?string $url, string $size): ?string
    {
        if (! $url) return null;
        return 'https:' . str_replace('t_thumb', $size, $url);
    }
}
