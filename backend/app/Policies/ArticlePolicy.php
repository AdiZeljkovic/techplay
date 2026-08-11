<?php

namespace App\Policies;

use App\Models\Article;
use App\Models\User;

class ArticlePolicy
{
    /**
     * Determine whether the user can view any articles.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('view admin panel') || $user->isAdmin();
    }

    /**
     * Determine whether the user can view the article.
     */
    public function view(User $user, Article $article): bool
    {
        return $user->can('view admin panel') || $user->isAdmin();
    }

    /**
     * Determine whether the user can create articles.
     */
    public function create(User $user): bool
    {
        return $user->can('manage content') || $user->isAdmin();
    }

    /**
     * Determine whether the user can update the article.
     */
    public function update(User $user, Article $article): bool
    {
        return $user->can('manage content') || $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the article.
     */
    public function delete(User $user, Article $article): bool
    {
        return $user->can('delete articles') || $user->isAdmin();
    }

    /**
     * Determine whether the user can publish the article.
     */
    public function publish(User $user, Article $article): bool
    {
        return $user->can('publish articles') || $user->isAdmin();
    }

    /**
     * Determine whether the user can restore the article.
     */
    public function restore(User $user, Article $article): bool
    {
        return $user->can('delete articles') || $user->isAdmin();
    }

    /**
     * Determine whether the user can permanently delete the article.
     */
    public function forceDelete(User $user, Article $article): bool
    {
        return $user->can('delete articles') || $user->isAdmin();
    }
}
