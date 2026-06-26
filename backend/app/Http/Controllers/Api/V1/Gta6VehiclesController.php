<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Gta6Vehicle;
use App\Services\CacheService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class Gta6VehiclesController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/gta6/vehicles
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->get('search');
        $class  = $request->get('class');

        $cacheKey = 'gta6.vehicles.' . md5(serialize(compact('search', 'class')));

        $data = Cache::remember($cacheKey, CacheService::TTL_DAY, function () use ($search, $class) {
            $query = Gta6Vehicle::query()->where('is_published', true);

            if ($class) {
                $query->where('vehicle_class', $class);
            }

            if ($search) {
                $query->where('name', 'ilike', '%' . $search . '%');
            }

            return $query
                ->select(['id', 'slug', 'name', 'vehicle_class', 'real_equivalent', 'image', 'status'])
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get();
        });

        return $this->success($data);
    }

    /**
     * GET /api/v1/gta6/vehicles/{slug}
     */
    public function show(string $slug): JsonResponse
    {
        $data = Cache::remember("gta6.vehicle.{$slug}", CacheService::TTL_DAY, function () use ($slug) {
            return Gta6Vehicle::where('is_published', true)->where('slug', $slug)->first();
        });

        if (! $data) {
            return $this->notFound('Vehicle not found');
        }

        return $this->success($data);
    }

    /**
     * GET /api/v1/gta6/vehicles/classes — distinct classes for filters
     */
    public function classes(): JsonResponse
    {
        $data = Cache::remember('gta6.vehicles.classes', CacheService::TTL_DAY, function () {
            return Gta6Vehicle::where('is_published', true)
                ->whereNotNull('vehicle_class')
                ->distinct()
                ->orderBy('vehicle_class')
                ->pluck('vehicle_class')
                ->values();
        });

        return $this->success($data);
    }
}
