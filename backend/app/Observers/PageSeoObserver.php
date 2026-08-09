<?php

namespace App\Observers;

use App\Models\PageSeo;
use App\Services\SanitizationService;
use Illuminate\Support\Facades\Cache;

class PageSeoObserver
{
    /**
     * `seo_text` is a rich-text field that the frontend renders with
     * dangerouslySetInnerHTML and nothing sanitised it — not on save, not on
     * render. Article, review and guide bodies all pass through
     * sanitizeStaffContent on their way in; this one was missed.
     *
     * It matters more than its size suggests: the block renders on
     * techplay.gg, which is where AuthContext keeps every visitor's bearer
     * token in localStorage. innerHTML does not run a <script> tag, but it
     * happily runs `<img onerror>`, and `manage content` — Journalist and up —
     * is enough to write the field.
     */
    public function saving(PageSeo $pageSeo): void
    {
        if (filled($pageSeo->seo_text)) {
            $pageSeo->seo_text = app(SanitizationService::class)
                ->sanitizeStaffContent($pageSeo->seo_text);
        }
    }

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
