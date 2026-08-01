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
        return ! app(ProfileService::class)->canViewProfile($user, Auth::user());
    }
}
