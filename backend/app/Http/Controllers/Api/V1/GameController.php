<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\SitemapController;
use App\Models\Article;
use App\Models\Game;
use App\Services\RawgService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class GameController extends Controller
{
    /** Parse PostgreSQL TEXT[] string like `{Action,"Role-Playing (RPG)"}` into a PHP array. */
    private function pgArray(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }
        if (! is_string($value) || $value === '{}') {
            return [];
        }

        return str_getcsv(trim($value, '{}'));
    }

    /**
     * A random game with a real description — powers the "Random Game" button.
     * Random offset instead of ORDER BY random() so it stays fast on 200K rows.
     */
    public function random()
    {
        $count = Cache::remember('games.random_count', 3600, fn () => Game::where('has_description', true)->count());

        if ($count < 1) {
            return response()->json(['message' => 'No games available'], 404);
        }

        $game = Game::where('has_description', true)
            ->orderBy('id')
            ->offset(random_int(0, $count - 1))
            ->limit(1)
            ->first(['slug', 'name']);

        return response()->json($game);
    }

    public function crawledSlugs()
    {
        $slugs = Game::whereNotNull('details_crawled_at')
            ->orderByDesc('rating')
            ->limit(2000)
            ->pluck('slug');

        return response()->json($slugs);
    }

    public function index(Request $request)
    {
        $search = $request->input('search', '');
        $genre = $request->input('genres', '');       // text name e.g. "Action"
        $platform = $request->input('platforms', '');    // text name e.g. "PC"
        $ordering = $request->input('ordering', '-rating');
        $yearFrom = (int) $request->input('year_from', 0);
        $yearTo = (int) $request->input('year_to', 0);
        $minRating = (float) $request->input('min_rating', 0);
        $page = max(1, (int) $request->input('page', 1));
        $pageSize = min(40, max(10, (int) $request->input('page_size', 20)));

        if ($search !== '' && $page === 1) {
            $this->logSearchQuery($search);
        }

        $cacheKey = 'games.index.v1.'.md5(json_encode([
            $search, $genre, $platform, $ordering, $yearFrom, $yearTo, $minRating, $page, $pageSize,
        ]));

        $payload = Cache::remember($cacheKey, 300, function () use ($search, $genre, $platform, $ordering, $yearFrom, $yearTo, $minRating, $page, $pageSize, $request) {
            $q = Game::query()
                ->when($search, fn ($q) => $q->where('name', 'ilike', "%{$search}%"))
                ->when($genre, fn ($q) => $q->whereRaw('genre_names @> ARRAY[?]::text[]', [$genre]))
                ->when($platform, fn ($q) => $q->whereRaw('platform_names @> ARRAY[?]::text[]', [$platform]))
                ->when($yearFrom > 0, fn ($q) => $q->where('released', '>=', "{$yearFrom}-01-01"))
                ->when($yearTo > 0, fn ($q) => $q->where('released', '<=', "{$yearTo}-12-31"))
                ->when($minRating > 0, fn ($q) => $q->where('rating', '>=', $minRating))
                ->select(['id', 'slug', 'name', 'released', 'rating', 'metacritic', 'background_image', 'platforms', 'short_screenshots']);

            // Ordering
            match ($ordering) {
                'rating' => $q->orderBy('rating'),
                '-released' => $q->orderByDesc('released'),
                'released' => $q->orderBy('released'),
                'name' => $q->orderBy('name'),
                '-name' => $q->orderByDesc('name'),
                '-views' => $q->orderByDesc('views'),  // trending by real page views
                '-added' => $q->orderByDesc('id'),     // recently added to the database
                default => $q->orderByDesc('rating'),  // -rating (default)
            };

            $games = $q->paginate($pageSize, ['*'], 'page', $page);

            return [
                'count' => $games->total(),
                'next' => $games->hasMorePages() ? $request->fullUrlWithQuery(['page' => $page + 1]) : null,
                'previous' => $page > 1 ? $request->fullUrlWithQuery(['page' => $page - 1]) : null,
                'results' => $games->items(),
            ];
        });

        return response()->json($payload)
            ->header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    }

    public function show(Request $request, string $slug)
    {
        $payload = Cache::remember("games.show.v1.{$slug}", 600, fn () => $this->buildShowPayload($slug));

        if (! $payload) {
            return response()->json(['message' => 'Game not found'], 404);
        }

        $this->trackView((int) $payload['id'], $request->ip());

        return response()->json($payload)
            ->header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    }

    /**
     * Log game search queries into a daily Redis sorted set — tells the
     * editorial team what the audience is looking for. 30-day retention.
     */
    private function logSearchQuery(string $query): void
    {
        try {
            $key = 'analytics:game_search:'.now()->format('Y-m-d');
            Redis::zincrby($key, 1, Str::lower(trim($query)));
            Redis::expire($key, 60 * 60 * 24 * 30);
        } catch (\Throwable) {
            // Analytics must never break search
        }
    }

    /**
     * Buffer game page views in Redis (flushed to views by
     * FlushViewCounters), throttled to one count per IP per 30 minutes.
     */
    private function trackView(int $gameId, ?string $ip): void
    {
        try {
            $throttleKey = "game_view_{$gameId}_".md5((string) $ip);
            if (! Cache::has($throttleKey)) {
                Cache::put($throttleKey, 1, 1800);
                Redis::incr("views:game:{$gameId}");
            }
        } catch (\Throwable) {
            // View tracking must never break the page
        }
    }

    private function buildShowPayload(string $slug): ?array
    {
        $game = Game::where('slug', $slug)->first();

        if (! $game) {
            return null;
        }

        $d = $game->details_data ?? [];

        // Extract ESRB rating from the ratings array
        $esrb = collect($d['ratings'] ?? [])
            ->first(fn ($r) => ($r['rating_system_name'] ?? '') === 'ESRB Rating');

        return [
            'id' => $game->id,
            'name' => $game->name,
            'slug' => $game->slug,
            'description' => $d['description'] ?? null,
            'description_raw' => $d['description_raw'] ?? null,
            'released' => $game->released?->format('Y-m-d'),
            'background_image' => $game->background_image,
            'background_image_additional' => $d['covers'][0]['covers'][0]['image'] ?? null,
            'website' => $d['official_url'] ?? null,
            'moby_url' => $d['moby_url'] ?? null,
            'rating' => $game->rating,
            'rating_top' => 10,
            'ratings_count' => $d['num_votes'] ?? 0,
            'metacritic' => null,
            'playtime' => null,
            'esrb_rating' => $esrb ? ['name' => $esrb['rating_name']] : null,
            'age_ratings' => $d['ratings'] ?? [],
            'system_requirements' => $d['attributes'] ?? [],
            'alternate_titles' => $d['alternate_titles'] ?? [],
            'platforms' => $game->platforms ?? [],
            'genres' => array_map(
                fn ($g) => ['name' => $g],
                $this->pgArray($game->genre_names)
            ),
            'tags' => array_map(
                fn ($t) => ['name' => $t, 'slug' => Str::slug($t), 'language' => 'eng'],
                $this->pgArray($game->tag_names)
            ),
            'developers' => $d['developers'] ?? [],
            'publishers' => $d['publishers'] ?? [],
            'moby_group_id' => $game->moby_group_id,
            'moby_group_name' => $game->moby_group_name,
            'short_screenshots' => array_slice($d['sample_screenshots'] ?? [], 0, 5),
            'movies_count' => 0,
            'additions_count' => 0,
            'game_series_count' => $game->moby_group_id ? 1 : 0,
            'screenshots_count' => count(($game->screenshots_data ?? [])['screenshots'] ?? []),
            'reddit_url' => null,
            'stores' => [],
            'achievements_count' => 0,
        ];
    }

    /**
     * Published editorial content (news, reviews, guides) linked to this game
     * via articles.game_id. Powers the "Related News & Reviews" section.
     */
    public function articles(string $slug)
    {
        $gameId = Game::where('slug', $slug)->value('id');

        if (! $gameId) {
            return response()->json(['data' => []]);
        }

        $articles = Cache::remember("games.articles.v1.{$gameId}", 600, function () use ($gameId) {
            return Article::where('game_id', $gameId)
                ->where('status', 'published')
                ->with('category:id,name,type')
                ->orderByDesc('published_at')
                ->limit(6)
                ->get(['id', 'slug', 'title', 'excerpt', 'featured_image_url', 'published_at', 'review_score', 'category_id'])
                ->map(fn ($a) => [
                    'slug' => $a->slug,
                    'title' => $a->title,
                    'excerpt' => $a->excerpt,
                    'image' => $a->featured_image_url,
                    'published_at' => $a->published_at?->toIso8601String(),
                    'review_score' => $a->review_score,
                    'category' => $a->category->name ?? null,
                    'path' => SitemapController::getArticleTypePath($a->category->type ?? 'news'),
                ])
                ->values();
        });

        return response()->json(['data' => $articles])
            ->header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    }

    public function screenshots(string $slug)
    {
        $data = Game::where('slug', $slug)->value('screenshots_data');

        // Normalize MobyGames format { screenshots: [...] } → { count, results: [...] }
        $results = $data['screenshots'] ?? $data['results'] ?? [];

        return response()->json(['count' => count($results), 'results' => $results]);
    }

    public function movies(string $slug)
    {
        $data = Game::where('slug', $slug)->value('movies_data');

        return response()->json($data ?? ['count' => 0, 'results' => []]);
    }

    public function series(string $slug)
    {
        $data = Game::where('slug', $slug)->value('series_data');

        return response()->json($data ?? ['count' => 0, 'results' => []]);
    }

    public function suggested(string $slug)
    {
        $data = Game::where('slug', $slug)->value('suggested_data');

        return response()->json($data ?? ['count' => 0, 'results' => []]);
    }

    public function additions(string $slug)
    {
        $data = Game::where('slug', $slug)->value('additions_data');

        return response()->json($data ?? ['count' => 0, 'results' => []]);
    }

    /**
     * Fetch a single game's full details from the RAWG.io API.
     * Cached for 12 hours — RAWG game details rarely change.
     */
    public function rawgDetail(string $slug, RawgService $rawg)
    {
        $game = Cache::remember("rawg.game.{$slug}", 3600 * 12, function () use ($slug, $rawg) {
            return $rawg->getGameDetails($slug);
        });

        if (! $game) {
            return response()->json(['message' => 'Game not found'], 404);
        }

        return response()->json($game)
            ->header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=43200');
    }

    public function rawgScreenshots(string $slug, RawgService $rawg)
    {
        $data = Cache::remember("rawg.screenshots.{$slug}", 3600 * 24, function () use ($slug, $rawg) {
            return $rawg->getScreenshots($slug);
        });

        if (! $data) {
            return response()->json(['count' => 0, 'results' => []]);
        }

        return response()->json($data)
            ->header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=86400');
    }

    public function rawgMovies(string $slug, RawgService $rawg)
    {
        $data = Cache::remember("rawg.movies.{$slug}", 3600 * 24, function () use ($slug, $rawg) {
            return $rawg->getMovies($slug);
        });

        if (! $data) {
            return response()->json(['count' => 0, 'results' => []]);
        }

        return response()->json($data)
            ->header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=86400');
    }

    public function rawgGameSeries(string $slug, RawgService $rawg)
    {
        $data = Cache::remember("rawg.series.{$slug}", 86400, function () use ($slug, $rawg) {
            return $rawg->getGameSeries($slug);
        });

        if (! $data) {
            return response()->json(['count' => 0, 'results' => []]);
        }

        return response()->json($data)
            ->header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=86400');
    }

    public function rawgSuggested(string $slug, RawgService $rawg)
    {
        $data = Cache::remember("rawg.suggested.{$slug}", 3600 * 6, function () use ($slug, $rawg) {
            return $rawg->getSuggestedGames($slug);
        });

        if (! $data) {
            return response()->json(['count' => 0, 'results' => []]);
        }

        return response()->json($data)
            ->header('Cache-Control', 'public, max-age=21600, stale-while-revalidate=21600');
    }

    /**
     * Game release calendar — powered by the RAWG.io API.
     *
     * With start_date/end_date: returns all releases in the range (month view).
     * Without params: returns upcoming releases from today (used by sidebar/home widgets).
     * Responses are cached; falls back to the local games DB if RAWG is unavailable.
     */
    /**
     * GET /games/hidden-gems — highly rated games almost nobody has voted on.
     *
     * "Hidden" = a trustworthy score (rating >= 8) from a small crowd
     * (3-80 votes). Candidates are pulled off the rating index and only then
     * have their vote count extracted, so this never scans the whole catalog.
     * The daily cache key doubles as the rotation seed.
     */
    public function hiddenGems()
    {
        $today = now()->toDateString();

        $payload = Cache::remember("games.hidden_gems.v2.{$today}", 86400, function () use ($today) {
            // Moby stores the vote count as `num_votes`; the show payload is what
            // renames it to ratings_count on the way out.
            $votes = DB::getDriverName() === 'pgsql'
                ? "(details_data->>'num_votes')::int"
                : "CAST(json_extract(details_data, '$.num_votes') AS INTEGER)";

            return Game::query()
                ->where('has_description', true)
                ->whereNotNull('background_image')
                ->whereNotNull('released')
                ->where('rating', '>=', 8)
                ->orderByDesc('rating')
                ->limit(800)
                ->get(['slug', 'name', 'background_image', 'rating', 'released', 'genre_names', DB::raw("{$votes} as votes")])
                // enough votes to trust the score, then the least-known first
                ->filter(fn ($g) => $g->votes !== null && $g->votes >= 3)
                ->sortBy('votes')
                ->take(60)
                // deterministic per-day shuffle so the rail rotates without a random seed
                ->sortBy(fn ($g) => md5($g->slug.$today))
                ->take(6)
                ->map(fn ($g) => [
                    'slug' => $g->slug,
                    'name' => $g->name,
                    'background_image' => $g->background_image,
                    'rating' => (float) $g->rating,
                    'released' => $g->released?->toDateString(),
                    'genres' => array_slice((array) $g->genre_names, 0, 2),
                    'votes' => (int) $g->votes,
                ])
                ->values()
                ->all();
        });

        return response()->json(['results' => $payload])
            ->header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    }

    /**
     * GET /games/on-this-day — notable games released on today's date in past years.
     */
    public function onThisDay()
    {
        $today = now();

        $payload = Cache::remember("games.on_this_day.v1.{$today->format('m-d')}", 86400, function () use ($today) {
            $q = Game::query()
                ->where('has_description', true)
                ->whereNotNull('background_image')
                ->whereNotNull('released')
                ->whereYear('released', '<', $today->year)
                ->where('rating', '>=', 7);

            if (DB::getDriverName() === 'pgsql') {
                $q->whereRaw('EXTRACT(MONTH FROM released) = ? AND EXTRACT(DAY FROM released) = ?', [$today->month, $today->day]);
            } else {
                $q->whereRaw("strftime('%m-%d', released) = ?", [$today->format('m-d')]);
            }

            return $q->orderByDesc('rating')
                ->limit(6)
                ->get(['slug', 'name', 'background_image', 'rating', 'released', 'genre_names'])
                ->map(fn ($g) => [
                    'slug' => $g->slug,
                    'name' => $g->name,
                    'background_image' => $g->background_image,
                    'rating' => (float) $g->rating,
                    'released' => $g->released?->toDateString(),
                    'genres' => array_slice((array) $g->genre_names, 0, 2),
                    'years_ago' => $today->year - (int) $g->released->format('Y'),
                ])
                ->values()
                ->all();
        });

        return response()->json(['results' => $payload, 'date' => $today->format('F j')])
            ->header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    }

    public function calendar(Request $request, RawgService $rawg)
    {
        $start = $request->query('start_date');
        $end = $request->query('end_date');

        $validDate = fn ($d) => is_string($d) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $d);

        if ($validDate($start) && $validDate($end)) {
            $from = $start;
            $to = $end;
            $maxPages = 15; // up to 600 games (pages fetched in parallel)
        } else {
            // Widget mode: upcoming releases, next 90 days
            $from = now()->toDateString();
            $to = now()->addDays(90)->toDateString();
            $maxPages = 1;
        }

        $cacheKey = "rawg.calendar.{$from}.{$to}";

        $data = Cache::remember($cacheKey, 21600, function () use ($rawg, $from, $to, $maxPages) {
            $rawgData = $rawg->getReleases($from, $to, 'released', $maxPages);

            if ($rawgData === null) {
                return null; // don't cache failures
            }

            // Trim each game to only the fields the frontend needs
            $results = array_map(fn ($g) => [
                'id' => $g['id'] ?? null,
                'slug' => $g['slug'] ?? '',
                'name' => $g['name'] ?? '',
                'released' => $g['released'] ?? null,
                'tba' => $g['tba'] ?? false,
                'background_image' => $g['background_image'] ?? null,
                'metacritic' => $g['metacritic'] ?? null,
                'rating' => $g['rating'] ?? 0,
                'ratings_count' => $g['ratings_count'] ?? 0,
                'added' => $g['added'] ?? 0,
                'genres' => array_map(fn ($genre) => ['name' => $genre['name'] ?? ''], $g['genres'] ?? []),
                'platforms' => array_map(fn ($p) => ['platform' => ['name' => $p['platform']['name'] ?? '', 'slug' => $p['platform']['slug'] ?? '']], $g['platforms'] ?? []),
            ], $rawgData['results']);

            return ['count' => $rawgData['count'], 'results' => $results];
        });

        // Fallback: local games DB if RAWG is unavailable
        if ($data === null) {
            $games = Game::query()
                ->whereNotNull('released')
                ->whereBetween('released', [$from, $to])
                ->select(['id', 'slug', 'name', 'released', 'rating', 'metacritic', 'background_image', 'platforms'])
                ->orderBy('released')
                ->limit(40)
                ->get();

            $data = ['count' => $games->count(), 'results' => $games];
        }

        return response()->json($data)
            ->header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=21600');
    }
}
