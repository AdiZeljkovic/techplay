<?php

namespace App\Observers;

use App\Models\HelpCategory;
use App\Services\CacheService;
use App\Services\RevalidationService;
use Illuminate\Support\Facades\Cache;

/**
 * A topic changing is never only a topic changing.
 *
 * Two of its fields reach further than the topic page. `slug` is part of every
 * URL underneath it and is embedded in each answer's cached payload, so renaming
 * a topic without clearing its children leaves them telling readers the old
 * address. And `is_published` is how an editor withdraws a whole subject — the
 * answers inside stop being visible the moment it flips, which is a change to
 * pages that were not themselves touched.
 */
class HelpCategoryObserver
{
    public function __construct(protected RevalidationService $revalidationService) {}

    public function saved(HelpCategory $category): void
    {
        // Both spellings when the slug moved: the topic page at the old address
        // has to stop answering as surely as the new one starts.
        $slugs = array_values(array_unique(array_filter([
            $category->slug,
            $category->getOriginal('slug'),
        ])));

        if ($category->wasChanged(['slug', 'is_published']) || $category->wasRecentlyCreated) {
            $this->forgetChildren($category);
        }

        $this->purge($slugs);
    }

    public function deleted(HelpCategory $category): void
    {
        // The rows go with it — the foreign key cascades — but their cached
        // payloads do not, and a deleted topic's answers would keep serving
        // from Redis until the TTL lapsed.
        $this->forgetChildren($category);

        $this->purge(array_filter([$category->slug]));
    }

    /**
     * Every answer's cached payload, because each one carries the topic's slug
     * and name inside it for the breadcrumb and the canonical URL.
     */
    protected function forgetChildren(HelpCategory $category): void
    {
        $category->articles()->pluck('slug')->each(
            fn (string $slug) => Cache::forget(CacheService::articleShowKey('help', $slug))
        );
    }

    /** @param  array<int, string>  $slugs */
    protected function purge(array $slugs): void
    {
        CacheService::forgetListings('help');

        $this->revalidationService->revalidatePaths(
            array_merge(['/help'], array_map(fn ($slug) => "/help/{$slug}", $slugs)),
            array_merge(['help'], array_map(fn ($slug) => "help-category-{$slug}", $slugs)),
        );
    }
}
