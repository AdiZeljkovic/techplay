<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class DiscordIntegrationController extends Controller
{
    /**
     * Get user by Discord ID.
     * Used by the Discord Bot to sync roles.
     */
    public function getUser(Request $request, string $discordId)
    {
        $user = User::where('discord_id', $discordId)->first();

        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json([
            'user' => [
                'username' => $user->username,
                'name' => $user->name,
                'rank' => $user->rank?->name ?? 'Newbie',
                'xp' => $user->xp,
            ],
            'rank_id' => $user->rank_id,
        ]);
    }
}
