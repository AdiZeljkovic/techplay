<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\SitemapController;
use App\Models\Article;
use App\Models\Game;
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
        $count = Cache::remember('games.random_count', 3600, fn () => Game::whereNotNull('description')->count());

        if ($count < 1) {
            return response()->json(['message' => 'No games available'], 404);
        }

        $game = Game::whereNotNull('description')
            ->orderBy('id')
            ->offset(random_int(0, $count - 1))
            ->limit(1)
            ->first(['slug', 'name']);

        return response()->json($game);
    }

    public function index(Request $request)
    {
        $search = $request->input('search', '');
        $genre = $request->input('genres', '');       // text name e.g. "Action"
        $platform = $request->input('platforms', '');    // text name e.g. "PC"
        $tag = $request->input('tags', '');           // text name e.g. "Open World"
        $ordering = $request->input('ordering', '-rating');
        $yearFrom = (int) $request->input('year_from', 0);
        $yearTo = (int) $request->input('year_to', 0);
        $minRating = (float) $request->input('min_rating', 0);
        // released | upcoming | undated — the hub's rail offers these with
        // counts, so the list has to be able to answer them.
        $status = $request->input('status', 'all');
        $page = max(1, (int) $request->input('page', 1));
        $pageSize = min(40, max(10, (int) $request->input('page_size', 20)));

        if ($search !== '' && $page === 1) {
            $this->logSearchQuery($search);
        }

        $cacheKey = 'games.index.v1.'.md5(json_encode([
            $search, $genre, $platform, $tag, $ordering, $yearFrom, $yearTo, $minRating, $status, $page, $pageSize,
        ]));

        $payload = Cache::remember($cacheKey, 300, function () use ($search, $genre, $platform, $tag, $ordering, $yearFrom, $yearTo, $minRating, $status, $page, $pageSize, $request) {
            $today = now()->toDateString();
            $q = Game::query()
                ->when($search, fn ($q) => $q->where('name', 'ilike', "%{$search}%"))
                ->when($genre, fn ($q) => $q->whereRaw('genres @> ARRAY[?]::text[]', [$genre]))
                ->when($platform, fn ($q) => $q->whereRaw('platforms @> ARRAY[?]::text[]', [$platform]))
                ->when($tag, fn ($q) => $q->whereRaw('tags @> ARRAY[?]::text[]', [$tag]))
                ->when($yearFrom > 0, fn ($q) => $q->where('released', '>=', "{$yearFrom}-01-01"))
                ->when($yearTo > 0, fn ($q) => $q->where('released', '<=', "{$yearTo}-12-31"))
                ->when($minRating > 0, fn ($q) => $q->where('rating', '>=', $minRating))
                ->when($status === 'released', fn ($q) => $q->where('released', '<=', $today))
                ->when($status === 'upcoming', fn ($q) => $q->where('released', '>', $today))
                ->when($status === 'undated', fn ($q) => $q->whereNull('released'))
                ->select(['id', 'slug', 'name', 'released', 'rating', 'cover_url', 'platforms', 'genres']);

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
        $payload = Cache::remember("games.show.v2.{$slug}", 600, fn () => $this->buildShowPayload($slug));

        if (! $payload) {
            // Deleted on purpose (adult purge) answers 410, so crawlers drop
            // the page quickly instead of retrying a 404 for months.
            $gone = DB::table('game_tombstones')->where('slug', $slug)->exists();

            return response()->json(
                ['message' => $gone ? 'Game removed' : 'Game not found'],
                $gone ? 410 : 404
            );
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

    /**
     * The canonical detail payload. Real columns first; the import payload is
     * consulted only for what has not been promoted yet (vote counts, the
     * attribute list). No RAWG cosplay fields — a client that wants a value we
     * do not have should see it missing, not null-with-a-familiar-name.
     */
    private function buildShowPayload(string $slug): ?array
    {
        $game = Game::where('slug', $slug)->first();

        if (! $game) {
            return null;
        }

        $raw = $game->import_payload ?? [];

        $esrb = collect($game->age_ratings ?? [])
            ->first(fn ($r) => ($r['rating_system_name'] ?? '') === 'ESRB Rating');

        return [
            'id' => $game->id,
            'name' => $game->name,
            'slug' => $game->slug,
            'description' => $game->description,
            'released' => $game->released?->format('Y-m-d'),
            'release_precision' => $game->release_precision,
            'cover_url' => $game->cover_url,
            'website' => $game->website,
            'rating' => $game->rating,
            'rating_top' => 10,
            'ratings_count' => $raw['num_votes'] ?? 0,
            'esrb_rating' => $esrb ? ['name' => $esrb['rating_name']] : null,
            'age_ratings' => $game->age_ratings ?? [],
            'attributes' => $raw['attributes'] ?? [],
            'alt_titles' => $game->alt_titles ?? [],
            'platforms' => $game->platforms ?? [],
            'genres' => $game->genres ?? [],
            'tags' => $game->tags ?? [],
            'developers' => $game->developers ?? [],
            'publishers' => $game->publishers ?? [],
            'series_key' => $game->series_key,
            'series_name' => $game->series_name,
            'videos' => $game->videos ?? [],
            'screenshots_count' => count(array_is_list($game->screenshots ?? [])
                ? ($game->screenshots ?? [])
                : (($game->screenshots ?? [])['screenshots'] ?? ($game->screenshots ?? [])['results'] ?? [])),
            'views' => (int) $game->views,
        ];
    }

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
        $data = Game::where('slug', $slug)->value('screenshots');
        $data = is_string($data) ? json_decode($data, true) : $data;

        // Moby wrapped its list; the aggregator writes a plain array of URLs.
        $results = array_is_list($data ?? [])
            ? ($data ?? [])
            : ($data['screenshots'] ?? $data['results'] ?? []);

        return response()->json(['count' => count($results), 'results' => $results]);
    }

    public function videos(string $slug)
    {
        $data = Game::where('slug', $slug)->value('videos');
        $data = is_string($data) ? json_decode($data, true) : $data;
        $results = is_array($data) ? array_values($data) : [];

        return response()->json(['count' => count($results), 'results' => $results]);
    }

    /**
     * Games in the same series. The old endpoint replayed a Moby payload blob;
     * this one asks our own catalogue, which is the point of having one.
     */
    public function series(string $slug)
    {
        $game = Game::where('slug', $slug)->first(['id', 'series_key']);

        if (! $game || ! $game->series_key) {
            return response()->json(['count' => 0, 'results' => []]);
        }

        $results = Game::where('series_key', $game->series_key)
            ->where('id', '!=', $game->id)
            ->orderByDesc('rating')
            ->limit(10)
            ->get(['slug', 'name', 'released', 'rating', 'cover_url'])
            ->map(fn ($g) => [
                'slug' => $g->slug,
                'name' => $g->name,
                'released' => $g->released?->toDateString(),
                'rating' => (float) $g->rating,
                'cover_url' => $g->cover_url,
            ]);

        return response()->json(['count' => $results->count(), 'results' => $results]);
    }

    /**
     * More like this: same lead genre, well rated, with art. Honest and
     * simple — a recommender can replace the ranking later without the
     * endpoint changing shape.
     */
    public function suggested(string $slug)
    {
        $game = Game::where('slug', $slug)->first(['id', 'genres']);
        $lead = $game?->genres[0] ?? null;

        if (! $game || ! $lead) {
            return response()->json(['count' => 0, 'results' => []]);
        }

        $results = Cache::remember("games.suggested.v2.{$game->id}", 3600, fn () => Game::query()
            ->whereRaw('genres @> ARRAY[?]::text[]', [$lead])
            ->where('id', '!=', $game->id)
            ->whereNotNull('cover_url')
            ->where('rating', '>=', 7)
            ->orderByDesc('rating')
            ->limit(8)
            ->get(['slug', 'name', 'released', 'rating', 'cover_url'])
            ->map(fn ($g) => [
                'slug' => $g->slug,
                'name' => $g->name,
                'released' => $g->released?->toDateString(),
                'rating' => (float) $g->rating,
                'cover_url' => $g->cover_url,
            ])->all());

        return response()->json(['count' => count($results), 'results' => $results]);
    }

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
            // Moby stored the vote count as `num_votes`; it lives in the
            // import payload until votes become our own.
            $votes = DB::getDriverName() === 'pgsql'
                ? "(import_payload->>'num_votes')::int"
                : "CAST(json_extract(import_payload, '$.num_votes') AS INTEGER)";

            return Game::query()
                ->whereNotNull('description')
                ->whereNotNull('cover_url')
                ->whereNotNull('released')
                ->where('rating', '>=', 8)
                ->orderByDesc('rating')
                ->limit(800)
                ->get(['slug', 'name', 'cover_url', 'rating', 'released', 'genres', DB::raw("{$votes} as votes")])
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
                    'cover_url' => $g->cover_url,
                    'rating' => (float) $g->rating,
                    'released' => $g->released?->toDateString(),
                    'genres' => array_slice((array) $g->genres, 0, 2),
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
                ->whereNotNull('description')
                ->whereNotNull('cover_url')
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
                ->get(['slug', 'name', 'cover_url', 'rating', 'released', 'genres'])
                ->map(fn ($g) => [
                    'slug' => $g->slug,
                    'name' => $g->name,
                    'cover_url' => $g->cover_url,
                    'rating' => (float) $g->rating,
                    'released' => $g->released?->toDateString(),
                    'genres' => array_slice((array) $g->genres, 0, 2),
                    'years_ago' => $today->year - (int) $g->released->format('Y'),
                ])
                ->values()
                ->all();
        });

        return response()->json(['results' => $payload, 'date' => $today->format('F j')])
            ->header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    }

    /**
     * The home widget's release strip. This used to call RAWG live; the
     * release aggregator's own rows are the calendar now, ordered by the
     * hype the aggregator already computes.
     */
    public function calendar(Request $request)
    {
        $validDate = fn ($d) => is_string($d) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $d);
        $start = $request->query('start_date');
        $end = $request->query('end_date');

        $from = $validDate($start) ? $start : now()->toDateString();
        $to = $validDate($end) ? $end : now()->addDays(90)->toDateString();

        $data = Cache::remember("games.calendar.v2.{$from}.{$to}", 3600, function () use ($from, $to) {
            $games = Game::query()
                ->whereNotNull('match_key')
                ->whereBetween('released', [$from, $to])
                ->orderByDesc('hype_score')
                ->orderBy('released')
                ->limit(60)
                ->get(['id', 'slug', 'name', 'released', 'rating', 'cover_url', 'platforms', 'genres', 'hype_score']);

            return [
                'count' => $games->count(),
                'results' => $games->map(fn ($g) => [
                    'id' => $g->id,
                    'slug' => $g->slug,
                    'name' => $g->name,
                    'released' => $g->released?->toDateString(),
                    'cover_url' => $g->cover_url,
                    'rating' => (float) ($g->rating ?? 0),
                    'genres' => array_slice((array) $g->genres, 0, 3),
                    'platforms' => array_slice((array) $g->platforms, 0, 4),
                    'hype_score' => (int) $g->hype_score,
                ])->all(),
            ];
        });

        return response()->json($data)
            ->header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=21600');
    }
}
