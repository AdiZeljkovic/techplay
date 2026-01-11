<?php

namespace App\Policies;

use App\Models\News;
use App\Models\User;

class NewsPolicy
{
    /**
     * Determine whether the user can view any news.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('view admin panel') || in_array($user->role ?? '', ['admin', 'super_admin']);
    }

    /**
     * Determine whether the user can view the news.
     */
    public function view(User $user, News $news): bool
    {
        return $user->can('view admin panel') || in_array($user->role ?? '', ['admin', 'super_admin']);
    }

    /**
     * Determine whether the user can create news.
     */
    public function create(User $user): bool
    {
        return $user->can('manage content') || in_array($user->role ?? '', ['admin', 'super_admin']);
    }

    /**
     * Determine whether the user can update the news.
     */
    public function update(User $user, News $news): bool
    {
        return $user->can('manage content') || in_array($user->role ?? '', ['admin', 'super_admin']);
    }

    /**
     * Determine whether the user can delete the news.
     */
    public function delete(User $user, News $news): bool
    {
        return $user->can('delete articles') || in_array($user->role ?? '', ['admin', 'super_admin']);
    }

    /**
     * Determine whether the user can publish the news.
     */
    public function publish(User $user, News $news): bool
    {
        return $user->can('publish articles') || in_array($user->role ?? '', ['admin', 'super_admin']);
    }

    /**
     * Determine whether the user can restore the news.
     */
    public function restore(User $user, News $news): bool
    {
        return $user->can('delete articles') || in_array($user->role ?? '', ['admin', 'super_admin']);
    }

    /**
     * Determine whether the user can permanently delete the news.
     */
    public function forceDelete(User $user, News $news): bool
    {
        return $user->can('delete articles') || in_array($user->role ?? '', ['admin', 'super_admin']);
    }
}
