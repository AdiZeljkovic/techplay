<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Game;
use App\Models\Guide;
use App\Models\Video;
use App\Models\Product;
use App\Models\Category;
use App\Models\Giveaway;
use App\Services\SchemaService;
use Carbon\Carbon;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    private string $frontendUrl;
    private string $apiUrl;
    private const CACHE_TTL = 3600; // 1 hour cache

    public function __construct()
    {
        $this->frontendUrl = config('app.frontend_url', 'https://techplay.gg');
        $this->apiUrl = config('app.url', 'https://api-beta.techplay.gg');
    }

    /**
     * Main Sitemap Index - links to all sub-sitemaps
     * Only includes sitemaps that have content to avoid Google "Missing XML tag" errors
     */
    public function index(): Response
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

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
        if (Video::whereNotNull('published_at')->exists()) {
            $sitemaps[] = 'sitemap-videos.xml';
        }
        if (Product::where('is_active', true)->exists()) {
            $sitemaps[] = 'sitemap-products.xml';
        }
        if (Article::where('status', 'published')->where('published_at', '>=', now()->subHours(48))->exists()) {
            $sitemaps[] = 'sitemap-news.xml';
        }
        if (Article::where('status', 'published')->whereNotNull('featured_image_url')->exists()) {
            $sitemaps[] = 'sitemap-images.xml';
        }

        // Get actual last-modified dates per sitemap type
        $lastmod = Cache::remember('sitemap.index.lastmod', 300, function () {
            $articleLastmod = Article::where('status', 'published')->max('updated_at');
            $guideLastmod   = Guide::where('status', 'published')->max('updated_at');
            $videoLastmod   = Video::whereNotNull('published_at')->max('published_at');
            $productLastmod = Product::where('is_active', true)->max('updated_at');
            return [
                'sitemap-hub.xml'        => now()->subDays(7)->toIso8601String(),
                'sitemap-pages.xml'      => now()->subDays(7)->toIso8601String(),
                'sitemap-articles.xml'   => $articleLastmod ? \Carbon\Carbon::parse($articleLastmod)->toIso8601String() : now()->toIso8601String(),
                'sitemap-categories.xml' => now()->subDays(7)->toIso8601String(),
                'sitemap-guides.xml'     => $guideLastmod ? \Carbon\Carbon::parse($guideLastmod)->toIso8601String() : now()->toIso8601String(),
                'sitemap-videos.xml'     => $videoLastmod ? \Carbon\Carbon::parse($videoLastmod)->toIso8601String() : now()->toIso8601String(),
                'sitemap-products.xml'   => $productLastmod ? \Carbon\Carbon::parse($productLastmod)->toIso8601String() : now()->toIso8601String(),
                'sitemap-news.xml'       => $articleLastmod ? \Carbon\Carbon::parse($articleLastmod)->toIso8601String() : now()->toIso8601String(),
                'sitemap-images.xml'     => $articleLastmod ? \Carbon\Carbon::parse($articleLastmod)->toIso8601String() : now()->toIso8601String(),
            ];
        });

        // Game sitemaps — paginated, 50,000 URLs per file (Google limit)
        $gamesCount = Game::whereNotNull('details_crawled_at')->count();
        if ($gamesCount > 0) {
            $gamePages = (int) ceil($gamesCount / 50000);
            $gameLastmodRaw = Game::whereNotNull('details_crawled_at')->max('details_crawled_at');
            $gameLastmodStr = $gameLastmodRaw ? Carbon::parse($gameLastmodRaw)->toIso8601String() : now()->toIso8601String();
            for ($p = 1; $p <= $gamePages; $p++) {
                $filename = "sitemap-games-{$p}.xml";
                $sitemaps[] = $filename;
                $lastmod[$filename] = $gameLastmodStr;
            }
        }

        foreach ($sitemaps as $sitemap) {
            $xml .= "  <sitemap>\n";
            $xml .= "    <loc>{$this->frontendUrl}/{$sitemap}</loc>\n";
            $xml .= "    <lastmod>" . ($lastmod[$sitemap] ?? now()->toIso8601String()) . "</lastmod>\n";
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
            ['/videos', 'daily', '0.8'],
            ['/guides', 'weekly', '0.8'],
            ['/calendar', 'daily', '0.7'],
            ['/games', 'weekly', '0.7'],
            ['/forum', 'hourly', '0.7'],
            ['/shop', 'weekly', '0.6'],
            ['/giveaways', 'weekly', '0.6'],
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
        ];

        foreach ($staticPages as [$page, $changefreq, $priority]) {
            $xml .= $this->urlEntry("{$this->frontendUrl}{$page}", null, $changefreq, $priority);
        }

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

        // News categories - URL format: /news/gaming
        $newsCategories = ['gaming', 'pc', 'consoles', 'movies-tv', 'industry', 'e-sport', 'opinions', 'interviews'];
        foreach ($newsCategories as $cat) {
            $xml .= $this->urlEntry("{$this->frontendUrl}/news/{$cat}", null, 'daily', '0.6');
        }

        // Review categories - URL format: /reviews/aaa-titles
        $reviewCategories = ['aaa-titles', 'editors-choice', 'indie-gems', 'latest', 'retro'];
        foreach ($reviewCategories as $cat) {
            $xml .= $this->urlEntry("{$this->frontendUrl}/reviews/{$cat}", null, 'daily', '0.6');
        }

        // Tech categories - URL format: /tech/benchmarks
        $techCategories = ['benchmarks', 'guides', 'reviews', 'news'];
        foreach ($techCategories as $cat) {
            $xml .= $this->urlEntry("{$this->frontendUrl}/tech/{$cat}", null, 'weekly', '0.6');
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
     * Videos Sitemap (standalone videos, not article embeds)
     */
    public function videos(): Response
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">' . "\n";

        $videos = Video::whereNotNull('published_at')
            ->select('slug', 'title', 'youtube_url', 'thumbnail_url', 'published_at')
            ->orderBy('published_at', 'desc')
            ->limit(2000)
            ->get();

        if ($videos->isEmpty()) {
            $xml .= "  <url>\n";
            $xml .= "    <loc>{$this->frontendUrl}/videos</loc>\n";
            $xml .= "    <changefreq>daily</changefreq>\n";
            $xml .= "    <priority>0.8</priority>\n";
            $xml .= "  </url>\n";
        }

        foreach ($videos as $video) {
            $xml .= "  <url>\n";
            $xml .= "    <loc>{$this->frontendUrl}/videos/{$video->slug}</loc>\n";
            $xml .= "    <video:video>\n";
            $xml .= "      <video:title>" . htmlspecialchars($video->title) . "</video:title>\n";
            $xml .= "      <video:description>" . htmlspecialchars($video->title) . "</video:description>\n";
            if ($video->thumbnail_url) {
                $xml .= "      <video:thumbnail_loc>{$video->thumbnail_url}</video:thumbnail_loc>\n";
            }
            if ($video->youtube_url) {
                $xml .= "      <video:player_loc>{$video->youtube_url}</video:player_loc>\n";
            }
            $xml .= "      <video:publication_date>" . $video->published_at->toIso8601String() . "</video:publication_date>\n";
            $xml .= "    </video:video>\n";
            $xml .= "  </url>\n";
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
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">' . "\n";

        $articles = Article::where('status', 'published')
            ->where('published_at', '>=', now()->subHours(48))
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
            $xml .= "      <news:publication_date>" . $article->published_at->toIso8601String() . "</news:publication_date>\n";
            $xml .= "      <news:title>" . htmlspecialchars($article->title) . "</news:title>\n";
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
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' . "\n";

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
            $xml .= "      <image:title>" . htmlspecialchars($article->title) . "</image:title>\n";
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

        $popularTags = [
            'open-world', 'multiplayer', 'singleplayer', 'co-op', 'story-rich',
            'first-person', 'third-person', 'sandbox', 'survival', 'stealth',
            'turn-based', 'roguelike', 'metroidvania', 'souls-like', 'hack-and-slash',
            'pixel-graphics', 'anime', 'sci-fi', 'fantasy', 'post-apocalyptic',
        ];

        foreach ($genres as $genre) {
            $xml .= $this->urlEntry("{$this->frontendUrl}/games/genre/{$genre}", null, 'weekly', '0.7');
        }

        foreach ($platforms as $platform) {
            $xml .= $this->urlEntry("{$this->frontendUrl}/games/platform/{$platform}", null, 'weekly', '0.7');
        }

        for ($year = 2025; $year >= 1990; $year--) {
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
        $xml = $this->xmlHeader();

        Game::whereNotNull('details_crawled_at')
            ->whereRaw("details_data->>'description_raw' IS NOT NULL")
            ->whereRaw("LENGTH(details_data->>'description_raw') > 50")
            ->select('slug', 'details_crawled_at')
            ->orderBy('slug')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->each(function (Game $game) use (&$xml) {
                $xml .= $this->urlEntry(
                    "{$this->frontendUrl}/games/{$game->slug}",
                    $game->details_crawled_at->toIso8601String(),
                    'monthly',
                    '0.8'
                );
            });

        $xml .= '</urlset>';
        return response($xml, 200)->header('Content-Type', 'application/xml');
    }

    // ========== Helper Methods ==========

    private function xmlHeader(): string
    {
        return '<?xml version="1.0" encoding="UTF-8"?>' . "\n" .
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
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
            'hardware', 'tech'  => 'hardware',
            'guide', 'guides'   => 'guides',
            default             => 'news',
        };
    }
}
