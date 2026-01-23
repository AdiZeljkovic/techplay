<?php

namespace App\Observers;

use App\Models\Category;
use App\Services\CacheRevalidationService;
use App\Services\CacheService;
use Illuminate\Support\Facades\Cache;

class CategoryObserver
{
    /**
     * Handle the Category "created" event.
     */
    public function created(Category $category): void
    {
        $this->invalidateNavigationCache();
    }

    /**
     * Handle the Category "updated" event.
     */
    public function updated(Category $category): void
    {
        $this->invalidateNavigationCache();
    }

    /**
     * Handle the Category "deleted" event.
     */
    public function deleted(Category $category): void
    {
        $this->invalidateNavigationCache();
    }

    /**
     * Invalidate navigation tree cache and admin dropdowns
     */
    protected function invalidateNavigationCache(): void
    {
        // Clear Laravel cache
        Cache::forget('navigation.tree');

        // Clear admin dropdown cache
        CacheService::clearAdminDropdowns();

        // Trigger Next.js revalidation
        CacheRevalidationService::revalidateNavigation();
    }
}
