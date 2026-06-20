<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserSupport;
use Illuminate\Support\Facades\Cache;

/**
 * Determines whether a user has an active premium support tier.
 * Results are cached for 5 minutes to avoid repeated DB queries per request.
 */
class PremiumService
{
    public function isPremium(User $user): bool
    {
        return Cache::remember("user:{$user->id}:is_premium", 300, function () use ($user) {
            return UserSupport::where('user_id', $user->id)
                ->where('status', 'active')
                ->where(function ($q) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
                ->exists();
        });
    }

    public function tierName(User $user): ?string
    {
        return Cache::remember("user:{$user->id}:premium_tier", 300, function () use ($user) {
            return UserSupport::where('user_id', $user->id)
                ->where('status', 'active')
                ->where(function ($q) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
                ->with('tier:id,name')
                ->first()
                ?->tier
                ?->name;
        });
    }

    /**
     * Invalidate premium cache when support status changes.
     */
    public function bust(int $userId): void
    {
        Cache::forget("user:{$userId}:is_premium");
        Cache::forget("user:{$userId}:premium_tier");
    }
}
