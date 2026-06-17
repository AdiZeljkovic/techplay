<?php

namespace App\Services;

use App\Models\BountyTransaction;
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
     */
    public function award(User $user, int $amount, string $reason, string $type = 'earn'): int
    {
        if ($amount <= 0) {
            return (int) ($user->bounty_balance ?? 0);
        }

        return DB::transaction(function () use ($user, $amount, $reason, $type) {
            $fresh = User::whereKey($user->id)->lockForUpdate()->first();
            $balance = (int) ($fresh->bounty_balance ?? 0) + $amount;

            $fresh->bounty_balance = $balance;
            $fresh->save();
            $user->bounty_balance = $balance;

            BountyTransaction::create([
                'user_id' => $fresh->id,
                'amount' => $amount,
                'type' => $type,
                'reason' => $reason,
                'balance_after' => $balance,
            ]);

            return $balance;
        });
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
