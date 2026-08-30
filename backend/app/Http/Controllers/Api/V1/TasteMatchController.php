<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TasteMatchService;
use App\Traits\ApiResponse;
use App\Traits\ProfilePrivacy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TasteMatchController extends Controller
{
    use ApiResponse, ProfilePrivacy;

    /**
     * GET /users/{username}/taste-match — how much you two overlap.
     *
     * Signed-in only, and not for gatekeeping: a comparison needs two
     * libraries, and an anonymous reader has not brought one.
     */
    public function show(Request $request, string $username, TasteMatchService $match): JsonResponse
    {
        // Public route — only the sanctum guard sees a bearer token. The
        // default guard here is `web`, so a bare $request->user() came back
        // null for every signed-in reader too, and this endpoint answered 401
        // to everyone who has ever opened somebody else's profile. Measured
        // 22 Aug 2026 with a valid token; the leaderboard and the profile
        // payload had already learned this and carry the same two lines.
        $viewer = Auth::guard('sanctum')->user() ?? Auth::user();

        if (! $viewer) {
            return $this->error('Sign in to compare libraries.', 401);
        }

        $target = User::byUsername($username)->firstOrFail();

        // The same door as every other per-user aggregate. A match score is
        // computed from a private shelf, so it is a way of reading one.
        if ($this->profileHidden($target)) {
            return $this->error('This profile is private.', 403);
        }

        return $this->success($match->between($viewer, $target));
    }
}
