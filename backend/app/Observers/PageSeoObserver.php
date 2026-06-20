<?php

namespace App\Observers;

use App\Models\PageSeo;
use Illuminate\Support\Facades\Cache;

class PageSeoObserver
{
    /**
     * Handle the PageSeo "created" event.
     */
    public function created(PageSeo $pageSeo): void
    {
        $this->invalidateCache($pageSeo);
    }

    /**
     * Handle the PageSeo "updated" event.
     */
    public function updated(PageSeo $pageSeo): void
    {
        $this->invalidateCache($pageSeo);
    }

    /**
     * Handle the PageSeo "deleted" event.
     */
    public function deleted(PageSeo $pageSeo): void
    {
        $this->invalidateCache($pageSeo);
    }

    /**
     * Invalidate page SEO cache
     */
    protected function invalidateCache(PageSeo $pageSeo): void
    {
        // Clear all page SEO cache
        Cache::forget('page_seo.all');

        // Clear specific page cache
        $cacheKey = 'page_seo.path.'.md5($pageSeo->page_path);
        Cache::forget($cacheKey);
    }
}
