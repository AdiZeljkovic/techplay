<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Category;
use App\Models\Game;
use App\Models\GameList;
use App\Models\Gta6Character;
use App\Models\Guide;
use App\Models\Product;
use App\Models\Studio;
use Carbon\Carbon;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    private string $frontendUrl;

    private string $apiUrl;

    private const CACHE_TTL = 3600; // 1 hour cache

    public function __construct()
    {
        // Every URL in every sitemap is built from this, so it has to be one
        // address. config('app.frontend_url') doubles as the CORS allow-list
        // and can hold several comma-separated origins — which would have put
        // "https://a,https://b/games/foo" in 166,000 places. site_url is
        // normalised in config/app.php for exactly this.
        $this->frontendUrl = rtrim((string) config('app.site_url'), '/');
        $this->apiUrl = config('app.url', 'https://api-beta.techplay.gg');
    }

    /**
     * Main Sitemap Index - links to all sub-sitemaps
     * Only includes sitemaps that have content to avoid Google "Missing XML tag" errors
     */
    public function index(): Response
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $xml .= '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";

        // Always-present sitemaps (static pages, categories always have entries)
        $sitemaps = [
            'sitemap-pages.xml',
            'sitemap-articles.xml',
            'sitemap-categories.xml',
            'sitemap-hub.xml',
        ];

        // Conditional sitemaps - only include if they have content
        if (Guide::where('status', 'published')->where('is_noindex', false)->exists()) {
            $sitemaps[] = 'sitemap-guides.xml';
        }
        if (Product::where('is_active', true)->exists()) {
            $sitemaps[] = 'sitemap-products.xml';
        }
        // Lists were absent from every sitemap since the day they shipped, so
        // the only pages on this site written by its members were the only ones
        // Google was never told about.
        if (self::hasPublishedLists()) {
            $sitemaps[] = 'sitemap-lists.xml';
        }
        if (Article::where('status', 'published')->whereBetween('published_at', [now()->subHours(48), now()])->exists()) {
            $sitemaps[] = 'sitemap-news.xml';
        }
        if (Article::where('status', 'published')->whereNotNull('featured_image_url')->exists()) {
            $sitemaps[] = 'sitemap-images.xml';
        }

        // Get actual last-modified dates per sitemap type
        $lastmod = Cache::remember('sitemap.index.lastmod', 300, function () {
            $articleLastmod = Article::where('status', 'published')->max('updated_at');
            $guideLastmod = Guide::where('status', 'published')->max('updated_at');
            $productLastmod = Product::where('is_active', true)->max('updated_at');

            return [
                'sitemap-hub.xml' => now()->subDays(7)->toIso8601String(),
                'sitemap-pages.xml' => now()->subDays(7)->toIso8601String(),
                'sitemap-articles.xml' => $articleLastmod ? Carbon::parse($articleLastmod)->toIso8601String() : now()->toIso8601String(),
                'sitemap-categories.xml' => now()->subDays(7)->toIso8601String(),
                'sitemap-guides.xml' => $guideLastmod ? Carbon::parse($guideLastmod)->toIso8601String() : now()->toIso8601String(),
                'sitemap-products.xml' => $productLastmod ? Carbon::parse($productLastmod)->toIso8601String() : now()->toIso8601String(),
                'sitemap-news.xml' => $articleLastmod ? Carbon::parse($articleLastmod)->toIso8601String() : now()->toIso8601String(),
                'sitemap-images.xml' => $articleLastmod ? Carbon::parse($articleLastmod)->toIso8601String() : now()->toIso8601String(),
            ];
        });

        // Game sitemaps — paginated, 50,000 URLs per file (Google limit).
        // Game::indexable() is the single rule; it mirrors what the page
        // itself will agree to index, so the sitemap stops submitting URLs
        // that answer with noindex.
        $gamesCount = Game::indexable()->count();
        if ($gamesCount > 0) {
            $gamePages = (int) ceil($gamesCount / 50000);
            $gameLastmodRaw = Game::indexable()->max('updated_at');
            $gameLastmodStr = $gameLastmodRaw ? Carbon::parse($gameLastmodRaw)->toIso8601String() : now()->toIso8601String();
            for ($p = 1; $p <= $gamePages; $p++) {
                $filename = "sitemap-games-{$p}.xml";
                $sitemaps[] = $filename;
                $lastmod[$filename] = $gameLastmodStr;
            }
        }

        // Studios, but only once there are any — an empty file in the index is
        // a URL a crawler fetches forever to be told nothing.
        if (Studio::where('indexable', true)->exists()) {
            $sitemaps[] = 'sitemap-studios.xml';
            $studioLastmod = Studio::where('indexable', true)->max('updated_at');
            $lastmod['sitemap-studios.xml'] = $studioLastmod
                ? Carbon::parse($studioLastmod)->toIso8601String()
                : now()->toIso8601String();
        }

        foreach ($sitemaps as $sitemap) {
            $xml .= "  <sitemap>\n";
            $xml .= "    <loc>{$this->frontendUrl}/{$sitemap}</loc>\n";
            $xml .= '    <lastmod>'.($lastmod[$sitemap] ?? now()->toIso8601String())."</lastmod>\n";
            $xml .= "  </sitemap>\n";
        }

        $xml .= '</sitemapindex>';

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }

    /**
     * Static Pages Sitemap
     */
    public function pages(): Response
    {
        $xml = $this->xmlHeader();

        $staticPages = [
            ['/', 'daily', '1.0'],
            ['/news', 'hourly', '0.9'],
            ['/reviews', 'daily', '0.9'],
            ['/hardware', 'daily', '0.9'],
            ['/guides', 'weekly', '0.8'],
            ['/calendar', 'daily', '0.7'],
            ['/games', 'weekly', '0.7'],
            ['/forum', 'hourly', '0.7'],
            ['/shop', 'weekly', '0.6'],
            /*
             * /giveaways is not here on purpose.
             *
             * The page answers `noindex, nofollow` — it was the only one of the
             * forty-four in this list that contradicted itself, asking Google to
             * come and then turning it away on arrival. Of the two ways to
             * settle that, the editorial call was to keep the page out of search
             * rather than open it up.
             *
             * If that changes, remove the noindex on app/giveaways/page.tsx
             * first and put the row back second — in that order, so there is
             * never a moment where the sitemap is inviting a crawler to a
             * closed door.
             */
            ['/frontiers', 'weekly', '0.6'],
            ['/last-disc', 'weekly', '0.6'],
            ['/last-disc/letter', 'monthly', '0.5'],

            /*
             * The Tools menu, which was never submitted.
             *
             * All five entries are linked from the header and three of them
             * appeared in no sitemap at all — including /wow-analyzer, which
             * carries WebApplication, a five-question FAQPage and breadcrumbs,
             * and is the best-marked single page on the site.
             */
            ['/wow-analyzer', 'monthly', '0.7'],
            ['/backlog-advisor', 'monthly', '0.6'],
            ['/lists', 'daily', '0.6'],
            ['/about', 'monthly', '0.5'],
            ['/contact', 'monthly', '0.5'],
            ['/impressum', 'yearly', '0.3'],
            ['/marketing', 'monthly', '0.5'],
            ['/rating-system', 'monthly', '0.4'],
            ['/roadmap', 'monthly', '0.4'],
            ['/support', 'monthly', '0.5'],
            ['/privacy', 'yearly', '0.2'],
            ['/terms', 'yearly', '0.2'],
            ['/cookies', 'yearly', '0.2'],

            // GTA 6 hub — high-value evergreen pages
            ['/gta6', 'daily', '0.95'],
            ['/gta6/map', 'weekly', '0.9'],
            ['/gta6/characters', 'weekly', '0.9'],
            ['/gta6/vehicles', 'weekly', '0.85'],
            ['/gta6/weapons', 'weekly', '0.85'],
            ['/gta6/everything-we-know', 'weekly', '0.9'],
        ];

        foreach ($staticPages as [$page, $changefreq, $priority]) {
            $xml .= $this->urlEntry("{$this->frontendUrl}{$page}", null, $changefreq, $priority);
        }

        // GTA 6 character profile pages (vehicles/weapons have no detail pages)
        Gta6Character::where('is_published', true)
            ->select('slug', 'updated_at')
            ->orderBy('slug')
            ->each(function (Gta6Character $character) use (&$xml) {
                $xml .= $this->urlEntry(
                    "{$this->frontendUrl}/gta6/characters/{$character->slug}",
                    $character->updated_at?->toIso8601String(),
                    'monthly',
                    '0.75'
                );
            });

        $xml .= '</urlset>';

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }

    /**
     * Articles Sitemap - news, reviews, hardware
     */
    public function articles(): Response
    {
        $xml = $this->xmlHeader();

        $articles = Article::where('status', 'published')
            ->with('category:id,type')
            ->select('slug', 'category_id', 'updated_at')
            ->orderBy('updated_at', 'desc')
            ->limit(10000)
            ->get();

        foreach ($articles as $article) {
            $categoryType = $article->category->type ?? 'news';
            $type = self::getArticleTypePath($categoryType);
            $xml .= $this->urlEntry(
                "{$this->frontendUrl}/{$type}/{$article->slug}",
                $article->updated_at->toIso8601String(),
                'weekly',
                '0.7'
            );
        }

        $xml .= '</urlset>';

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }

    /**
     * Category Pages Sitemap
     * Format: /news/gaming, /reviews/aaa-titles, /tech/benchmarks
     */
    public function categories(): Response
    {
        $xml = $this->xmlHeader();

        /*
         * How many published pieces each category actually holds.
         *
         * An archive with nothing in it is not worth a crawl, and submitting it
         * is worse than silence: /reviews/retro, /hardware/benchmarks and
         * /hardware/guides were all in this file with zero articles behind
         * them, and the pages now answer noindex — so the sitemap was asking
         * Google to fetch three URLs that turn it away on arrival.
         *
         * Counted rather than listed. When a category fills up it returns here
         * on the next generation with nobody having to remember it.
         */
        $counts = Article::query()
            ->where('status', 'published')
            ->join('categories', 'categories.id', '=', 'articles.category_id')
            ->selectRaw('categories.slug as slug, count(*) as total')
            ->groupBy('categories.slug')
            ->pluck('total', 'slug');

        // News categories - URL format: /news/gaming, DB slug: news-gaming
        $newsCategories = ['gaming', 'pc', 'consoles', 'movies-tv', 'industry', 'e-sport', 'opinions', 'interviews'];
        foreach ($newsCategories as $cat) {
            if (($counts["news-{$cat}"] ?? 0) < 1) {
                continue;
            }
            $xml .= $this->urlEntry("{$this->frontendUrl}/news/{$cat}", null, 'daily', '0.6');
        }

        /*
         * Review categories - URL format: /reviews/aaa-titles, DB slug:
         * reviews-aaa-titles.
         *
         * `latest` is not a category at all: ReviewController treats
         * `reviews-latest` as "every review, no extra filter", so nothing is
         * ever assigned to it and counting rows against it returns zero. It
         * showed 38 reviews while the count said none, and the first version of
         * this filter dropped the page because of it.
         *
         * It is listed here rather than counted, and it earns its place from
         * the section having any reviews at all.
         */
        $anyReview = collect($counts)->filter(
            fn ($n, $slug) => str_starts_with((string) $slug, 'reviews-') && $n > 0
        )->isNotEmpty();

        if ($anyReview) {
            $xml .= $this->urlEntry("{$this->frontendUrl}/reviews/latest", null, 'daily', '0.6');
        }

        foreach (['aaa-titles', 'editors-choice', 'indie-gems', 'retro'] as $cat) {
            if (($counts["reviews-{$cat}"] ?? 0) < 1) {
                continue;
            }
            $xml .= $this->urlEntry("{$this->frontendUrl}/reviews/{$cat}", null, 'daily', '0.6');
        }

        // Hardware categories - URL format: /hardware/benchmarks
        //
        // These were emitted under /tech/ until 17 Aug 2026. The section moved
        // to /hardware and the sitemap was never updated, so four of the
        // seventeen URLs here pointed at pages that answer 404 — measured
        // against production, all four.
        //
        // The slugs are duplicated from the frontend's HARDWARE_CATEGORIES,
        // which is what let them drift in the first place. Worth noting for
        // whoever moves a section next: this list and that one have to be
        // changed together.
        //
        // The DB slug is not the URL segment here: /hardware/news is
        // `tech-tech-news`, because the section's own prefix is `tech` and the
        // category is called `tech-news`. Getting that wrong reads as an empty
        // category and drops a page with 39 articles.
        $hardwareCategories = ['reviews' => 'tech-reviews', 'benchmarks' => 'tech-benchmarks', 'guides' => 'tech-guides', 'news' => 'tech-tech-news'];
        foreach ($hardwareCategories as $cat => $dbSlug) {
            if (($counts[$dbSlug] ?? 0) < 1) {
                continue;
            }
            $xml .= $this->urlEntry("{$this->frontendUrl}/hardware/{$cat}", null, 'weekly', '0.6');
        }

        $xml .= '</urlset>';

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }

    /**
     * Guides Sitemap
     */
    public function guides(): Response
    {
        $xml = $this->xmlHeader();

        $guides = Guide::where('status', 'published')
            ->where('is_noindex', false)
            ->select('slug', 'updated_at')
            ->orderBy('updated_at', 'desc')
            ->limit(5000)
            ->get();

        if ($guides->isEmpty()) {
            $xml .= $this->urlEntry("{$this->frontendUrl}/guides", null, 'weekly', '0.8');
        }

        foreach ($guides as $guide) {
            $xml .= $this->urlEntry(
                "{$this->frontendUrl}/guides/{$guide->slug}",
                $guide->updated_at->toIso8601String(),
                'monthly',
                '0.6'
            );
        }

        $xml .= '</urlset>';

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }

    /**
     * Products Sitemap (Shop)
     */
    public function products(): Response
    {
        $xml = $this->xmlHeader();

        $products = Product::where('is_active', true)
            ->select('slug', 'updated_at')
            ->orderBy('updated_at', 'desc')
            ->limit(5000)
            ->get();

        if ($products->isEmpty()) {
            $xml .= $this->urlEntry("{$this->frontendUrl}/shop", null, 'weekly', '0.6');
        }

        foreach ($products as $product) {
            $xml .= $this->urlEntry(
                "{$this->frontendUrl}/shop/{$product->slug}",
                $product->updated_at->toIso8601String(),
                'weekly',
                '0.5'
            );
        }

        $xml .= '</urlset>';

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }

    /**
     * Google News Sitemap (last 48 hours)
     */
    public function news(): Response
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">'."\n";

        // Both ends of the window, not just the lower one.
        //
        // Scheduling here is done with `status = 'scheduled'`, so a *published*
        // article dated in the future is a mistyped date rather than an
        // intention — and with only a lower bound it never leaves this file
        // again, because "later than 48 hours ago" stays true forever. That is
        // what happened: one article dated 14 Nov 2026 sat here from August
        // onward as the sole entry, and Google News rejects a future
        // publication date outright, so the feed was rejected with it.
        $articles = Article::where('status', 'published')
            ->whereBetween('published_at', [now()->subHours(48), now()])
            ->with('category:id,type')
            ->select('slug', 'category_id', 'title', 'published_at')
            ->orderBy('published_at', 'desc')
            ->get();

        if ($articles->isEmpty()) {
            $xml .= "  <url>\n";
            $xml .= "    <loc>{$this->frontendUrl}/news</loc>\n";
            $xml .= "    <changefreq>hourly</changefreq>\n";
            $xml .= "    <priority>0.9</priority>\n";
            $xml .= "  </url>\n";
        }

        foreach ($articles as $article) {
            $categoryType = $article->category->type ?? 'news';
            $type = self::getArticleTypePath($categoryType);
            $xml .= "  <url>\n";
            $xml .= "    <loc>{$this->frontendUrl}/{$type}/{$article->slug}</loc>\n";
            $xml .= "    <news:news>\n";
            $xml .= "      <news:publication>\n";
            $xml .= "        <news:name>TechPlay</news:name>\n";
            $xml .= "        <news:language>en</news:language>\n";
            $xml .= "      </news:publication>\n";
            $xml .= '      <news:publication_date>'.$article->published_at->toIso8601String()."</news:publication_date>\n";
            $xml .= '      <news:title>'.htmlspecialchars($article->title)."</news:title>\n";
            $xml .= "    </news:news>\n";
            $xml .= "  </url>\n";
        }

        $xml .= '</urlset>';

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }

    /**
     * Image Sitemap
     */
    public function images(): Response
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'."\n";

        $articles = Article::where('status', 'published')
            ->whereNotNull('featured_image_url')
            ->with('category:id,type')
            ->select('slug', 'category_id', 'title', 'featured_image_url', 'updated_at')
            ->orderBy('updated_at', 'desc')
            ->limit(5000)
            ->get();

        foreach ($articles as $article) {
            $categoryType = $article->category->type ?? 'news';
            $type = self::getArticleTypePath($categoryType);
            $xml .= "  <url>\n";
            $xml .= "    <loc>{$this->frontendUrl}/{$type}/{$article->slug}</loc>\n";
            $xml .= "    <image:image>\n";
            $xml .= "      <image:loc>{$article->featured_image_url}</image:loc>\n";
            $xml .= '      <image:title>'.htmlspecialchars($article->title)."</image:title>\n";
            $xml .= "    </image:image>\n";
            $xml .= "  </url>\n";
        }

        $xml .= '</urlset>';

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }

    /**
     * Hub Pages Sitemap — genre, platform, year, popular tags
     */
    public function hub(): Response
    {
        $xml = $this->xmlHeader();

        $genres = [
            'action', 'indie', 'adventure', 'rpg', 'strategy', 'shooter',
            'casual', 'simulation', 'puzzle', 'arcade', 'platformer', 'racing',
            'sports', 'massively-multiplayer', 'family', 'fighting', 'board-games',
            'educational', 'card', 'dungeon-crawler', 'point-and-click', 'horror',
        ];

        $platforms = ['pc', 'playstation', 'xbox', 'nintendo', 'mobile'];

        /*
         * Tags that exist in the catalogue, not tags that sound like they
         * should.
         *
         * This list carried twenty and thirteen of them matched no games at
         * all, while every one answered index,follow — so the sitemap invited
         * Google to thirteen empty pages. The vocabulary had moved under it:
         * the August rebuild replaced RAWG's tags with MobyGames', and Steam
         * words like multiplayer, singleplayer, co-op, story-rich, souls-like
         * and pixel-graphics simply do not appear in the data.
         *
         * Seven of the thirteen were mapping bugs rather than missing data and
         * are fixed in lib/gameFacets.ts — "Sci-Fi / Futuristic" against a
         * value stored as "Sci-fi / futuristic" was 18,396 games behind one
         * capital letter.
         *
         * The six with no equivalent are gone from here. Their pages still
         * render, and the frontend noindexes any facet whose shelf comes back
         * empty, so this list does not have to be right forever — it only has
         * to stop asking for pages we know are bare.
         */
        $popularTags = [
            'open-world', 'first-person', 'third-person', 'sandbox', 'survival',
            'stealth', 'turn-based', 'roguelike', 'metroidvania', 'hack-and-slash',
            'anime', 'sci-fi', 'fantasy', 'post-apocalyptic',
        ];

        foreach ($genres as $genre) {
            $xml .= $this->urlEntry("{$this->frontendUrl}/games/genre/{$genre}", null, 'weekly', '0.7');
        }

        foreach ($platforms as $platform) {
            $xml .= $this->urlEntry("{$this->frontendUrl}/games/platform/{$platform}", null, 'weekly', '0.7');
        }

        for ($year = (int) now()->year; $year >= 1990; $year--) {
            $priority = $year >= 2015 ? '0.6' : '0.4';
            $xml .= $this->urlEntry("{$this->frontendUrl}/games/year/{$year}", null, 'monthly', $priority);
        }

        foreach ($popularTags as $tag) {
            $xml .= $this->urlEntry("{$this->frontendUrl}/games/tag/{$tag}", null, 'weekly', '0.6');
        }

        $xml .= '</urlset>';

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }

    /**
     * Games Sitemap (paginated — 50,000 per file)
     */
    public function games(int $page = 1): Response
    {
        $perPage = 50000;

        // A page beyond the catalogue is not an empty sitemap, it is a page
        // that does not exist.
        //
        // Until 17 Aug 2026 this returned "<urlset></urlset>" with a 200 for
        // any page number at all. It went unnoticed because static files in
        // public/ answered first — and the moment those were pruned, the route
        // began serving empty sitemaps for pages 4 and 5, which is exactly what
        // the pruning had just removed. A crawler holding an old URL would keep
        // fetching them and be told, with a 200, that they are still valid.
        $total = Game::indexable()->count();
        $lastPage = max(1, (int) ceil($total / $perPage));

        if ($page > $lastPage) {
            abort(404);
        }

        $xml = $this->xmlHeader();

        Game::indexable()
            ->select('slug', 'updated_at')
            ->orderBy('slug')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->each(function (Game $game) use (&$xml) {
                // Skip junk slugs like "-", "_", "_____" that survived import
                if (! preg_match('/[a-z0-9]/i', (string) $game->slug)) {
                    return;
                }
                $xml .= $this->urlEntry(
                    "{$this->frontendUrl}/games/{$game->slug}",
                    $game->updated_at?->toIso8601String(),
                    'monthly',
                    '0.8'
                );
            });

        $xml .= '</urlset>';

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }

    /**
     * The studios worth crawling.
     *
     * 56,911 have a page, because every game page links to its studio and a
     * link that 404s is worse than a thin page. Only the 31,536 with two games
     * or something written about them go in here — `indexable` carries that
     * decision, and the studio page sends the rest `noindex, follow` so the
     * links out of them still count.
     */
    public function studios(): Response
    {
        $xml = $this->xmlHeader();

        Studio::where('indexable', true)
            ->select('slug', 'updated_at')
            ->orderByDesc('games_count')
            ->each(function (Studio $studio) use (&$xml) {
                if (! preg_match('/[a-z0-9]/i', (string) $studio->slug)) {
                    return;
                }

                $xml .= $this->urlEntry(
                    "{$this->frontendUrl}/studios/{$studio->slug}",
                    $studio->updated_at?->toIso8601String(),
                    'monthly',
                    '0.6'
                );
            });

        $xml .= '</urlset>';

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }

    /**
     * Is there a single list worth naming in a sitemap?
     *
     * Shared with GenerateSitemap on purpose. The index and the writer have to
     * agree exactly, or the index names a file nothing ever writes — which is
     * how sitemap-videos.xml outlived its own section.
     */
    public static function hasPublishedLists(): bool
    {
        return GameList::where('is_public', true)
            ->where('is_draft', false)
            ->whereHas('items')
            ->exists();
    }

    /**
     * Published member lists.
     *
     * Only the ones a stranger can actually open: a draft or a private list
     * answers 404 at its public URL, and a sitemap full of 404s is worse than
     * one that never mentioned them.
     *
     * An empty list is left out too. It is a real page, but it is a page with
     * nothing on it, and four of the first seven lists on this site were empty.
     */
    public function lists(): Response
    {
        $xml = $this->xmlHeader();

        GameList::query()
            ->where('is_public', true)
            ->where('is_draft', false)
            ->whereHas('items')
            ->with('user:id,username')
            ->select('id', 'user_id', 'slug', 'updated_at')
            ->orderByDesc('updated_at')
            ->each(function (GameList $list) use (&$xml) {
                if (blank($list->user?->username) || blank($list->slug)) {
                    return;
                }

                $xml .= $this->urlEntry(
                    "{$this->frontendUrl}/lists/{$list->user->username}/{$list->slug}",
                    $list->updated_at?->toIso8601String(),
                    'weekly',
                    '0.6'
                );
            });

        $xml .= '</urlset>';

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }

    // ========== Helper Methods ==========

    private function xmlHeader(): string
    {
        return '<?xml version="1.0" encoding="UTF-8"?>'."\n".
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";
    }

    private function urlEntry(string $loc, ?string $lastmod = null, string $changefreq = 'weekly', string $priority = '0.5'): string
    {
        $xml = "  <url>\n";
        $xml .= "    <loc>{$loc}</loc>\n";
        if ($lastmod) {
            $xml .= "    <lastmod>{$lastmod}</lastmod>\n";
        }
        $xml .= "    <changefreq>{$changefreq}</changefreq>\n";
        $xml .= "    <priority>{$priority}</priority>\n";
        $xml .= "  </url>\n";

        return $xml;
    }

    public static function getArticleTypePath(string $type): string
    {
        return match ($type) {
            'review', 'reviews' => 'reviews',
            'hardware', 'tech' => 'hardware',
            'guide', 'guides' => 'guides',
            default => 'news',
        };
    }
}
