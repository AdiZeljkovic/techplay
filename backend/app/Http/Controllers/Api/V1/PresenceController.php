<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ConnectedAccount;
use App\Models\Presence;
use App\Models\User;
use App\Services\PresenceService;
use App\Traits\ApiResponse;
use App\Traits\ProfilePrivacy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PresenceController extends Controller
{
    use ApiResponse, ProfilePrivacy;

    public function __construct(protected PresenceService $presenceService) {}

    /**
     * GET /presence/{username} — public; current presence for a profile page.
     */
    public function show(string $username): JsonResponse
    {
        $user = User::where('username', $username)->firstOrFail();

        // Ten other per-user endpoints run this check; presence was the one
        // left out. With `started_at` in the payload, polling it reconstructs a
        // private profile's daily play schedule with no account at all.
        // Null, not 403 — a refusal would confirm the account is private.
        if ($this->profileHidden($user)) {
            return $this->success(null);
        }

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

    /**
     * POST /discord/presence — Discord bot reports game activity via Rich Presence.
     * Uses the bot's shared secret, not Sanctum.
     */
    public function discordUpdate(Request $request): JsonResponse
    {
        $request->validate([
            'discord_id' => 'required|string',
            'game_name' => 'nullable|string|max:200',
        ]);

        // Resolve Discord ID → TechPlay user via connected_accounts or discord_id column.
        $user = User::where('discord_id', $request->discord_id)->first()
            ?? ConnectedAccount::where('provider', 'discord')
                ->where('provider_user_id', $request->discord_id)
                ->first()
                ?->user;

        if (! $user) {
            return $this->success(['message' => 'User not found — skipped']);
        }

        if ($request->filled('game_name')) {
            $this->presenceService->set($user, $request->game_name, 'discord');
        } else {
            $active = $this->presenceService->getActive($user);
            if ($active && $active->source === 'discord') {
                $this->presenceService->clear($user);
            }
        }

        return $this->success(['message' => 'ok']);
    }
}
