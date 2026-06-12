<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AchievementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class DiscordAdminController extends Controller
{
    protected AchievementService $achievements;

    public function __construct(AchievementService $achievements)
    {
        $this->achievements = $achievements;
    }

    /**
     * Admin: Give XP to a user.
     */
    public function giveXp(Request $request)
    {
        if (! $this->verifyBotToken($request)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $discordId = $request->input('discord_id');
        $amount = (int) $request->input('amount');

        if (! $discordId || $amount <= 0) {
            return response()->json(['message' => 'Invalid data'], 400);
        }

        $user = User::where('discord_id', $discordId)->first();

        if (! $user) {
            return response()->json(['message' => 'User not linked'], 404);
        }

        $user->increment('xp', $amount);
        $user->refresh();

        // Check achievements
        $this->achievements->checkXpAchievements($user);

        Log::info('Admin XP Give', [
            'user' => $user->username,
            'amount' => $amount,
            'new_total' => $user->xp,
        ]);

        return response()->json([
            'message' => 'XP granted',
            'new_xp' => $user->xp,
        ]);
    }

    /**
     * Admin: Remove XP from a user.
     */
    public function removeXp(Request $request)
    {
        if (! $this->verifyBotToken($request)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $discordId = $request->input('discord_id');
        $amount = (int) $request->input('amount');

        if (! $discordId || $amount <= 0) {
            return response()->json(['message' => 'Invalid data'], 400);
        }

        $user = User::where('discord_id', $discordId)->first();

        if (! $user) {
            return response()->json(['message' => 'User not linked'], 404);
        }

        // Don't go below 0
        $actualRemoval = min($amount, $user->xp);
        $user->decrement('xp', $actualRemoval);
        $user->refresh();

        Log::info('Admin XP Remove', [
            'user' => $user->username,
            'amount' => $actualRemoval,
            'new_total' => $user->xp,
        ]);

        return response()->json([
            'message' => 'XP removed',
            'new_xp' => $user->xp,
        ]);
    }

    /**
     * Admin: Start a special event (e.g., Double XP).
     */
    public function startEvent(Request $request)
    {
        if (! $this->verifyBotToken($request)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $name = $request->input('name');
        $durationHours = (int) $request->input('duration_hours');

        if (! $name || $durationHours <= 0) {
            return response()->json(['message' => 'Invalid data'], 400);
        }

        $endsAt = now()->addHours($durationHours);

        // Store event in cache (or database if you create a model)
        Cache::put('discord_event', [
            'name' => $name,
            'starts_at' => now()->toIso8601String(),
            'ends_at' => $endsAt->toIso8601String(),
            'multiplier' => $this->getEventMultiplier($name),
        ], $endsAt);

        Log::info('Discord Event Started', [
            'name' => $name,
            'duration_hours' => $durationHours,
            'ends_at' => $endsAt->toIso8601String(),
        ]);

        return response()->json([
            'message' => 'Event started',
            'event' => [
                'name' => $name,
                'ends_at' => $endsAt->toIso8601String(),
            ],
        ]);
    }

    /**
     * Get current active event (if any).
     */
    public function getActiveEvent(Request $request)
    {
        $event = Cache::get('discord_event');

        if (! $event) {
            return response()->json(['event' => null]);
        }

        return response()->json(['event' => $event]);
    }

    /**
     * Get XP multiplier for event type.
     */
    private function getEventMultiplier(string $eventName): float
    {
        $lowerName = strtolower($eventName);

        if (str_contains($lowerName, 'double')) {
            return 2.0;
        }
        if (str_contains($lowerName, 'triple')) {
            return 3.0;
        }
        if (str_contains($lowerName, '1.5') || str_contains($lowerName, 'bonus')) {
            return 1.5;
        }

        return 1.0;
    }

    private function verifyBotToken(Request $request): bool
    {
        $botSecret = config('services.discord.bot_secret');

        return $botSecret && hash_equals($botSecret, (string) $request->header('X-Discord-Bot-Token'));
    }
}
