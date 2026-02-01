<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DiscordSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DiscordSubscriptionController extends Controller
{
    /**
     * Get all subscriptions (for bot to load on startup).
     */
    public function index(Request $request)
    {
        // Verify bot token
        if (!$this->verifyBotToken($request)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $subscriptions = DiscordSubscription::all(['discord_id', 'type']);

        return response()->json([
            'data' => $subscriptions
        ]);
    }

    /**
     * Subscribe to notifications.
     */
    public function subscribe(Request $request)
    {
        if (!$this->verifyBotToken($request)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $discordId = $request->input('discord_id');
        $type = $request->input('type');

        if (!$discordId || !in_array($type, ['news', 'giveaway'])) {
            return response()->json(['message' => 'Invalid data'], 400);
        }

        // Create or update subscription
        DiscordSubscription::updateOrCreate(
            ['discord_id' => $discordId, 'type' => $type],
            ['subscribed_at' => now()]
        );

        return response()->json(['message' => 'Subscribed']);
    }

    /**
     * Unsubscribe from notifications.
     */
    public function unsubscribe(Request $request)
    {
        if (!$this->verifyBotToken($request)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $discordId = $request->input('discord_id');
        $type = $request->input('type');

        DiscordSubscription::where('discord_id', $discordId)
            ->where('type', $type)
            ->delete();

        return response()->json(['message' => 'Unsubscribed']);
    }

    private function verifyBotToken(Request $request): bool
    {
        $botSecret = config('services.discord.bot_secret');
        return $botSecret && $request->header('X-Discord-Bot-Token') === $botSecret;
    }
}
