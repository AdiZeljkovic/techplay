<?php

namespace App\Observers;

use App\Models\SiteSetting;
use Illuminate\Support\Facades\Cache;

class SiteSettingObserver
{
    /**
     * Handle the SiteSetting "created" event.
     */
    public function created(SiteSetting $siteSetting): void
    {
        $this->invalidateCache();
    }

    /**
     * Handle the SiteSetting "updated" event.
     */
    public function updated(SiteSetting $siteSetting): void
    {
        $this->invalidateCache();
    }

    /**
     * Handle the SiteSetting "deleted" event.
     */
    public function deleted(SiteSetting $siteSetting): void
    {
        $this->invalidateCache();
    }

    /**
     * Invalidate settings cache
     */
    protected function invalidateCache(): void
    {
        Cache::forget('settings.all');
        Cache::forget('settings.grouped');
    }
}
