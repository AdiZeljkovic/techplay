<?php

namespace App\Services;

use App\Models\RawgApiKey;
use Illuminate\Support\Facades\DB;

class ApiKeyManager
{
    /**
     * Atomically grab the key with the fewest calls used and increment its counter.
     * Uses SELECT FOR UPDATE to prevent race conditions between parallel workers.
     * Returns null when ALL keys have hit their limit — jobs will retry automatically.
     */
    public function useKey(): ?RawgApiKey
    {
        return DB::transaction(function () {
            $key = RawgApiKey::where('is_active', true)
                ->whereColumn('calls_used', '<', 'calls_limit')
                ->orderBy('calls_used')
                ->lockForUpdate()
                ->first();

            if (! $key) {
                return null;
            }

            $key->increment('calls_used');

            return $key;
        });
    }

    /**
     * Reset all counters at the start of a new month.
     */
    public function resetMonthlyCounters(): void
    {
        RawgApiKey::query()->update([
            'calls_used' => 0,
            'is_active'  => true,
            'reset_at'   => now(),
        ]);
    }

    /**
     * Aggregated stats across all keys.
     */
    public function getStats(): array
    {
        $row = RawgApiKey::selectRaw("
            COUNT(*)                                             AS total_keys,
            COALESCE(SUM(calls_used), 0)                        AS total_used,
            COALESCE(SUM(calls_limit - calls_used), 0)          AS total_remaining,
            SUM(CASE WHEN is_active THEN 1 ELSE 0 END)          AS active_keys
        ")->first();

        return $row ? $row->toArray() : [
            'total_keys'      => 0,
            'total_used'      => 0,
            'total_remaining' => 0,
            'active_keys'     => 0,
        ];
    }
}
