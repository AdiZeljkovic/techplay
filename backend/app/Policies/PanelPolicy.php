<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/**
 * Shared behaviour for the three admin-panel authorization tiers.
 *
 * Filament allows everything when a model has no policy, and 30 of the 35
 * resources had none. Since Moderator and Journalist both carry
 * `view admin panel`, a moderator — whose only intended power is moderating
 * the forum — could open Orders and read customers' addresses, edit product
 * prices, flip maintenance mode, or bulk-delete the 187k-row game catalogue.
 * Nothing refused; the navigation simply happened to be long.
 *
 * The subclasses map onto permissions that already exist in
 * RolesAndPermissionsSeeder, so no new vocabulary is introduced.
 */
abstract class PanelPolicy
{
    /**
     * Deleting these is disproportionate to any editorial task: the catalogue
     * took months to assemble and the bulk-delete button sits one checkbox
     * away from all of it.
     */
    protected const DELETE_IS_ADMIN_ONLY = [
        \App\Models\Game::class,
        \App\Models\GameRating::class,
    ];

    /** Does this tier admit the user at all? Admins bypass it entirely. */
    abstract protected function grants(User $user): bool;

    public function viewAny(User $user): bool
    {
        return $this->allows($user);
    }

    public function view(User $user, Model $record): bool
    {
        return $this->allows($user);
    }

    public function create(User $user): bool
    {
        return $this->allows($user);
    }

    public function update(User $user, Model $record): bool
    {
        return $this->allows($user);
    }

    public function delete(User $user, Model $record): bool
    {
        if (in_array($record::class, static::DELETE_IS_ADMIN_ONLY, true)) {
            return $this->isAdmin($user);
        }

        return $this->allows($user);
    }

    /**
     * Bulk delete — the most destructive control in the panel, and nothing in
     * an editorial or moderation workflow needs it.
     */
    public function deleteAny(User $user): bool
    {
        return $this->isAdmin($user);
    }

    public function restore(User $user, Model $record): bool
    {
        return $this->allows($user);
    }

    public function forceDelete(User $user, Model $record): bool
    {
        return $this->isAdmin($user);
    }

    protected function allows(User $user): bool
    {
        return $this->isAdmin($user) || $this->grants($user);
    }

    /** Delegates to the model, which is where "who is staff" now lives. */
    protected function isAdmin(User $user): bool
    {
        return $user->isAdmin();
    }
}
