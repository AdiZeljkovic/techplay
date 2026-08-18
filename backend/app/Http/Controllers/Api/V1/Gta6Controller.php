<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\GtaLocation;
use App\Services\CacheService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class Gta6Controller extends Controller
{
    use ApiResponse;

    // Categories that are source/status metadata, not display categories
    private const META_TAGS = ['2022', 'unconfirmed', 'may-not-exist', 'reused', 'address-ambiguous'];

    /**
     * GET /api/v1/gta6/locations
     * Returns all GTA VI locations, optionally filtered.
     */
    public function locations(Request $request): JsonResponse
    {
        $category = $request->input('category');
        $search = $request->input('search');
        $confirmed = $request->boolean('confirmed');

        $cacheKey = 'gta6.locations.'.md5(serialize(compact('category', 'search', 'confirmed')));

        $data = Cache::remember($cacheKey, CacheService::TTL_DAY, function () use ($category, $search, $confirmed) {
            $query = GtaLocation::whereNotNull('lat')->whereNotNull('lng');

            if ($category) {
                $query->whereJsonContains('categories', $category);
            }

            if ($confirmed) {
                $query->where('is_unconfirmed', false);
            }

            if ($search) {
                $query->where('name', 'ilike', '%'.$search.'%');
            }

            return $query
                ->select(['id', 'gtadb_key', 'name', 'lat', 'lng', 'game_x', 'game_y', 'real_address', 'categories', 'is_unconfirmed'])
                ->orderBy('name')
                ->get();
        });

        return $this->success($data);
    }

    /**
     * GET /api/v1/gta6/categories
     * Returns all unique display categories (excludes meta-tags).
     */
    public function categories(): JsonResponse
    {
        $data = Cache::remember('gta6.categories', CacheService::TTL_DAY, function () {
            return GtaLocation::pluck('categories')
                ->flatten()
                ->unique()
                ->diff(self::META_TAGS)
                ->sort()
                ->values();
        });

        return $this->success($data);
    }
}
