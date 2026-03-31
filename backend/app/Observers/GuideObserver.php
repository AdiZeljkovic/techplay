<?php

namespace App\Observers;

use App\Events\GuidePublished;
use App\Models\Guide;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GuideObserver
{
    public function created(Guide $guide): void
    {
        if ($guide->status === 'published') {
            broadcast(new GuidePublished($guide))->toOthers();
            $this->pingSearchEngines($guide->slug);
        }

        $this->invalidateCache($guide);
    }

    public function updated(Guide $guide): void
    {
        if ($guide->isDirty('status') && $guide->status === 'published') {
            broadcast(new GuidePublished($guide))->toOthers();
            $this->pingSearchEngines($guide->slug);
        }

        $this->invalidateCache($guide);
    }

    protected function pingSearchEngines(string $slug): void
    {
        $siteUrl = rtrim(config('app.frontend_url', 'https://techplay.gg'), '/');
        $articleUrl = "{$siteUrl}/guides/{$slug}";
        $indexNowKey = config('services.indexnow.key');

        if ($indexNowKey) {
            try {
                Http::timeout(5)->post('https://api.indexnow.org/indexnow', [
                    'host'        => parse_url($siteUrl, PHP_URL_HOST),
                    'key'         => $indexNowKey,
                    'keyLocation' => "{$siteUrl}/{$indexNowKey}.txt",
                    'urlList'     => [$articleUrl],
                ]);
            } catch (\Exception $e) {
                Log::warning('IndexNow ping failed for guide', ['error' => $e->getMessage()]);
            }
        }
    }

    public function deleted(Guide $guide): void
    {
        $this->invalidateCache($guide);
    }

    /**
     * Invalidate guide cache when guide changes
     */
    protected function invalidateCache(Guide $guide): void
    {
        // Clear specific guide cache
        Cache::forget("guide.show.v2.{$guide->slug}");

        // Clear guide listing cache (first 5 pages, all difficulties, no search)
        for ($page = 1; $page <= 5; $page++) {
            foreach (['all', 'beginner', 'intermediate', 'advanced'] as $diff) {
                $cacheKey = "guides.index.v2.page_{$page}.diff_{$diff}.search_" . md5('');
                Cache::forget($cacheKey);
            }
        }
    }
}
