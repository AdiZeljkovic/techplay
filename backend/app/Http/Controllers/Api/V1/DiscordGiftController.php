<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DiscordGiftController extends Controller
{
    private const MIN_GIFT_AMOUNT = 10;
    private const MAX_GIFT_AMOUNT = 1000;

    /**
     * Gift XP from one user to another.
     */
    public function gift(Request $request)
    {
        // Verify bot token
        $botSecret = config('services.discord.bot_secret');
        if (!$botSecret || $request->header('X-Discord-Bot-Token') !== $botSecret) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $senderDiscordId = $request->input('sender_discord_id');
        $receiverDiscordId = $request->input('receiver_discord_id');
        $amount = (int) $request->input('amount');

        // Validate input
        if (!$senderDiscordId || !$receiverDiscordId || $amount < self::MIN_GIFT_AMOUNT) {
            return response()->json(['message' => 'Invalid data'], 400);
        }

        if ($amount > self::MAX_GIFT_AMOUNT) {
            return response()->json(['message' => 'Maximum gift amount is ' . self::MAX_GIFT_AMOUNT . ' XP'], 400);
        }

        // Can't gift to yourself
        if ($senderDiscordId === $receiverDiscordId) {
            return response()->json(['message' => "You can't gift XP to yourself"], 400);
        }

        $sender = User::where('discord_id', $senderDiscordId)->first();
        $receiver = User::where('discord_id', $receiverDiscordId)->first();

        if (!$sender) {
            return response()->json(['message' => 'Your account is not linked'], 404);
        }

        if (!$receiver) {
            return response()->json(['message' => 'Recipient account is not linked'], 404);
        }

        // Check if sender has enough XP
        if ($sender->xp < $amount) {
            return response()->json(['message' => "You don't have enough XP. You have {$sender->xp} XP"], 400);
        }

        // Perform the transfer in a transaction
        try {
            DB::transaction(function () use ($sender, $receiver, $amount) {
                $sender->decrement('xp', $amount);
                $receiver->increment('xp', $amount);
            });

            $sender->refresh();
            $receiver->refresh();

            Log::info('XP Gift', [
                'sender' => $sender->username,
                'receiver' => $receiver->username,
                'amount' => $amount
            ]);

            return response()->json([
                'message' => 'Gift successful',
                'sender_new_xp' => $sender->xp,
                'receiver_new_xp' => $receiver->xp
            ]);
        } catch (\Exception $e) {
            Log::error('XP Gift failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Gift failed'], 500);
        }
    }
}
