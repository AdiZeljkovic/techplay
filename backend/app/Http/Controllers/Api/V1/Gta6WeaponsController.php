<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Gta6Weapon;
use App\Services\CacheService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class Gta6WeaponsController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/gta6/weapons
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->get('search');
        $type = $request->get('type');

        $cacheKey = 'gta6.weapons.'.md5(serialize(compact('search', 'type')));

        $data = Cache::remember($cacheKey, CacheService::TTL_DAY, function () use ($search, $type) {
            $query = Gta6Weapon::query()->where('is_published', true);

            if ($type) {
                $query->where('weapon_type', $type);
            }

            if ($search) {
                $query->where('name', 'ilike', '%'.$search.'%');
            }

            return $query
                ->select(['id', 'slug', 'name', 'weapon_type', 'image', 'status'])
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get();
        });

        return $this->success($data);
    }

    /**
     * GET /api/v1/gta6/weapons/{slug}
     */
    public function show(string $slug): JsonResponse
    {
        $data = Cache::remember("gta6.weapon.{$slug}", CacheService::TTL_DAY, function () use ($slug) {
            return Gta6Weapon::where('is_published', true)->where('slug', $slug)->first();
        });

        if (! $data) {
            return $this->notFound('Weapon not found');
        }

        return $this->success($data);
    }

    /**
     * GET /api/v1/gta6/weapons/types — distinct types for filters
     */
    public function types(): JsonResponse
    {
        $data = Cache::remember('gta6.weapons.types', CacheService::TTL_DAY, function () {
            return Gta6Weapon::where('is_published', true)
                ->whereNotNull('weapon_type')
                ->distinct()
                ->orderBy('weapon_type')
                ->pluck('weapon_type')
                ->values();
        });

        return $this->success($data);
    }
}
