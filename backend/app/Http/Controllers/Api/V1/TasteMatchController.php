<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TasteMatchService;
use App\Traits\ApiResponse;
use App\Traits\ProfilePrivacy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        $viewer = $request->user();

        if (! $viewer) {
            return $this->error('Sign in to compare libraries.', 401);
        }

        $target = User::where('username', $username)->firstOrFail();

        // The same door as every other per-user aggregate. A match score is
        // computed from a private shelf, so it is a way of reading one.
        if ($this->profileHidden($target)) {
            return $this->error('This profile is private.', 403);
        }

        return $this->success($match->between($viewer, $target));
    }
}
