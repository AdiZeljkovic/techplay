<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AchievementService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DiscordDailyController extends Controller
{
    protected AchievementService $achievements;

    public function __construct(AchievementService $achievements)
    {
        $this->achievements = $achievements;
    }

    /**
     * Claim daily bonus XP.
     * Expects: { "discord_id": "123" }
     */
    public function claim(Request $request)
    {
        // SECURITY: Verify bot token
        $botSecret = config('services.discord.bot_secret');
        if (! $botSecret || ! hash_equals($botSecret, (string) $request->header('X-Discord-Bot-Token'))) {
            Log::warning('Discord Daily: Unauthorized request', [
                'ip' => $request->ip(),
            ]);

            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $discordId = $request->input('discord_id');

        if (! $discordId) {
            return response()->json(['message' => 'Discord ID required'], 400);
        }

        $user = User::where('discord_id', $discordId)->first();

        if (! $user) {
            return response()->json(['message' => 'User not linked'], 404);
        }

        // Check if already claimed today
        $lastClaim = $user->last_daily_claim ? Carbon::parse($user->last_daily_claim) : null;
        $now = Carbon::now();

        if ($lastClaim && $lastClaim->isToday()) {
            $hoursLeft = 24 - $now->diffInHours($lastClaim->startOfDay()->addDay());

            return response()->json([
                'already_claimed' => true,
                'hours_left' => max(1, $hoursLeft),
            ], 429);
        }

        // Calculate streak
        $streak = 1;
        if ($lastClaim && $lastClaim->isYesterday()) {
            $streak = ($user->daily_streak ?? 0) + 1;
        }

        // Calculate XP with streak bonus (max 50 bonus)
        $baseXp = 50;
        $streakBonus = min($streak * 5, 50);
        $totalXpAwarded = $baseXp + $streakBonus;

        // Update user
        $user->increment('xp', $totalXpAwarded);
        $user->update([
            'last_daily_claim' => $now,
            'daily_streak' => $streak,
        ]);

        $user->refresh();

        // Check achievements
        $this->achievements->checkXpAchievements($user);

        return response()->json([
            'already_claimed' => false,
            'xp_awarded' => $totalXpAwarded,
            'streak' => $streak,
            'total_xp' => $user->xp,
        ]);
    }
}
