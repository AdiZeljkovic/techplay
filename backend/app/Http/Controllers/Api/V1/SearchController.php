<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

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

        $query = $request->q;
        $cacheKey = 'search.articles.' . md5($query);

        // Cache for 60 seconds to prevent hammering
        return Cache::remember($cacheKey, 60, function () use ($query) {
            $results = Article::query()
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                // Search in title and excerpt
                ->where(function ($q) use ($query) {
                    $q->where('title', 'LIKE', "%{$query}%")
                        ->orWhere('excerpt', 'LIKE', "%{$query}%");
                })
                // Only include articles from content categories (news, reviews, tech)
                ->whereHas('category', function ($q) {
                    $q->whereIn('type', ['news', 'reviews', 'tech']);
                })
                ->with(['category:id,name,slug,type'])
                ->select('id', 'title', 'slug', 'excerpt', 'featured_image', 'category_id', 'published_at')
                ->orderByDesc('published_at')
                ->limit(10)
                ->get();

            return [
                'results' => $results->map(function ($article) {
                    return [
                        'id' => $article->id,
                        'title' => $article->title,
                        'slug' => $article->slug,
                        'excerpt' => $article->excerpt ? \Illuminate\Support\Str::limit(strip_tags($article->excerpt), 80) : null,
                        'image' => $article->featured_image,
                        'category' => $article->category?->name,
                        'category_slug' => $article->category?->slug,
                        'type' => $article->category?->type,
                        'url' => $this->buildArticleUrl($article),
                    ];
                }),
                'count' => $results->count(),
            ];
        });
    }

    /**
     * Build the correct URL based on category type
     */
    private function buildArticleUrl($article): string
    {
        $type = $article->category?->type ?? 'news';

        return match ($type) {
            'reviews' => "/reviews/{$article->slug}",
            'tech' => "/hardware/{$article->slug}",
            default => "/news/{$article->slug}",
        };
    }
}
