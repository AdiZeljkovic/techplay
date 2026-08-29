<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Telling the front end that something it has cached is no longer true.
 *
 * The site serves pages from cache so it is fast. When an editor publishes or
 * edits anything, the cached copy has to be thrown away, or the reader keeps
 * seeing the old one — and for article pages that is forever, because
 * `/news/[slug]` is built with `revalidate = false` and only ever refreshes on
 * demand.
 *
 * ── Why this class absorbed another one ──────────────────────────────────
 *
 * There were two services doing this, `RevalidationService` and
 * `CacheRevalidationService`, 118 and 223 lines. Both had a method called
 * `revalidateArticle`, and they did not agree on what one was:
 *
 *   this one            (slug, category)        sent type/slug/category  ✓
 *   the other one       (type, slug, paths)     sent no category at all  ✗
 *
 * The second would have been answered `Missing "slug" or "category"`, and
 * nothing called it — but the name was a trap sitting in the file where games
 * and categories are handled, which is exactly where somebody adding a content
 * type would look. On 18 Aug 2026 it caught me: I read the wrong class, and
 * reported article revalidation as broken when it had been working the whole
 * time.
 *
 * They also disagreed on how to authenticate — `x-revalidate-token` here,
 * `Authorization: Bearer` there, reading two different config keys that hold
 * the same value. The Next endpoint carries compatibility code for both, with
 * a comment naming both services. Duplication does not stay on one side of an
 * API.
 *
 * One class now. Every method sends a `type` the endpoint actually handles:
 * article, game, home, category, or a bare list of paths.
 */
class RevalidationService
{
    protected ?string $frontendUrl;

    protected ?string $revalidateToken;

    public function __construct()
    {
        $this->frontendUrl = config('app.frontend_url');
        // Two names for one secret are in circulation; both resolve to the same
        // value today, and reading both means a rename cannot silence this.
        $this->revalidateToken = config('services.revalidate.secret_token')
            ?: config('app.revalidation_secret');
    }

    /**
     * An article, a review, a guide or a hardware piece.
     *
     * `$category` is the section as the **front end routes it** — news,
     * reviews, guides, hardware — not the raw `categories.type`. The endpoint
     * maps it onto both the cache tag and the URL path, and those differ:
     * tech articles live at /hardware.
     */
    public function revalidateArticle(string $slug, string $category): bool
    {
        return $this->send('article', [
            'slug' => $slug,
            'category' => $category,
        ], "article {$category}/{$slug}");
    }

    /** A game page in the catalogue. */
    public function revalidateGame(string $slug): bool
    {
        return $this->send('game', ['slug' => $slug], "game {$slug}");
    }

    public function revalidateHomepage(): bool
    {
        return $this->send('home', [], 'homepage');
    }

    /** A section listing page — /news, /reviews, /hardware. */
    public function revalidateCategory(string $category): bool
    {
        return $this->send('category', ['category' => $category], "category {$category}");
    }

    /**
     * The navigation tree, which is rebuilt from categories.
     *
     * The endpoint has no separate 'navigation' branch — it shares 'category',
     * which is what the previous implementation sent too.
     */
    public function revalidateNavigation(): bool
    {
        return $this->send('category', [], 'navigation');
    }

    /**
     * Named paths, for content whose URLs no rule can derive — the GTA 6
     * pages, mainly.
     *
     * The endpoint checks `paths` before it looks at `type`, but only when the
     * array is non-empty, so an empty call here would fall through to the type
     * switch and be rejected. Guarded rather than sent.
     */
    /**
     * Purge by path, and by tag where a path cannot reach.
     *
     * `revalidatePath` does nothing for a dynamic route — Next says so, and
     * this codebase has learned it twice. A GTA6 character page is dynamic, so
     * every edit sent `/gta6/characters/{slug}` into the void and the page sat
     * on its one-hour timer. Listing pages are static and the path works for
     * them, so both go together.
     */
    public function revalidatePaths(array $paths, array $tags = []): bool
    {
        $paths = array_values(array_filter($paths, 'is_string'));
        $tags = array_values(array_filter($tags, 'is_string'));

        if ($paths === [] && $tags === []) {
            return false;
        }

        return $this->send(
            'paths',
            ['paths' => $paths, 'tags' => $tags],
            count($paths).' paths, '.count($tags).' tags',
        );
    }

    /**
     * One place that talks to the endpoint.
     *
     * Every failure is logged at `error`, not `warning`. The panel's log level
     * is `error`, so a warning here is a message nobody will ever read — which
     * is how a broken purge stays invisible while the site serves stale pages.
     */
    private function send(string $type, array $payload, string $what): bool
    {
        if (! $this->revalidateToken || ! $this->frontendUrl) {
            Log::error('[Revalidation] skipped, missing configuration', [
                'what' => $what,
                'has_url' => (bool) $this->frontendUrl,
                'has_token' => (bool) $this->revalidateToken,
            ]);

            return false;
        }

        try {
            $response = Http::timeout(5)
                ->withHeaders([
                    'x-revalidate-token' => $this->revalidateToken,
                    'Content-Type' => 'application/json',
                ])
                ->post(rtrim($this->frontendUrl, '/').'/api/revalidate', [
                    'type' => $type,
                ] + $payload);

            if ($response->successful()) {
                Log::info("[Revalidation] {$what}");

                return true;
            }

            Log::error('[Revalidation] refused', [
                'what' => $what,
                'status' => $response->status(),
                'body' => substr($response->body(), 0, 200),
            ]);

            return false;
        } catch (\Throwable $e) {
            Log::error('[Revalidation] exception', [
                'what' => $what,
                'message' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
