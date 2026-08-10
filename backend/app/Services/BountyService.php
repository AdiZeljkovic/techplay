<?php

namespace App\Services;

use App\Models\BountyTransaction;
use App\Models\Season;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Bounty is the spendable on-site currency. Earned alongside XP and through
 * activity; spent in the rewards store. Every change is logged as a
 * BountyTransaction with the resulting balance for an auditable history.
 */
class BountyService
{
    /**
     * Credit bounty to a user. Returns the new balance.
     * Season bounty multiplier applies unless the caller already scaled the
     * amount (e.g. the XpService mirror, which carries the XP multiplier).
     */
    public function award(
        User $user,
        int $amount,
        string $reason,
        string $type = 'earn',
        bool $applySeason = true,
        ?string $reference = null
    ): int {
        if ($applySeason) {
            $amount = (int) round($amount * Season::multipliers()['bounty']);
        }

        if ($amount <= 0) {
            return (int) ($user->bounty_balance ?? 0);
        }

        return DB::transaction(function () use ($user, $amount, $reason, $type, $reference) {
            $fresh = User::whereKey($user->id)->lockForUpdate()->first();

            // A reference means "this can be paid once". Checked under the same
            // lock as the balance write, so two simultaneous claims cannot both
            // find it missing. Without it, any award tied to reaching a state
            // paid again every time the state was re-entered.
            if ($reference !== null) {
                $alreadyPaid = BountyTransaction::where('user_id', $fresh->id)
                    ->where('reference', $reference)
                    ->exists();

                if ($alreadyPaid) {
                    return (int) ($fresh->bounty_balance ?? 0);
                }
            }

            $balance = (int) ($fresh->bounty_balance ?? 0) + $amount;

            $fresh->bounty_balance = $balance;
            $fresh->save();
            $user->bounty_balance = $balance;

            BountyTransaction::create([
                'user_id' => $fresh->id,
                'amount' => $amount,
                'type' => $type,
                'reason' => $reason,
                'reference' => $reference,
                'balance_after' => $balance,
            ]);

            return $balance;
        });
    }

    /**
     * Has this user already been paid for this exact thing?
     *
     * The ledger is the durable record of "this happened once", so it is also
     * the right place to ask before firing the rest of a payout — the XP, the
     * quest step, the achievement check. Gating only the bounty would leave a
     * repeatable action still nudging quests forward.
     */
    public function alreadyAwarded(User $user, string $reference): bool
    {
        return BountyTransaction::where('user_id', $user->id)
            ->where('reference', $reference)
            ->exists();
    }

    /**
     * Debit bounty from a user. Throws if the balance is insufficient.
     * Returns the new balance.
     */
    public function spend(User $user, int $amount, string $reason): int
    {
        if ($amount <= 0) {
            return (int) ($user->bounty_balance ?? 0);
        }

        return DB::transaction(function () use ($user, $amount, $reason) {
            $fresh = User::whereKey($user->id)->lockForUpdate()->first();
            $current = (int) ($fresh->bounty_balance ?? 0);

            if ($current < $amount) {
                throw new \RuntimeException('Insufficient bounty balance.');
            }

            $balance = $current - $amount;
            $fresh->bounty_balance = $balance;
            $fresh->save();
            $user->bounty_balance = $balance;

            BountyTransaction::create([
                'user_id' => $fresh->id,
                'amount' => -$amount,
                'type' => 'spend',
                'reason' => $reason,
                'balance_after' => $balance,
            ]);

            return $balance;
        });
    }
}
