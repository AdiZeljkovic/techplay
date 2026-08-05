<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Category;
use App\Models\Game;
use App\Models\Guide;
use App\Services\Releases\CalendarVisibility;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * The furniture around a section's article list: its category tabs with
 * counts, what is being read, what is coming out, and the one piece worth
 * leading with.
 *
 * News, reviews and tech are the same thing wearing different labels — all
 * Article rows, told apart by their category's type — so one endpoint serves
 * all three rather than three that drift.
 *
 * Guides are a separate model and keep their own branch here: they have no
 * category, only a difficulty, and their list endpoint filters on that
 * instead. The page around them is the same page, so the shape it answers
 * with is the same shape; only where the rows come from differs.
 */
class NewsroomController extends Controller
{
    use ApiResponse;

    /** What each section calls itself, and the strapline under the title. */
    private const SECTIONS = [
        'news' => ['title' => 'Newsroom', 'line' => 'Breaking stories, analysis and interviews from across gaming.'],
        'reviews' => ['title' => 'Reviews', 'line' => 'Played to the end, then written about honestly.'],
        'tech' => ['title' => 'Tech', 'line' => 'Hardware, handhelds and the machines the games run on.'],
        'guides' => ['title' => 'Guides', 'line' => 'Walkthroughs, builds and the bits the game never explains.'],
    ];

    /** How the tab row is labelled for guides, where difficulty stands in for category. */
    private const DIFFICULTY = [
        'beginner' => 'Beginner',
        'intermediate' => 'Intermediate',
        'advanced' => 'Advanced',
        'expert' => 'Expert',
    ];

    public function index(Request $request, string $section): JsonResponse
    {
        if (! isset(self::SECTIONS[$section])) {
            return $this->error('Unknown section.', 404);
        }

        return $this->success([
            'section' => self::SECTIONS[$section] + ['key' => $section],
            'categories' => $this->categories($section),
            'featured' => $this->featured($section),
            'trending' => $this->trending($section),
            'most_read' => $this->mostRead($section),
            'upcoming_releases' => $this->upcomingReleases(),
            'stats' => $this->stats($section),
        ]);
    }

    /**
     * The tab row: real categories with real counts, or for guides the
     * difficulties that have something filed under them.
     *
     * @return array<int,array{slug:string,name:string,count:int}>
     */
    private function categories(string $section): array
    {
        if ($section === 'guides') {
            return Cache::remember('newsroom.guides.categories.v1', 1800, fn () => Guide::query()
                ->where('status', 'published')
                ->whereNotNull('difficulty')
                ->groupBy('difficulty')
                ->orderByRaw('count(*) desc')
                ->get(['difficulty', DB::raw('count(*) as tally')])
                ->map(fn ($row) => [
                    'slug' => $row->difficulty,
                    'name' => self::DIFFICULTY[$row->difficulty] ?? ucfirst($row->difficulty),
                    'count' => (int) $row->tally,
                ])
                ->all());
        }

        return Cache::remember("newsroom.{$section}.categories.v1", 1800, fn () => Category::query()
            ->where('type', $section)
            ->withCount(['articles' => fn ($q) => $q->where('status', 'published')->where('published_at', '<=', now())])
            ->get()
            // Filtered here rather than with HAVING: the count is a select
            // subquery, and Postgres will not have its alias in HAVING.
            ->filter(fn (Category $c) => $c->articles_count > 0)
            ->sortByDesc('articles_count')
            ->map(fn (Category $c) => [
                'slug' => $c->slug,
                'name' => $c->name,
                'count' => (int) $c->articles_count,
            ])
            ->values()
            ->all());
    }

    /**
     * The piece to lead with.
     *
     * Editors already say what deserves the spotlight — `is_featured_in_hero`
     * is the toggle they reach for in the admin — so that flag wins here
     * rather than a second one nobody would remember to set. Sections where
     * nothing is flagged (tech, today) fall back to the newest piece that has
     * art, because a lead slot with no image is worse than no lead slot.
     */
    private function featured(string $section): ?array
    {
        return Cache::remember("newsroom.{$section}.featured.v1", 300, function () use ($section) {
            $base = fn () => $this->published($section)
                ->whereNotNull('featured_image_url')
                ->with($this->eager($section))
                ->latest('published_at');

            // Guides carry no hero flag; there is nothing to prefer, so the
            // newest one with art leads.
            $article = $section === 'guides'
                ? $base()->first()
                : ($base()->where('is_featured_in_hero', true)->first() ?? $base()->first());

            return $article ? $this->card($article, withExcerpt: true) : null;
        });
    }

    /**
     * The ticker along the top: recent pieces, newest first.
     *
     * Deliberately not "trending". We have no way to know what is trending —
     * views is a running total with no time in it — and the ticker's job is to
     * put the last few days in front of somebody who has been away.
     *
     * @return array<int,array{slug:string,title:string}>
     */
    private function trending(string $section): array
    {
        return Cache::remember("newsroom.{$section}.trending.v1", 900, fn () => $this->published($section)
            ->latest('published_at')
            ->limit(6)
            ->get(['slug', 'title'])
            ->map(fn ($a) => ['slug' => $a->slug, 'title' => $a->title])
            ->all());
    }

    /**
     * The most read pieces of the last quarter.
     *
     * Not "this week", which the mockup asked for and we cannot honestly
     * answer: views is a cumulative counter with no time dimension, so the
     * best available reading is "popular, and recent enough to still matter".
     * A tighter window would leave the panel empty most months, which would
     * be a lie of a different kind.
     *
     * @return array<int,array>
     */
    private function mostRead(string $section): array
    {
        return Cache::remember("newsroom.{$section}.most_read.v1", 900, fn () => $this->published($section)
            ->where('published_at', '>=', now()->subDays(90))
            ->orderByDesc('views')
            ->limit(5)
            ->with($this->eager($section))
            ->get()
            ->map(fn ($a) => $this->card($a))
            ->all());
    }

    /**
     * What is coming out, from the release calendar.
     *
     * The calendar is read from our own tables now, so a newsroom rail can
     * lean on it without anybody's API being up.
     *
     * @return array<int,array>
     */
    private function upcomingReleases(): array
    {
        return Cache::remember('newsroom.upcoming.v1', 1800, fn () => app(CalendarVisibility::class)
            ->apply(
                Game::query()
                    ->whereNotNull('match_key')
                    ->whereNotNull('released')
                    ->where('released', '>=', now()->toDateString())
            )
            ->orderBy('released')
            ->limit(5)
            ->get()
            ->map(fn (Game $g) => [
                'slug' => $g->slug,
                'name' => $g->name,
                'released' => $g->released?->toDateString(),
                'days_away' => (int) round(now()->startOfDay()->diffInDays($g->released->copy()->startOfDay(), false)),
                'background_image' => $g->background_image,
            ])
            ->all());
    }

    /**
     * What the section can honestly say about itself.
     *
     * Deliberately not a marketing line. The mockup this follows claimed
     * "50+ experts"; there are six people writing here, and a reader can
     * count them from the author pages in about a minute.
     */
    private function stats(string $section): array
    {
        return Cache::remember("newsroom.{$section}.stats.v1", 1800, fn () => [
            'articles' => $this->published($section)->count(),
            'authors' => $this->published($section)->distinct('author_id')->count('author_id'),
            'this_month' => $this->published($section)->where('published_at', '>=', now()->subDays(30))->count(),
        ]);
    }

    /**
     * Everything a reader is allowed to see in this section.
     *
     * Guides carry no category, so the type check does not apply to them —
     * being a guide is the whole filter.
     */
    private function published(string $section)
    {
        if ($section === 'guides') {
            return Guide::query()
                ->where('status', 'published')
                ->where(fn ($q) => $q->whereNull('published_at')->orWhere('published_at', '<=', now()));
        }

        return Article::query()
            ->where('status', 'published')
            ->where('published_at', '<=', now())
            ->whereHas('category', fn ($q) => $q->where('type', $section));
    }

    /**
     * What to eager-load. Guides have an author but no category, and asking
     * for one throws rather than coming back empty.
     *
     * @return array<int|string,mixed>
     */
    private function eager(string $section): array
    {
        $author = ['author:id,username,display_name,avatar_url'];

        return $section === 'guides' ? $author : [...$author, 'category:id,name,slug'];
    }

    /**
     * The same resolution ArticleResource does, for the same reason: the column
     * holds an absolute URL on some rows, a storage-relative path on others,
     * and a one-element array on anything Filament's uploader wrote.
     */
    private function image(mixed $path): ?string
    {
        if (is_array($path)) {
            $path = $path[0] ?? null;
        }

        if (! $path) {
            return null;
        }

        return str_starts_with($path, 'http') ? $path : asset('storage/'.$path);
    }

    /**
     * @param  Article|Guide  $article
     */
    private function card($article, bool $withExcerpt = false): array
    {
        return array_filter([
            'slug' => $article->slug,
            'title' => $article->title,
            'excerpt' => $withExcerpt ? $article->excerpt : null,
            'featured_image_url' => $this->image($article->featured_image_url),
            'published_at' => $article->published_at?->toISOString(),
            'views' => (int) ($article->views ?? 0),
            'category' => $article->relationLoaded('category') && $article->category ? [
                'name' => $article->category->name,
                'slug' => $article->category->slug,
            ] : null,
            'author' => $article->relationLoaded('author') && $article->author ? [
                'name' => $article->author->display_name ?? $article->author->username,
                'avatar' => $article->author->avatar_url,
            ] : null,
        ], fn ($v) => $v !== null);
    }
}
