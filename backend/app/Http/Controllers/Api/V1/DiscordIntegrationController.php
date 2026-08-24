<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Rank;
use App\Models\User;
use App\Services\LevelService;
use App\Services\ProfileService;
use Illuminate\Http\Request;

class DiscordIntegrationController extends Controller
{
    /**
     * The ladder, so the bot can build its role map from it.
     *
     * `LinkService` carried a hardcoded map of five names — Newbie, Gamer, Pro
     * Gamer, Elite, Legend — of which two have never existed in this table and
     * two were renamed on 24.08.2026. It could assign the right role for two
     * rungs out of twenty. A map written down in a second place drifts from
     * the first; this is the first place.
     */
    public function ranks()
    {
        return response()->json([
            'ranks' => Rank::orderBy('min_xp')->get(['name', 'min_xp', 'color'])
                ->map(fn (Rank $r) => [
                    'name' => $r->name,
                    'min_xp' => (int) $r->min_xp,
                    'color' => $r->color,
                ]),
        ]);
    }

    /**
     * Everything the bot needs to draw a profile, in one call.
     *
     * It used to return four fields — username, name, rank, xp — which was the
     * whole of what a profile meant when this was a news site with a rank
     * ladder bolted on. The bot has been drawing that same card ever since,
     * while the site grew a library, hours, achievements and a player card.
     *
     * `achievements` was read by the bot's role sync and never sent by this
     * endpoint, so that loop has always been a no-op.
     */
    public function getUser(Request $request, string $discordId)
    {
        $user = User::with('rank')->where('discord_id', $discordId)->first();

        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $profile = app(ProfileService::class);
        $card = $profile->playerCard($user);
        $counts = $profile->collectionCounts($user);
        $next = $user->nextRank();

        return response()->json([
            'user' => [
                'username' => $user->username,
                'name' => $user->display_name ?: $user->name,
                'avatar_url' => $user->avatar_url,
                'rank' => $user->rank?->name ?? 'Newcomer',
                'rank_color' => $user->rank?->color,
                'rank_min_xp' => (int) ($user->rank?->min_xp ?? 0),
                'next_rank' => $next?->name,
                'next_rank_min_xp' => $next ? (int) $next->min_xp : null,
                'level' => app(LevelService::class)->forXp($user->xp),
                'xp' => (int) $user->xp,
            ],
            // The four figures the profile page leads with. Null hours mean
            // nothing was ever measured, which the bot says rather than
            // printing a zero.
            'player_card' => $card,
            'stats' => [
                'games' => $counts['games_count'],
                'completed' => $counts['completed_count'],
                'playing' => $counts['playing_count'],
                'backlog' => $counts['backlog_count'],
                'achievements' => $user->achievements()->count(),
            ],
            'profile_url' => rtrim(config('app.frontend_url'), '/').'/profile/'.$user->username,
            'rank_id' => $user->rank_id,
        ]);
    }
}
