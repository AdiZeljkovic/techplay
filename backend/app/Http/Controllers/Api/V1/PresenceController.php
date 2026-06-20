<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Presence;
use App\Models\User;
use App\Services\PresenceService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PresenceController extends Controller
{
    use ApiResponse;

    public function __construct(protected PresenceService $presenceService) {}

    /**
     * GET /presence/{username} — public; current presence for a profile page.
     */
    public function show(string $username): JsonResponse
    {
        $user = User::where('username', $username)->firstOrFail();

        $presence = Presence::where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (! $presence) {
            return $this->success(null);
        }

        return $this->success([
            'game_name' => $presence->game_name,
            'game_slug' => $presence->game_slug,
            'source' => $presence->source,
            'started_at' => $presence->started_at?->toIso8601String(),
        ]);
    }

    /**
     * POST /presence — auth; manually set what you're playing.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate(['game_name' => 'required|string|max:200']);

        $presence = $this->presenceService->set(Auth::user(), $request->game_name, 'manual');

        return $this->success([
            'game_name' => $presence->game_name,
            'game_slug' => $presence->game_slug,
            'source' => $presence->source,
            'started_at' => $presence->started_at?->toIso8601String(),
        ]);
    }

    /**
     * DELETE /presence — auth; clear your presence.
     */
    public function destroy(Request $request): JsonResponse
    {
        $this->presenceService->clear(Auth::user());

        return $this->success(['message' => 'Presence cleared']);
    }
}
