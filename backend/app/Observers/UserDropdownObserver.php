<?php

namespace App\Observers;

use App\Models\User;
use App\Services\CacheService;

/**
 * Keep the admin's Author lists in step with who actually writes here.
 *
 * `CacheService::clearAdminDropdowns()` carries the instruction in its own
 * docblock — *"Call this when users or roles are updated"* — and only
 * `CategoryObserver` was calling it. So the author list was cached for an hour
 * with nothing to invalidate it: add a journalist and they were missing from
 * the Author select on all four editor screens, and from the Author filter on
 * all four lists, until the hour ran out.
 *
 * Hooked on the user rather than on the role because Spatie's role events are
 * off in `config/permission.php` — and in practice a role is granted by editing
 * the user, which saves the row.
 */
class UserDropdownObserver
{
    public function saved(User $user): void
    {
        CacheService::clearAdminDropdowns();
    }

    public function deleted(User $user): void
    {
        CacheService::clearAdminDropdowns();
    }
}
