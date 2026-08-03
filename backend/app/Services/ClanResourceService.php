<?php

namespace App\Services;

use App\Models\Clan;
use App\Models\ClanActivity;
use App\Models\ClanLedger;
use App\Models\ClanMember;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * The one entrance to the clan economy. Every activity hook calls award()
 * with a reason from config/clan.php; everything else — the daily cap, the
 * ledger, the balances, Clan XP and the level-up — happens here, once, the
 * same way for every source.
 *
 * Deliberately fire-and-forget at the call sites: a clan reward must never
 * break the action that earned it.
 */
class ClanResourceService
{
    public function __construct(private ClanLevelService $levels) {}

    /**
     * Award the configured amount for an activity to the actor's clan.
     * No clan, capped out, or unknown reason → quietly nothing.
     */
    public function award(User $user, string $reason): void
    {
        try {
            $rule = config("clan.earn.{$reason}");

            if (! $rule) {
                return;
            }

            $clanId = $this->clanIdFor($user);

            if (! $clanId) {
                return;
            }

            $this->credit($clanId, $user, $rule['resource'], (int) $rule['amount'], $reason);
        } catch (\Throwable $e) {
            Log::warning("ClanResourceService::award failed: {$e->getMessage()}", [
                'user_id' => $user->id,
                'reason' => $reason,
            ]);
        }
    }

    /**
     * Credit a clan directly — mission rewards and admin grants, where the
     * amount comes from the caller and no per-member cap applies.
     */
    public function grant(Clan $clan, string $resource, int $amount, string $reason, ?User $user = null): void
    {
        try {
            $this->credit($clan->id, $user, $resource, $amount, $reason, capped: false);
        } catch (\Throwable $e) {
            Log::warning("ClanResourceService::grant failed: {$e->getMessage()}", [
                'clan_id' => $clan->id,
                'reason' => $reason,
            ]);
        }
    }

    /* ── internals ────────────────────────────────────────────────────── */

    private function credit(int $clanId, ?User $user, string $resource, int $amount, string $reason, bool $capped = true): void
    {
        if ($amount <= 0) {
            return;
        }

        // The member's daily ceiling: trim the award to whatever room is
        // left today, and drop it silently once the room is gone.
        if ($capped && $user) {
            $cap = (int) config("clan.daily_caps.{$resource}", 0);
            $today = (int) ClanLedger::where('user_id', $user->id)
                ->where('resource', $resource)
                ->where('amount', '>', 0)
                ->where('created_at', '>=', now()->startOfDay())
                ->sum('amount');

            $amount = min($amount, max(0, $cap - $today));

            if ($amount <= 0) {
                return;
            }
        }

        DB::transaction(function () use ($clanId, $user, $resource, $amount, $reason) {
            $clan = Clan::whereKey($clanId)->lockForUpdate()->first();

            if (! $clan) {
                return;
            }

            $balance = (int) $clan->{$resource} + $amount;
            $xpBefore = (int) $clan->xp;
            $xpGain = $amount * (int) config("clan.xp_weights.{$resource}", 1);

            $clan->forceFill([
                $resource => $balance,
                "{$resource}_lifetime" => (int) $clan->{"{$resource}_lifetime"} + $amount,
                'xp' => $xpBefore + $xpGain,
            ]);

            // The level is derived, but stored — every list and card would
            // otherwise recompute the curve on read.
            $newLevel = $this->levels->levelForXp($xpBefore + $xpGain);
            $leveledUp = $newLevel > (int) $clan->level;
            $clan->level = $newLevel;
            $clan->save();

            ClanLedger::create([
                'clan_id' => $clanId,
                'user_id' => $user?->id,
                'resource' => $resource,
                'amount' => $amount,
                'reason' => $reason,
                'balance_after' => $balance,
            ]);

            if ($leveledUp) {
                $tier = $this->levels->tierForLevel($newLevel)['name'];

                ClanActivity::create([
                    'clan_id' => $clanId,
                    'user_id' => null,
                    'type' => 'level_up',
                    'title' => "The clan reached Level {$newLevel} — {$tier}",
                    'meta' => ['level' => $newLevel, 'tier' => $tier],
                ]);
            }
        });
    }

    /**
     * The actor's clan id, cached briefly — this runs on every comment and
     * achievement, so it must cost almost nothing.
     */
    private function clanIdFor(User $user): ?int
    {
        return Cache::remember(
            "user.clan-id.{$user->id}",
            300,
            fn () => ClanMember::where('user_id', $user->id)->value('clan_id')
        ) ?: null;
    }

    /** Call on join/leave so the 5-minute cache never misroutes an award. */
    public static function forgetClanId(int $userId): void
    {
        Cache::forget("user.clan-id.{$userId}");
    }
}
