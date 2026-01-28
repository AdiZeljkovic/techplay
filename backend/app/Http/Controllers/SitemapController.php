<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Guide;
use App\Models\Video;
use App\Models\Product;
use App\Models\Category;
use App\Models\Giveaway;
use App\Services\SchemaService;
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
     */
    public function index(): Response
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        $sitemaps = [
            'sitemap-pages.xml',
            'sitemap-articles.xml',
            'sitemap-categories.xml',
            'sitemap-guides.xml',
            'sitemap-videos.xml',
            'sitemap-products.xml',
            'sitemap-news.xml',
            'sitemap-images.xml',
        ];

        foreach ($sitemaps as $sitemap) {
            $xml .= "  <sitemap>\n";
            $xml .= "    <loc>{$this->apiUrl}/{$sitemap}</loc>\n";
            $xml .= "    <lastmod>" . now()->toIso8601String() . "</lastmod>\n";
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
            $type = $this->getArticleTypePath($categoryType);
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
     * Format: /news/gaming, /reviews/gaming, /hardware/gpus
     */
    public function categories(): Response
    {
        $xml = $this->xmlHeader();

        // News categories
        $newsCategories = ['gaming', 'esports', 'industry', 'entertainment', 'tech'];
        foreach ($newsCategories as $cat) {
            $xml .= $this->urlEntry("{$this->frontendUrl}/news/{$cat}", null, 'daily', '0.6');
        }

        // Review categories
        $reviewCategories = ['games', 'hardware', 'peripherals', 'software'];
        foreach ($reviewCategories as $cat) {
            $xml .= $this->urlEntry("{$this->frontendUrl}/reviews/{$cat}", null, 'daily', '0.6');
        }

        // Hardware/Tech categories - use /hardware not /tech for URLs
        $hardwareCategories = ['gpus', 'cpus', 'motherboards', 'ram', 'storage', 'cases', 'psus', 'cooling', 'peripherals', 'monitors', 'laptops'];
        foreach ($hardwareCategories as $cat) {
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

        foreach ($articles as $article) {
            $categoryType = $article->category->type ?? 'news';
            $type = $this->getArticleTypePath($categoryType);
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
            $type = $this->getArticleTypePath($categoryType);
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

    private function getArticleTypePath(string $type): string
    {
        return match ($type) {
            'review' => 'reviews',
            'hardware' => 'hardware',
            default => 'news',
        };
    }
}
