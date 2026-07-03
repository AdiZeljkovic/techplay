<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Game;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class SearchController extends Controller
{
    /**
     * Search articles across News, Reviews, Tech, and Guides
     * Returns max 10 results for quick autocomplete
     */
    public function articles(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:2|max:100',
        ]);

        $query = $request->input('q');
        $cacheKey = 'search.articles.'.md5($query);

        // Cache for 60 seconds to prevent hammering
        $result = Cache::remember($cacheKey, 60, function () use ($query) {
            $results = Article::query()
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                ->whereRaw("to_tsvector('english', title || ' ' || coalesce(excerpt, '')) @@ plainto_tsquery('english', ?)", [$query])
                // Only include articles from content categories (news, reviews, tech)
                ->whereHas('category', function ($q) {
                    $q->whereIn('type', ['news', 'reviews', 'tech']);
                })
                ->with(['category:id,name,slug,type'])
                ->select('id', 'title', 'slug', 'excerpt', 'featured_image_url', 'category_id', 'published_at')
                ->orderByDesc('published_at')
                ->limit(10)
                ->get();

            return [
                'results' => $results->map(function ($article) {
                    // Build URL based on category type
                    $type = $article->category?->type ?? 'news';
                    $url = match ($type) {
                        'reviews' => "/reviews/{$article->slug}",
                        'tech' => "/hardware/{$article->slug}",
                        default => "/news/{$article->slug}",
                    };

                    return [
                        'id' => $article->id,
                        'title' => $article->title,
                        'slug' => $article->slug,
                        'excerpt' => $article->excerpt ? Str::limit(strip_tags($article->excerpt), 80) : null,
                        'image' => $article->featured_image_url,
                        'category' => $article->category?->name,
                        'category_slug' => $article->category?->slug,
                        'type' => $type,
                        'url' => $url,
                    ];
                }),
                'count' => $results->count(),
            ];
        });

        return response()->json($result)->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    /**
     * Search the game database for the global search dropdown.
     * Uses the trigram index on games.name; max 5 results.
     */
    public function games(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:2|max:100',
        ]);

        $query = $request->input('q');
        $cacheKey = 'search.games.'.md5($query);

        $result = Cache::remember($cacheKey, 60, function () use ($query) {
            $results = Game::query()
                ->where('name', 'ILIKE', "%{$query}%")
                ->where('has_description', true)
                ->orderByDesc('rating')
                ->select('id', 'name', 'slug', 'background_image', 'released', 'rating')
                ->limit(5)
                ->get();

            return [
                'results' => $results->map(fn ($game) => [
                    'id' => $game->id,
                    'title' => $game->name,
                    'slug' => $game->slug,
                    'excerpt' => null,
                    'image' => $game->background_image,
                    'category' => $game->released ? 'Game · '.$game->released->format('Y') : 'Game',
                    'category_slug' => 'games',
                    'type' => 'game',
                    'url' => "/games/{$game->slug}",
                ]),
                'count' => $results->count(),
            ];
        });

        return response()->json($result)->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
}
