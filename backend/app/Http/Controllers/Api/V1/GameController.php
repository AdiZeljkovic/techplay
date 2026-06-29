<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Services\RawgService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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
            default => $q->orderByDesc('rating'),  // -rating (default)
        };

        $games = $q->paginate($pageSize, ['*'], 'page', $page);

        return response()->json([
            'count' => $games->total(),
            'next' => $games->hasMorePages() ? $request->fullUrlWithQuery(['page' => $page + 1]) : null,
            'previous' => $page > 1 ? $request->fullUrlWithQuery(['page' => $page - 1]) : null,
            'results' => $games->items(),
        ]);
    }

    public function show(string $slug)
    {
        $game = Game::where('slug', $slug)->first();

        if (! $game) {
            return response()->json(['message' => 'Game not found'], 404);
        }

        $d = $game->details_data ?? [];

        // Extract ESRB rating from the ratings array
        $esrb = collect($d['ratings'] ?? [])
            ->first(fn ($r) => ($r['rating_system_name'] ?? '') === 'ESRB Rating');

        return response()->json([
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
        ]);
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
