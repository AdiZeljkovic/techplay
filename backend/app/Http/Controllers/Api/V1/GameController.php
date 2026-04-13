<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Game;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GameController extends Controller
{
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
        $search   = $request->input('search', '');
        $genre    = $request->input('genres', '');       // text name e.g. "Action"
        $platform = $request->input('platforms', '');    // text name e.g. "PC"
        $ordering = $request->input('ordering', '-rating');
        $page     = max(1, (int) $request->input('page', 1));
        $pageSize = min(40, max(10, (int) $request->input('page_size', 20)));

        $q = Game::query()
            ->when($search,   fn ($q) => $q->where('name', 'ilike', "%{$search}%"))
            ->when($genre,    fn ($q) => $q->whereRaw("genre_names @> ARRAY[?]::text[]", [$genre]))
            ->when($platform, fn ($q) => $q->whereRaw("platform_names @> ARRAY[?]::text[]", [$platform]))
            ->select(['id', 'slug', 'name', 'released', 'rating', 'metacritic', 'background_image', 'platforms', 'short_screenshots']);

        // Ordering
        match ($ordering) {
            'rating'    => $q->orderBy('rating'),
            '-released' => $q->orderByDesc('released'),
            'released'  => $q->orderBy('released'),
            'name'      => $q->orderBy('name'),
            '-name'     => $q->orderByDesc('name'),
            default     => $q->orderByDesc('rating'),  // -rating (default)
        };

        $games = $q->paginate($pageSize, ['*'], 'page', $page);

        return response()->json([
            'count'    => $games->total(),
            'next'     => $games->hasMorePages() ? $request->fullUrlWithQuery(['page' => $page + 1]) : null,
            'previous' => $page > 1 ? $request->fullUrlWithQuery(['page' => $page - 1]) : null,
            'results'  => $games->items(),
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
            ->first(fn($r) => ($r['rating_system_name'] ?? '') === 'ESRB Rating');

        return response()->json([
            'id'                          => $game->id,
            'name'                        => $game->name,
            'slug'                        => $game->slug,
            'description'                 => $d['description'] ?? null,
            'description_raw'             => $d['description_raw'] ?? null,
            'released'                    => $game->released?->format('Y-m-d'),
            'background_image'            => $game->background_image,
            'background_image_additional' => $d['covers'][0]['covers'][0]['image'] ?? null,
            'website'                     => $d['official_url'] ?? null,
            'moby_url'                    => $d['moby_url'] ?? null,
            'rating'                      => $game->rating,
            'rating_top'                  => 10,
            'ratings_count'               => $d['num_votes'] ?? 0,
            'metacritic'                  => null,
            'playtime'                    => null,
            'esrb_rating'                 => $esrb ? ['name' => $esrb['rating_name']] : null,
            'age_ratings'                 => $d['ratings'] ?? [],
            'system_requirements'         => $d['attributes'] ?? [],
            'alternate_titles'            => $d['alternate_titles'] ?? [],
            'platforms'                   => $game->platforms ?? [],
            'genres'                      => array_map(
                fn($g) => ['name' => $g],
                $game->genre_names ?? []
            ),
            'tags'                        => array_map(
                fn($t) => ['name' => $t, 'slug' => Str::slug($t), 'language' => 'eng'],
                $game->tag_names ?? []
            ),
            'developers'                  => $d['developers'] ?? [],
            'publishers'                  => $d['publishers'] ?? [],
            'moby_group_id'               => $game->moby_group_id,
            'moby_group_name'             => $game->moby_group_name,
            'short_screenshots'           => array_slice($d['sample_screenshots'] ?? [], 0, 5),
            'movies_count'                => 0,
            'additions_count'             => 0,
            'game_series_count'           => $game->moby_group_id ? 1 : 0,
            'screenshots_count'           => count(($game->screenshots_data ?? [])['screenshots'] ?? []),
            'reddit_url'                  => null,
            'stores'                      => [],
            'achievements_count'          => 0,
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

    public function calendar()
    {
        $games = Game::query()
            ->whereNotNull('released')
            ->where('released', '>=', now()->toDateString())
            ->select(['id', 'slug', 'name', 'released', 'rating', 'metacritic', 'background_image', 'platforms'])
            ->orderBy('released')
            ->limit(20)
            ->get();

        return response()->json(['count' => $games->count(), 'results' => $games]);
    }
}
