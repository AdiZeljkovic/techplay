<?php

namespace App\Policies;

use App\Models\Review;
use App\Models\User;

class ReviewPolicy
{
    /**
     * Determine whether the user can view any reviews.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('view admin panel') || in_array($user->role ?? '', ['admin', 'super_admin']);
    }

    /**
     * Determine whether the user can view the review.
     */
    public function view(User $user, Review $review): bool
    {
        return $user->can('view admin panel') || in_array($user->role ?? '', ['admin', 'super_admin']);
    }

    /**
     * Determine whether the user can create reviews.
     */
    public function create(User $user): bool
    {
        return $user->can('manage content') || in_array($user->role ?? '', ['admin', 'super_admin']);
    }

    /**
     * Determine whether the user can update the review.
     */
    public function update(User $user, Review $review): bool
    {
        return $user->can('manage content') || in_array($user->role ?? '', ['admin', 'super_admin']);
    }

    /**
     * Determine whether the user can delete the review.
     */
    public function delete(User $user, Review $review): bool
    {
        return $user->can('delete articles') || in_array($user->role ?? '', ['admin', 'super_admin']);
    }

    /**
     * Determine whether the user can publish the review.
     */
    public function publish(User $user, Review $review): bool
    {
        return $user->can('publish articles') || in_array($user->role ?? '', ['admin', 'super_admin']);
    }

    /**
     * Determine whether the user can restore the review.
     */
    public function restore(User $user, Review $review): bool
    {
        return $user->can('delete articles') || in_array($user->role ?? '', ['admin', 'super_admin']);
    }

    /**
     * Determine whether the user can permanently delete the review.
     */
    public function forceDelete(User $user, Review $review): bool
    {
        return $user->can('delete articles') || in_array($user->role ?? '', ['admin', 'super_admin']);
    }
}
