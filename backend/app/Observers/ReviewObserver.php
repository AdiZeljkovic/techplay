<?php

namespace App\Observers;

use App\Events\ReviewPublished;
use App\Models\Review;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ReviewObserver
{
    public function created(Review $review): void
    {
        if ($review->status === 'published') {
            broadcast(new ReviewPublished($review))->toOthers();
            $this->pingSearchEngines($review->slug);
        }
    }

    public function updated(Review $review): void
    {
        if ($review->isDirty('status') && $review->status === 'published') {
            broadcast(new ReviewPublished($review))->toOthers();
            $this->pingSearchEngines($review->slug);
        }
    }

    protected function pingSearchEngines(string $slug): void
    {
        $siteUrl = rtrim(config('app.frontend_url', 'https://techplay.gg'), '/');
        $articleUrl = "{$siteUrl}/reviews/{$slug}";
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
                Log::warning('IndexNow ping failed for review', ['error' => $e->getMessage()]);
            }
        }
    }
}
