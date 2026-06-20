<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function show(string $slug): JsonResponse
    {
        // 1. Try exact match
        $category = Category::where('slug', $slug)->first();

        // 2. If not found, try common prefixes (frontend might send 'gaming' but DB has 'news-gaming')
        if (! $category) {
            $prefixes = ['news-', 'reviews-', 'tech-', 'hardware-'];
            foreach ($prefixes as $prefix) {
                $category = Category::where('slug', $prefix.$slug)->first();
                if ($category) {
                    break;
                }
            }
        }

        // 3. If still not found
        if (! $category) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        return response()->json([
            'data' => $category,
        ]);
    }
}
