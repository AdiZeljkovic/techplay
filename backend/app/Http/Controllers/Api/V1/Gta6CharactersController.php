<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Gta6Character;
use App\Services\CacheService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class Gta6CharactersController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/gta6/characters
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->get('search');
        $role = $request->get('role');

        $cacheKey = 'gta6.characters.'.md5(serialize(compact('search', 'role')));

        $data = Cache::remember($cacheKey, CacheService::TTL_DAY, function () use ($search, $role) {
            $query = Gta6Character::query()->where('is_published', true);

            if ($role) {
                $query->where('role', $role);
            }

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'ilike', '%'.$search.'%')
                        ->orWhere('alias', 'ilike', '%'.$search.'%');
                });
            }

            return $query
                ->select(['id', 'slug', 'name', 'alias', 'role', 'image', 'status'])
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get();
        });

        return $this->success($data);
    }

    /**
     * GET /api/v1/gta6/characters/{slug}
     */
    public function show(string $slug): JsonResponse
    {
        $data = Cache::remember("gta6.character.{$slug}", CacheService::TTL_DAY, function () use ($slug) {
            return Gta6Character::where('is_published', true)->where('slug', $slug)->first();
        });

        if (! $data) {
            return $this->notFound('Character not found');
        }

        return $this->success($data);
    }
}
