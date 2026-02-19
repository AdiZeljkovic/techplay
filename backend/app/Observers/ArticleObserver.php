<?php

namespace App\Observers;

use App\Models\Article;
use App\Services\RevalidationService;

class ArticleObserver
{
    protected RevalidationService $revalidationService;

    public function __construct(RevalidationService $revalidationService)
    {
        $this->revalidationService = $revalidationService;
    }

    /**
     * Handle the Article "saved" event (fires on both create and update)
     *
     * @param  \App\Models\Article  $article
     * @return void
     */
    public function saved(Article $article)
    {
        // Only revalidate if article is published
        if ($article->status === 'published' && $article->slug && $article->category) {
            // Determine category path based on category type
            $categoryPath = $this->getCategoryPath($article->category->type);

            if ($categoryPath) {
                // Revalidate article page
                $this->revalidationService->revalidateArticle($article->slug, $categoryPath);

                // Revalidate homepage if article is featured
                if ($article->is_featured_in_hero) {
                    $this->revalidationService->revalidateHomepage();
                }
            }
        }
    }

    /**
     * Handle the Article "deleted" event
     *
     * @param  \App\Models\Article  $article
     * @return void
     */
    public function deleted(Article $article)
    {
        // Revalidate category listing when article is deleted
        if ($article->category) {
            $categoryPath = $this->getCategoryPath($article->category->type);
            if ($categoryPath) {
                $this->revalidationService->revalidateCategory($categoryPath);
            }
        }

        // Revalidate homepage if featured article was deleted
        if ($article->is_featured_in_hero) {
            $this->revalidationService->revalidateHomepage();
        }
    }

    /**
     * Map category type to frontend URL path
     */
    protected function getCategoryPath(string $categoryType): ?string
    {
        return match ($categoryType) {
            'news' => 'news',
            'review' => 'reviews',
            'tech' => 'tech',
            'guide' => 'guides',
            default => null,
        };
    }
}
