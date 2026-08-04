<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\WrappedService;
use App\Traits\ApiResponse;
use App\Traits\ProfilePrivacy;
use Illuminate\Http\JsonResponse;

class WrappedController extends Controller
{
    use ApiResponse, ProfilePrivacy;

    /**
     * GET /users/{username}/wrapped/{year} — Year-in-Review stats.
     */
    public function show(string $username, int $year, WrappedService $wrapped): JsonResponse
    {
        $user = User::where('username', $username)->firstOrFail();

        if ($this->profileHidden($user)) {
            return $this->error('This profile is private.', 403);
        }

        // Only years the site could have recorded, and never the future.
        $year = max(2024, min($year, (int) now()->year));

        return $this->success($wrapped->build($user, $year));
    }
}
