<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\GamerDnaService;
use App\Traits\ApiResponse;
use App\Traits\ProfilePrivacy;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class GamerDnaController extends Controller
{
    use ApiResponse, ProfilePrivacy;

    /**
     * GET /users/{username}/gamer-dna
     *
     * The whole read is a fan-out over the collection, so it is cached for
     * fifteen minutes. Taste doesn't move faster than that.
     */
    public function show(string $username, GamerDnaService $dna): JsonResponse
    {
        $user = User::where('username', $username)->firstOrFail();

        if ($this->profileHidden($user)) {
            return $this->error('This profile is private.', 403);
        }

        // The version in the key is the payload's shape, not the endpoint's.
        // It stayed at v1 through a shape change once, and every reader with a
        // warm cache got a fifteen-minute window of an object missing the
        // fields the page had just been rebuilt around. Bump it whenever
        // GamerDnaService::build gains or loses a key.
        $payload = Cache::remember(
            "gamer-dna.{$user->id}.v2",
            900,
            fn () => $dna->build($user)
        );

        return $this->success($payload);
    }
}
