<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\ArticleResource;
use App\Models\Article;
use App\Models\Guide;
use App\Models\User;
use App\Services\CacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AuthorController extends Controller
{
    private array $editorialRoles = [
        'Editor-in-Chief', 'Editor', 'Journalist',
        'Moderator', 'Admin', 'Super Admin',
    ];

    private array $editorialRoleValues = [
        'admin', 'editor', 'moderator', 'journalist', 'super_admin',
    ];

    private array $rolePriority = [
        'Editor-in-Chief' => 1,
        'Editor' => 2,
        'Journalist' => 3,
        'Moderator' => 4,
        'Admin' => 5,
        'Super Admin' => 6,
    ];

    private function normalizeRole(string $name): string
    {
        return strtolower(str_replace([' ', '-'], '_', $name));
    }

    private array $normalizedEditorialRoles = [
        'editor_in_chief', 'editor', 'journalist',
        'moderator', 'admin', 'super_admin',
    ];

    private function findEditorialAuthor(string $slug): User
    {
        $user = User::where('author_slug', $slug)->with('roles')->firstOrFail();

        $spatieMatch = $user->roles->pluck('name')
            ->map(fn ($r) => $this->normalizeRole($r))
            ->intersect($this->normalizedEditorialRoles)
            ->isNotEmpty();

        $columnMatch = in_array($this->normalizeRole($user->role ?? ''), $this->normalizedEditorialRoles);

        if (! $spatieMatch && ! $columnMatch) {
            abort(404, 'Author not found.');
        }

        return $user;
    }

    private function getDisplayRole(User $user): string
    {
        $priority = $this->rolePriority;

        $spatieRole = $user->roles
            ->sortBy(fn ($r) => $priority[$r->name] ?? 99)
            ->first()?->name;

        if ($spatieRole) {
            return $spatieRole;
        }

        // Fallback: prettify role column value
        $col = $user->role ?? 'Editor';

        return ucwords(str_replace('_', ' ', $col));
    }

    /**
     * GET /api/v1/authors/{slug}
     * Returns author profile info for editorial staff.
     */
    public function show(string $slug): JsonResponse
    {
        $cacheKey = "author.show.v1.{$slug}";

        $data = Cache::remember($cacheKey, CacheService::TTL_LONG, function () use ($slug) {
            $user = $this->findEditorialAuthor($slug);

            // Article counts grouped by category type
            $articlesByType = Article::where('author_id', $user->id)
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                ->with('category:id,type')
                ->get(['id', 'category_id'])
                ->groupBy(fn ($a) => $a->category?->type ?? 'news')
                ->map->count();

            $guidesCount = Guide::where('author_id', $user->id)
                ->where('status', 'published')
                ->count();

            $newsCount = $articlesByType->get('news', 0);
            $reviewsCount = $articlesByType->get('reviews', 0) + $articlesByType->get('review', 0);
            $techCount = $articlesByType->get('tech', 0);
            $total = $newsCount + $reviewsCount + $techCount + $guidesCount;

            $coverImage = null;
            if ($user->cover_image) {
                $coverImage = str_starts_with($user->cover_image, 'http')
                    ? $user->cover_image
                    : asset('storage/'.$user->cover_image);
            }

            $socialLinks = $user->author_social_links ?? [];
            $socialUrls = array_filter([
                isset($socialLinks['twitter']) && $socialLinks['twitter']
                    ? 'https://x.com/'.ltrim($socialLinks['twitter'], '/')
                    : null,
                isset($socialLinks['linkedin']) && $socialLinks['linkedin']
                    ? 'https://linkedin.com/in/'.ltrim($socialLinks['linkedin'], '/')
                    : null,
                isset($socialLinks['youtube']) && $socialLinks['youtube']
                    ? $socialLinks['youtube']
                    : null,
                isset($socialLinks['instagram']) && $socialLinks['instagram']
                    ? 'https://instagram.com/'.ltrim($socialLinks['instagram'], '/')
                    : null,
                isset($socialLinks['website']) && $socialLinks['website']
                    ? $socialLinks['website']
                    : null,
            ]);

            return [
                'author' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'author_slug' => $user->author_slug,
                    'display_name' => $user->display_name ?? $user->username,
                    'avatar_url' => $user->avatar_url,
                    'cover_image' => $coverImage,
                    'bio' => $user->bio,
                    'tagline' => $user->tagline,
                    'role' => $this->getDisplayRole($user),
                    'joined_at' => $user->created_at->format('M Y'),
                    'social_links' => $socialLinks,
                    'social_urls' => array_values($socialUrls),
                ],
                'stats' => [
                    'total' => $total,
                    'news' => $newsCount,
                    'reviews' => $reviewsCount,
                    'tech' => $techCount,
                    'guides' => $guidesCount,
                ],
            ];
        });

        return response()->json($data)
            ->header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    }

    /**
     * GET /api/v1/authors/{slug}/articles
     * Returns paginated articles by this author. Optional ?type= filter.
     * Supports: all, news, reviews, tech, guides
     */
    public function articles(string $slug, Request $request): JsonResponse
    {
        $type = $request->get('type', 'all');
        $page = (int) $request->get('page', 1);
        $cacheKey = "author.articles.v1.{$slug}.type_{$type}.page_{$page}";

        $data = Cache::remember($cacheKey, CacheService::TTL_MEDIUM, function () use ($slug, $type, $page) {
            $user = $this->findEditorialAuthor($slug);

            if ($type === 'guides') {
                $guides = Guide::where('author_id', $user->id)
                    ->where('status', 'published')
                    ->latest('published_at')
                    ->paginate(12, ['*'], 'page', $page);

                $items = $guides->getCollection()->map(fn ($g) => [
                    'id' => $g->id,
                    'title' => $g->title,
                    'slug' => $g->slug,
                    'excerpt' => $g->excerpt,
                    'featured_image_url' => $g->featured_image_url,
                    'published_at' => $g->published_at,
                    'type' => 'guides',
                    'url_path' => '/guides/'.$g->slug,
                    'category' => ['id' => 0, 'name' => 'Guides', 'slug' => 'guides', 'type' => 'guides'],
                ]);

                return [
                    'data' => $items,
                    'current_page' => $guides->currentPage(),
                    'last_page' => $guides->lastPage(),
                    'total' => $guides->total(),
                    'per_page' => $guides->perPage(),
                ];
            }

            $query = Article::where('author_id', $user->id)
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                ->with(['author:id,username,display_name,avatar_url,author_slug', 'category:id,name,slug,type']);

            if ($type !== 'all') {
                $query->whereHas('category', fn ($q) => $q->where('type', $type));
            }

            $articles = $query->latest('published_at')->paginate(12, ['*'], 'page', $page);

            return [
                'data' => ArticleResource::collection($articles),
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
                'total' => $articles->total(),
                'per_page' => $articles->perPage(),
            ];
        });

        return response()->json($data)
            ->header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    }
}
