<?php

namespace App\Console\Commands;

use App\Models\Article;
use App\Models\Category;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class GenerateSitemap extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sitemap:generate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate the sitemap.xml file';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Generating sitemap...');

        $baseUrl = config('app.url'); // Should be the Frontend URL ideally, but app.url might be Backend.
        // If Backend and Frontend are separate, we need Frontend URL.
        // Assuming NEXT_PUBLIC_APP_URL equivalent is stored in .env or config?
        // Let's use a hardcoded default or env('FRONTEND_URL') if available.
        $frontendUrl = env('FRONTEND_URL', 'https://techplay.gg');

        $urls = [];

        // Static Pages
        $staticPages = [
            '/' => ['priority' => '1.0', 'freq' => 'daily'],
            '/news' => ['priority' => '0.9', 'freq' => 'hourly'],
            '/reviews' => ['priority' => '0.9', 'freq' => 'daily'],
            '/videos' => ['priority' => '0.8', 'freq' => 'daily'],
            '/guides' => ['priority' => '0.8', 'freq' => 'weekly'],
            '/shop/products' => ['priority' => '0.8', 'freq' => 'daily'],
            '/staff' => ['priority' => '0.5', 'freq' => 'monthly'],
            '/support' => ['priority' => '0.6', 'freq' => 'monthly'],
            '/contact' => ['priority' => '0.5', 'freq' => 'yearly'],
        ];

        foreach ($staticPages as $path => $meta) {
            $urls[] = [
                'loc' => $frontendUrl . $path,
                'lastmod' => now()->toAtomString(),
                'changefreq' => $meta['freq'],
                'priority' => $meta['priority'],
            ];
        }

        // Categories
        $categories = Category::whereIn('type', ['news', 'reviews', 'tech'])->get();
        foreach ($categories as $category) {
            $path = $category->type === 'reviews' ? '/reviews' : '/news'; // Simplified mapping
            // Ideally: /news?category=slug or /news/category/slug?
            // Based on frontend code: /news?category=slug is used for filtering.
            // Search engines prefer distinct URLs. 
            // If frontend supports /news/category/slug, use that.
            // For now, let's map to /news?category=slug to be safe, although canoncial might fix it.
            // Wait, standard SEO prefers converting query params to path.
            // Since we didn't implement path-based category routes, let's use the query param version.
            $url = "{$frontendUrl}{$path}?category={$category->slug}";

            $urls[] = [
                'loc' => $url,
                'lastmod' => $category->updated_at->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '0.7',
            ];
        }

        // Articles (News & Reviews)
        $articles = Article::where('status', 'published')
            ->where('published_at', '<=', now())
            ->orderBy('updated_at', 'desc')
            ->get();

        foreach ($articles as $article) {
            // Determine path based on category type
            $type = $article->category->type ?? 'news';

            // Check if it is a review
            // ReviewController queries Article. 
            // TechPlay likely puts Reviews in /reviews/{slug} and News in /news/{slug}.
            // How to distinguish? ReviewResource filters by 'reviews' category type.

            $base = 'news';
            if ($type === 'reviews') {
                $base = 'reviews';
            } elseif ($type === 'tech') {
                // Could be hardware review or news. 
                // Let's assume hardware reviews go to /reviews if they are reviews.
                // But simplified: use 'news' unless explicitly 'reviews'.
                // Actually, if I look at frontend routing... /reviews connects to ReviewController which filters types 'reviews' and 'tech'.
                // So 'tech' categories are treated as reviews?
                $base = 'reviews';
            }

            $urls[] = [
                'loc' => "{$frontendUrl}/{$base}/{$article->slug}",
                'lastmod' => $article->updated_at->toAtomString(),
                'changefreq' => 'monthly', // Articles don't change often
                'priority' => '0.6',
            ];
        }

        // Generate XML
        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        foreach ($urls as $url) {
            $xml .= '<url>';
            $xml .= "<loc>{$url['loc']}</loc>";
            $xml .= "<lastmod>{$url['lastmod']}</lastmod>";
            $xml .= "<changefreq>{$url['changefreq']}</changefreq>";
            $xml .= "<priority>{$url['priority']}</priority>";
            $xml .= '</url>';
        }

        $xml .= '</urlset>';

        File::put(public_path('sitemap.xml'), $xml);
        $this->info('Sitemap generated successfully at ' . public_path('sitemap.xml'));
    }
}
