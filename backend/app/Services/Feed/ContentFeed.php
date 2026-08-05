<?php

namespace App\Services\Feed;

use App\Models\User;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * One stream across everything the site publishes.
 *
 * News, reviews and tech are Article rows told apart by their category's type;
 * guides are their own table. A reader does not care which, so the feed unions
 * them into a single ordered stream and hydrates the pieces afterwards.
 *
 * The union carries only what a card needs. Anything richer is fetched in bulk
 * once the page has been cut, so widening the feed does not widen the query.
 */
class ContentFeed
{
    /**
     * What the section filter accepts, and the category type behind it.
     *
     * The names are the ones the database actually uses. An earlier version of
     * this list said 'review' and 'guide'; there are no such category types, so
     * the reviews filter matched nothing and "everything" quietly left all 32
     * reviews out.
     */
    public const TYPES = ['news', 'reviews', 'tech', 'guides'];

    /** What older callers may still send, and what it meant. */
    private const ALIASES = ['review' => 'reviews', 'guide' => 'guides', 'hardware' => 'tech'];

    /**
     * @return string|null|false the type, null for everything, false if unknown
     *
     * Not typed `?string`: returning false from that signature coerces it to an
     * empty string, and an unknown type would have been answered with an empty
     * feed and a 200 instead of a 422.
     */
    public static function resolveType(?string $type): string|null|false
    {
        $type = strtolower(trim((string) $type));

        if ($type === '' || $type === 'all') {
            return null;
        }

        $type = self::ALIASES[$type] ?? $type;

        return in_array($type, self::TYPES, true) ? $type : false;
    }

    /**
     * The stream, newest first, as a query that can still be paginated.
     *
     * @param  string|null  $type  one of TYPES, or null for everything
     */
    public function query(?string $type = null): Builder
    {
        $parts = [];

        if ($type === null || $type !== 'guides') {
            $parts[] = $this->articles($type);
        }

        if ($type === null || $type === 'guides') {
            $parts[] = $this->guides();
        }

        $union = array_shift($parts);
        foreach ($parts as $part) {
            $union->unionAll($part);
        }

        return DB::query()->fromSub($union, 'feed')->orderByDesc('published_at');
    }

    /** @return Builder */
    private function articles(?string $type)
    {
        $query = DB::table('articles')
            ->join('categories', 'categories.id', '=', 'articles.category_id')
            ->where('articles.status', 'published')
            ->whereNull('articles.deleted_at')
            ->where('articles.published_at', '<=', now())
            ->select([
                'articles.id',
                DB::raw("'article' as kind"),
                'articles.slug',
                'articles.title',
                'articles.excerpt',
                'articles.featured_image_url',
                'articles.published_at',
                'articles.views',
                'articles.author_id',
                'articles.category_id',
                'articles.review_score',
                'articles.tags',
                'categories.type as section',
            ]);

        return $type === null
            ? $query->whereIn('categories.type', ['news', 'reviews', 'tech'])
            : $query->where('categories.type', $type);
    }

    /** @return Builder */
    private function guides()
    {
        return DB::table('guides')
            ->where('status', 'published')
            ->select([
                'id',
                DB::raw("'guide' as kind"),
                'slug',
                'title',
                'excerpt',
                'featured_image_url',
                // A guide may never have been given a publish date; it is still
                // published, and ordering has to put it somewhere honest.
                DB::raw('coalesce(published_at, created_at) as published_at'),
                'views',
                'author_id',
                DB::raw('null as category_id'),
                DB::raw('null as review_score'),
                DB::raw('null as tags'),
                DB::raw("'guides' as section"),
            ]);
    }

    /**
     * Fill in the parts a card shows but the union does not carry: the author,
     * the category, and where the piece lives on the site.
     *
     * @param  Collection<int,object>  $rows
     * @return Collection<int,array>
     */
    public function hydrate(Collection $rows): Collection
    {
        $authors = User::whereIn('id', $rows->pluck('author_id')->filter()->unique())
            ->get(['id', 'username', 'display_name', 'avatar_url'])
            ->keyBy('id');

        $categories = DB::table('categories')
            ->whereIn('id', $rows->pluck('category_id')->filter()->unique())
            ->get(['id', 'name', 'slug'])
            ->keyBy('id');

        return $rows->map(function ($row) use ($authors, $categories) {
            $author = $row->author_id ? $authors->get($row->author_id) : null;
            $category = $row->category_id ? $categories->get($row->category_id) : null;

            return [
                'id' => $row->kind.'-'.$row->id,
                'kind' => $row->kind,
                'section' => $row->section,
                'slug' => $row->slug,
                'url' => self::url($row->section, $row->slug),
                'title' => $row->title,
                'excerpt' => $row->excerpt,
                'featured_image_url' => self::image($row->featured_image_url),
                'published_at' => $row->published_at ? (string) $row->published_at : null,
                'views' => (int) ($row->views ?? 0),
                'review_score' => $row->review_score !== null ? (float) $row->review_score : null,
                'category' => $category ? ['name' => $category->name, 'slug' => $category->slug] : null,
                'author' => $author ? [
                    'username' => $author->username,
                    'name' => $author->display_name ?: $author->username,
                    'avatar' => $author->avatar_url,
                ] : null,
            ];
        });
    }

    /**
     * Tech articles live under /hardware — a URL readers and Google already
     * have, and not worth renaming for tidiness.
     */
    public static function url(string $section, string $slug): string
    {
        $base = ['news' => '/news', 'reviews' => '/reviews', 'tech' => '/hardware', 'guides' => '/guides'];

        return ($base[$section] ?? '/news').'/'.$slug;
    }

    /**
     * The column holds an absolute URL on some rows and a storage-relative path
     * on others, the same split ArticleResource handles.
     */
    public static function image(mixed $path): ?string
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
     * Tags as a plain list. Articles store them as JSON; guides have none.
     *
     * @return array<int,string>
     */
    public static function tags(mixed $raw): array
    {
        if (is_array($raw)) {
            return array_values(array_filter($raw, 'is_string'));
        }

        if (! is_string($raw) || $raw === '') {
            return [];
        }

        $decoded = json_decode($raw, true);

        return is_array($decoded) ? array_values(array_filter($decoded, 'is_string')) : [];
    }
}
