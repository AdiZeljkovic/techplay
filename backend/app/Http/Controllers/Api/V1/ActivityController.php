<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityService;
use App\Traits\ApiResponse;
use App\Traits\ProfilePrivacy;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    use ApiResponse, ProfilePrivacy;

    /**
     * Public: a user's unified activity feed (paginated, optional category filter).
     * GET /users/{username}/activity?category=&page=
     */
    public function index(Request $request, string $username, ActivityService $activity)
    {
        $user = User::byUsername($username)->firstOrFail();

        if ($this->profileHidden($user)) {
            return $this->error('This profile is private.', 403);
        }

        $category = $request->query('category');
        $valid = ['forum', 'games', 'achievements', 'rewards'];
        $category = in_array($category, $valid, true) ? $category : null;

        $page = max(1, (int) $request->query('page', 1));
        $perPage = min(30, max(5, (int) $request->query('per_page', 15)));

        return $this->success($activity->feed($user, $category, $page, $perPage));
    }
}
