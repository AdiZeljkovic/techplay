<?php

namespace App\Console\Commands;

use App\Models\Article;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PublishScheduledArticles extends Command
{
    protected $signature = 'articles:publish-scheduled';

    protected $description = 'Publish articles scheduled for release at or before now';

    public function handle(): void
    {
        $articles = Article::where('status', 'scheduled')
            ->where('published_at', '<=', now())
            ->get();

        if ($articles->isEmpty()) {
            return;
        }

        $ids = $articles->pluck('id')->toArray();

        Article::whereIn('id', $ids)->update(['status' => 'published']);

        Log::info('PublishScheduledArticles: published '.count($ids).' articles', ['ids' => $ids]);

        // Trigger ISR revalidation for each published article
        $revalidateToken = config('services.revalidate.token');
        $revalidateUrl = config('services.revalidate.url');

        if ($revalidateToken && $revalidateUrl) {
            foreach ($articles as $article) {
                $paths = ["/news/{$article->slug}"];

                if ($article->category) {
                    if ($article->category->type === 'reviews') {
                        $paths = ["/reviews/{$article->slug}"];
                    } elseif (in_array($article->category->type, ['tech', 'hardware'])) {
                        $paths = ["/hardware/{$article->slug}"];
                    }
                }

                foreach ($paths as $path) {
                    try {
                        Http::withToken($revalidateToken)->post($revalidateUrl, ['path' => $path]);
                    } catch (\Throwable $e) {
                        Log::warning("Failed to revalidate {$path}: ".$e->getMessage());
                    }
                }
            }
        }

        $this->info("Published {$articles->count()} scheduled article(s).");
    }
}
