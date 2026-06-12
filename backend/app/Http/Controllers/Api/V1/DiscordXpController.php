<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Rank;
use App\Models\User;
use App\Services\AchievementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DiscordXpController extends Controller
{
    protected AchievementService $achievements;

    public function __construct(AchievementService $achievements)
    {
        $this->achievements = $achievements;
    }

    /**
     * Handle XP updates from Discord Bot.
     * Expects: { "discord_id": "123", "xp": 15, "username": "optional_fallback" }
     */
    public function addXp(Request $request)
    {
        // SECURITY: Verify bot token - REQUIRED for production
        $botSecret = config('services.discord.bot_secret');
        if (! $botSecret || ! hash_equals($botSecret, (string) $request->header('X-Discord-Bot-Token'))) {
            Log::warning('Discord XP: Unauthorized request', [
                'ip' => $request->ip(),
                'discord_id' => $request->input('discord_id'),
            ]);

            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $discordId = $request->input('discord_id');
        $xpAmount = (int) $request->input('xp', 0);

        // Validate: discord_id required, xp must be positive and reasonable (max 100 per request)
        if (! $discordId || $xpAmount <= 0 || $xpAmount > 100) {
            return response()->json(['message' => 'Invalid data'], 400);
        }

        $user = User::where('discord_id', $discordId)->first();

        if (! $user) {
            return response()->json(['message' => 'User not linked'], 404);
        }

        // Add XP
        $oldXp = $user->xp;
        $user->increment('xp', $xpAmount);
        $user->refresh(); // Refresh to get updated xp value

        // Check for Rank Up
        $newRank = Rank::where('min_xp', '<=', $user->xp)
            ->orderBy('min_xp', 'desc')
            ->first();

        $rankUp = false;
        if ($newRank && $newRank->id !== $user->rank_id) {
            $user->update(['rank_id' => $newRank->id]);
            $rankUp = true;
        }

        // Check for XP-based achievements
        $unlockedAchievements = $this->achievements->checkXpAchievements($user);

        return response()->json([
            'message' => 'XP Added',
            'new_xp' => $user->xp,
            'rank_up' => $rankUp,
            'new_rank' => $rankUp ? $newRank->name : null,
            'achievements_unlocked' => array_map(fn ($a) => [
                'name' => $a->name,
                'description' => $a->description,
                'icon' => $a->icon_path,
            ], $unlockedAchievements),
        ]);
    }
}
