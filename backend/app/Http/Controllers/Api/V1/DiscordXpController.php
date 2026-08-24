<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\XpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DiscordXpController extends Controller
{
    public function __construct(protected XpService $xp) {}

    /**
     * XP earned by talking in the Discord server.
     *
     * This used to be its own little economy. It incremented `users.xp`
     * directly — past `XpService`, and therefore past the site's 100-a-day
     * cap, past the season multiplier, past the reward ledger. The only limit
     * was 100 per request, and the bot pays 15 a message on a 60-second
     * cooldown: 900 an hour, 21,600 a day if somebody keeps talking. Against
     * a comment on the site worth 10 and a finished game worth 15, chat
     * outpaid everything else on the platform by two orders of magnitude —
     * and XP is the one ladder the profile now measures standing by.
     *
     * So it goes through the same door as every other award. The cap, the
     * multiplier, the rank check and the achievement check are all one
     * implementation now, and Discord is simply another action type.
     */
    public function addXp(Request $request)
    {
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

        if (! $discordId || $xpAmount <= 0 || $xpAmount > XpService::XP_DISCORD_MESSAGE) {
            return response()->json(['message' => 'Invalid data'], 400);
        }

        $user = User::where('discord_id', $discordId)->first();

        if (! $user) {
            return response()->json(['message' => 'User not linked'], 404);
        }

        $before = (int) $user->xp;
        $beforeRank = $user->rank_id;

        $this->xp->awardXp($user, $xpAmount, 'discord_message');

        $user->refresh();

        $awarded = (int) $user->xp - $before;
        $rankUp = $user->rank_id !== $beforeRank;

        return response()->json([
            'message' => $awarded > 0 ? 'XP Added' : 'Daily cap reached',
            // What actually landed, not what was asked for — the cap and the
            // season multiplier both move it, and the bot announces this
            // number to a channel.
            'xp_awarded' => $awarded,
            'new_xp' => (int) $user->xp,
            'rank_up' => $rankUp,
            'new_rank' => $rankUp ? $user->fresh('rank')->rank?->name : null,
            // Achievements are checked inside awardXp now; the bot reads them
            // from the profile rather than from this reply.
            'achievements_unlocked' => [],
        ]);
    }
}
