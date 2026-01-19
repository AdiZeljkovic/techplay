<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function show(string $slug): JsonResponse
    {
        // Try to find by slug directly
        $category = Category::where('slug', $slug)->first();

        // If not found, try stripping prefixes if they exist in frontend IDs (e.g., news-gaming)
        if (!$category) {
            // Some frontend logic sends 'news-gaming', but DB has 'gaming'.
            // Or 'gaming' is sent and DB has 'gaming'.
            // Let's support both if needed, but primarily exact match.
            return response()->json(['message' => 'Category not found'], 404);
        }

        return response()->json([
            'data' => $category
        ]);
    }
}
