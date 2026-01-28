<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Services\SchemaService;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    /**
     * Main Sitemap Index - links to all sub-sitemaps
     */
    public function index(): Response
    {
        $frontendUrl = config('app.frontend_url', 'https://techplay.gg');
        $apiUrl = config('app.url', 'https://api-beta.techplay.gg');

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        // Main pages sitemap
        $xml .= "  <sitemap>\n";
        $xml .= "    <loc>{$apiUrl}/sitemap-pages.xml</loc>\n";
        $xml .= "    <lastmod>" . now()->toIso8601String() . "</lastmod>\n";
        $xml .= "  </sitemap>\n";

        // News sitemap
        $xml .= "  <sitemap>\n";
        $xml .= "    <loc>{$apiUrl}/sitemap-news.xml</loc>\n";
        $xml .= "    <lastmod>" . now()->toIso8601String() . "</lastmod>\n";
        $xml .= "  </sitemap>\n";

        // Images sitemap
        $xml .= "  <sitemap>\n";
        $xml .= "    <loc>{$apiUrl}/sitemap-images.xml</loc>\n";
        $xml .= "    <lastmod>" . now()->toIso8601String() . "</lastmod>\n";
        $xml .= "  </sitemap>\n";

        // Videos sitemap
        $xml .= "  <sitemap>\n";
        $xml .= "    <loc>{$apiUrl}/sitemap-videos.xml</loc>\n";
        $xml .= "    <lastmod>" . now()->toIso8601String() . "</lastmod>\n";
        $xml .= "  </sitemap>\n";

        $xml .= '</sitemapindex>';

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }

    /**
     * Pages Sitemap - static pages and article URLs
     */
    public function pages(): Response
    {
        $frontendUrl = config('app.frontend_url', 'https://techplay.gg');

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        // Static pages
        $staticPages = ['/', '/news', '/reviews', '/hardware', '/videos', '/guides', '/calendar', '/games', '/forum', '/shop', '/about', '/contact', '/impressum', '/marketing'];
        foreach ($staticPages as $page) {
            $xml .= "  <url>\n";
            $xml .= "    <loc>{$frontendUrl}{$page}</loc>\n";
            $xml .= "    <changefreq>daily</changefreq>\n";
            $xml .= "    <priority>" . ($page === '/' ? '1.0' : '0.8') . "</priority>\n";
            $xml .= "  </url>\n";
        }

        // All published articles
        $articles = Article::where('status', 'published')
            ->select('slug', 'type', 'updated_at')
            ->orderBy('updated_at', 'desc')
            ->limit(10000)
            ->get();

        foreach ($articles as $article) {
            $type = $article->type === 'review' ? 'reviews' : ($article->type === 'hardware' ? 'hardware' : 'news');
            $xml .= "  <url>\n";
            $xml .= "    <loc>{$frontendUrl}/{$type}/{$article->slug}</loc>\n";
            $xml .= "    <lastmod>" . $article->updated_at->toIso8601String() . "</lastmod>\n";
            $xml .= "    <changefreq>weekly</changefreq>\n";
            $xml .= "    <priority>0.6</priority>\n";
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
        $articles = Article::where('status', 'published')
            ->whereNotNull('featured_image_url')
            ->select('slug', 'title', 'featured_image_url', 'updated_at')
            ->orderBy('updated_at', 'desc')
            ->limit(5000)
            ->get();

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' . "\n";

        foreach ($articles as $article) {
            $xml .= "  <url>\n";
            $xml .= "    <loc>" . config('app.frontend_url') . "/news/{$article->slug}</loc>\n";
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
     * Video Sitemap
     */
    public function videos(): Response
    {
        $articles = Article::where('status', 'published')
            ->where(function ($q) {
                $q->where('content', 'LIKE', '%youtube.com%')
                    ->orWhere('content', 'LIKE', '%youtu.be%')
                    ->orWhere('content', 'LIKE', '%twitch.tv%');
            })
            ->select('slug', 'title', 'excerpt', 'content', 'published_at', 'updated_at')
            ->orderBy('updated_at', 'desc')
            ->limit(1000)
            ->get();

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">' . "\n";

        foreach ($articles as $article) {
            $videos = SchemaService::getVideoSchema($article);

            foreach ($videos as $video) {
                $xml .= "  <url>\n";
                $xml .= "    <loc>" . config('app.frontend_url') . "/news/{$article->slug}</loc>\n";
                $xml .= "    <video:video>\n";
                $xml .= "      <video:title>" . htmlspecialchars($video['name'] ?? $article->title) . "</video:title>\n";
                $xml .= "      <video:description>" . htmlspecialchars($video['description'] ?? '') . "</video:description>\n";
                if (isset($video['thumbnailUrl'])) {
                    $xml .= "      <video:thumbnail_loc>{$video['thumbnailUrl']}</video:thumbnail_loc>\n";
                }
                if (isset($video['embedUrl'])) {
                    $xml .= "      <video:player_loc>{$video['embedUrl']}</video:player_loc>\n";
                }
                $xml .= "    </video:video>\n";
                $xml .= "  </url>\n";
            }
        }

        $xml .= '</urlset>';

        return response($xml, 200)->header('Content-Type', 'application/xml');
    }

    /**
     * News Sitemap (last 48 hours for Google News)
     */
    public function news(): Response
    {
        $articles = Article::where('status', 'published')
            ->where('published_at', '>=', now()->subHours(48))
            ->select('slug', 'title', 'published_at')
            ->orderBy('published_at', 'desc')
            ->get();

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">' . "\n";

        foreach ($articles as $article) {
            $xml .= "  <url>\n";
            $xml .= "    <loc>" . config('app.frontend_url') . "/news/{$article->slug}</loc>\n";
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
}
