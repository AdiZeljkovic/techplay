<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ClanResourceService;
use App\Services\StreakService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StreakController extends Controller
{
    use ApiResponse;

    public function __construct(protected StreakService $streakService) {}

    /**
     * GET /user/streak — current streak info for the authenticated user.
     */
    public function show(Request $request): JsonResponse
    {
        return $this->success($this->streakService->info($request->user()));
    }

    /**
     * POST /user/streak/claim — claim today's streak reward.
     */
    public function claim(Request $request): JsonResponse
    {
        $result = $this->streakService->claim($request->user());

        if ($result === null) {
            return $this->success(
                $this->streakService->info($request->user()),
                'Already claimed today'
            );
        }

        try {
            app(ClanResourceService::class)->award($request->user(), 'daily_login');
        } catch (\Throwable) {
        }

        return $this->success($result, "Day {$result['streak']} streak! +{$result['bounty_earned']} bounty");
    }
}
