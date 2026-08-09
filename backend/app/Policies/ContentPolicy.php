<?php

namespace App\Policies;

use App\Models\User;

/**
 * Editorial work, plus the databases the editorial team curates: categories,
 * media, the game catalogue and the GTA 6 wiki.
 */
class ContentPolicy extends PanelPolicy
{
    protected function grants(User $user): bool
    {
        return $user->can('manage content');
    }
}
