<?php

namespace App\Policies;

use App\Models\User;

/**
 * Money, personal data, site configuration and the XP/bounty economy —
 * orders, products, support tiers, ad campaigns, the newsletter list,
 * achievements, ranks, rewards and site settings.
 *
 * No editorial permission reaches these. isAdmin() in the parent is the only
 * way in.
 */
class AdminOnlyPolicy extends PanelPolicy
{
    protected function grants(User $user): bool
    {
        return false;
    }
}
