<?php

namespace App\Policies;

use App\Models\User;

/**
 * User records, governed by the `manage users` permission.
 *
 * A separate tier rather than admin-only, because the seeder deliberately
 * grants `manage users` to Editor-in-Chief — folding it into the admin tier
 * would have quietly revoked something the role was designed to have.
 * UserResource::canAccess() checks the same permission, so the resource gate
 * and the model policy now agree instead of each having an opinion.
 */
class UserManagementPolicy extends PanelPolicy
{
    protected function grants(User $user): bool
    {
        return $user->can('manage users');
    }
}
