<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\CacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class NavigationController extends Controller
{
    /**
     * Get the navigation tree structure.
     * Cached for 5 minutes (300s) to reduce DB load.
     * Invalidated when categories are created/updated/deleted.
     */
    public function index(): JsonResponse
    {
        $tree = Cache::remember('navigation.tree', CacheService::TTL_MEDIUM, function () {
            // Fetch all generic categories (excluding forum categories if they are different model/table)
            // We use 'type' to distinguish roots.

            $roots = \App\Models\Category::whereNull('parent_id')
                ->with(['children' => fn($q) => $q->orderBy('name')])
                ->get();

            $tree = [];

            // Custom sort order for News subcategories (Interviews goes last)
            $newsOrder = ['Gaming', 'PC', 'Consoles', 'Movies & TV', 'Industry', 'E-sport', 'Opinions', 'Interviews'];

            foreach ($roots as $root) {
                $key = strtolower($root->type); // news, reviews, tech

                // Map children to simplified structure
                $children = $root->children->map(function ($child) {
                    // Determine HREF based on type
                    // News: /news/{slug}
                    // Reviews: /reviews/{slug}
                    // Tech: /hardware/{slug}

                    $base = match ($child->type) {
                        'news' => '/news',
                        'reviews' => '/reviews',
                        'tech' => '/hardware',
                        default => '/news'
                    };

                    // Extract the last part of the slug (e.g., 'news-gaming' -> 'gaming')
                    $urlSlug = str_replace(['news-', 'reviews-', 'tech-'], '', $child->slug);

                    return [
                        'name' => $child->name,
                        'href' => "{$base}/{$urlSlug}"
                    ];
                });

                // Apply custom sort for news
                if ($key === 'news') {
                    $children = $children->sortBy(function ($item) use ($newsOrder) {
                        $index = array_search($item['name'], $newsOrder);
                        return $index !== false ? $index : 999;
                    })->values();
                }

                $tree[$key] = $children;
            }

            return $tree;
        });

        return response()->json($tree)
            ->header('Cache-Control', 'public, max-age=300');
    }
}
