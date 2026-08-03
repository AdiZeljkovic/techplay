<?php

namespace App\Traits;

use App\Models\User;
use App\Services\ProfileService;
use Illuminate\Support\Facades\Auth;

/**
 * Every per-user aggregate endpoint (collection, lists, activity, stats,
 * achievements) has to answer the same question the profile page does:
 * may this viewer see it? Gating only the profile payload would leave the
 * data one curl away.
 */
trait ProfilePrivacy
{
    protected function profileHidden(User $user): bool
    {
        return ! app(ProfileService::class)->canViewProfile($user, $this->viewer());
    }

    /**
     * These endpoints are public routes, so the default (web) guard sees
     * nobody — a bearer token only resolves through the sanctum guard. Reading
     * Auth::user() here would have made every visitor anonymous, locking a
     * friend, and the owner, out of a friends-only profile.
     */
    protected function viewer(): ?User
    {
        return Auth::guard('sanctum')->user() ?? Auth::user();
    }
}
