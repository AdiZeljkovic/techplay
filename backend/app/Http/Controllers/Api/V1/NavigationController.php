<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class NavigationController extends Controller
{
    /**
     * Get the navigation tree structure.
     * This currently mimics a DB structure but is hardcoded for the "Ultra Modern" request.
     * In future phases, this can be moved to a Categories table with parent_id.
     */
    public function index(): JsonResponse
    {
        // Fetch all generic categories (excluding forum categories if they are different model/table)
        // We use 'type' to distinguish roots.

        $roots = \App\Models\Category::whereNull('parent_id')->with('children')->get();

        $tree = [];

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

            $tree[$key] = $children;
        }

        return response()->json($tree);
    }
}
