<?php

namespace App\Observers;

use App\Models\MediaKitSetting;
use Illuminate\Support\Facades\Cache;

class MediaKitSettingObserver
{
    /**
     * Handle the MediaKitSetting "created" event.
     */
    public function created(MediaKitSetting $mediaKitSetting): void
    {
        $this->clearCache();
    }

    /**
     * Handle the MediaKitSetting "updated" event.
     */
    public function updated(MediaKitSetting $mediaKitSetting): void
    {
        $this->clearCache();
    }

    /**
     * Handle the MediaKitSetting "deleted" event.
     */
    public function deleted(MediaKitSetting $mediaKitSetting): void
    {
        $this->clearCache();
    }

    /**
     * Handle the MediaKitSetting "restored" event.
     */
    public function restored(MediaKitSetting $mediaKitSetting): void
    {
        $this->clearCache();
    }

    /**
     * Handle the MediaKitSetting "force deleted" event.
     */
    public function forceDeleted(MediaKitSetting $mediaKitSetting): void
    {
        $this->clearCache();
    }

    /**
     * Clear media kit related cache
     */
    private function clearCache(): void
    {
        Cache::forget('media_kit.full');
        Cache::forget('media_kit.statistics');
    }
}
