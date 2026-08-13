<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AchievementService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Who is actually in the TechPlay Discord.
 *
 * The bot is the only thing that can answer this, and until now it never told
 * us. Two ways in: single events as they happen (someone joins, someone
 * leaves), and a full roster on startup so a missed event cannot leave the flag
 * wrong forever.
 *
 * Both routes sit behind the `discord.bot` middleware — this is the bot's word
 * about its own guild, and nobody else's.
 */
class DiscordMembershipController extends Controller
{
    use ApiResponse;

    /**
     * POST /discord/membership — one member joined or left.
     */
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'discord_id' => 'required|string|max:40',
            'in_guild' => 'required|boolean',
            'joined_at' => 'nullable|date',
        ]);

        $user = User::where('discord_id', $data['discord_id'])->first();

        // Plenty of guild members have no TechPlay account. That is not an
        // error and it must not read like one in the bot's logs.
        if (! $user) {
            return $this->success(['linked' => false]);
        }

        $this->apply($user, $data['in_guild'], $data['joined_at'] ?? null);

        return $this->success(['linked' => true, 'in_guild' => $data['in_guild']]);
    }

    /**
     * POST /discord/membership/sync — the whole roster, in one call.
     *
     * Everyone on the list is in; every linked account that is not on it is
     * out. This is what repairs the flag after the bot has been offline for a
     * weekend and missed the joins and leaves that happened meanwhile.
     */
    public function sync(Request $request): JsonResponse
    {
        $data = $request->validate([
            'discord_ids' => 'required|array|max:50000',
            'discord_ids.*' => 'string|max:40',
        ]);

        $ids = array_values(array_unique($data['discord_ids']));

        // An empty roster almost certainly means the bot failed to fetch rather
        // than that the server emptied overnight, and acting on it would mark
        // every member as gone.
        if ($ids === []) {
            return $this->error('Refusing to sync an empty roster.', 422);
        }

        $joined = User::whereNotNull('discord_id')
            ->whereIn('discord_id', $ids)
            ->where('discord_guild_member', false)
            ->pluck('id');

        User::whereNotNull('discord_id')->whereIn('discord_id', $ids)->update([
            'discord_guild_member' => true,
            'discord_guild_checked_at' => now(),
        ]);

        // First time we have seen them inside — the bot's roster carries no
        // join date, so this is the day we learned, not the day they arrived.
        User::whereIn('id', $joined)->whereNull('discord_guild_joined_at')->update([
            'discord_guild_joined_at' => now(),
        ]);

        $left = User::whereNotNull('discord_id')
            ->whereNotIn('discord_id', $ids)
            ->where('discord_guild_member', true)
            ->update([
                'discord_guild_member' => false,
                'discord_guild_checked_at' => now(),
            ]);

        foreach (User::whereIn('id', $joined)->cursor() as $user) {
            $this->award($user);
        }

        return $this->success([
            'roster' => count($ids),
            'newly_in' => $joined->count(),
            'newly_out' => $left,
        ]);
    }

    /* ── the write ────────────────────────────────────────────────────── */

    private function apply(User $user, bool $inGuild, ?string $joinedAt): void
    {
        $user->forceFill([
            'discord_guild_member' => $inGuild,
            'discord_guild_checked_at' => now(),
        ]);

        if ($inGuild && ! $user->discord_guild_joined_at) {
            $user->discord_guild_joined_at = $joinedAt ? now()->parse($joinedAt) : now();
        }

        $user->save();

        if ($inGuild) {
            $this->award($user);
        }
    }

    private function award(User $user): void
    {
        try {
            app(AchievementService::class)->check($user, ['discord']);
        } catch (\Throwable) {
            // An achievement that fails to grant is not a reason to lose the
            // membership fact we just recorded.
        }
    }
}
