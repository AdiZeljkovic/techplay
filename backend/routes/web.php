<?php

use App\Http\Controllers\RssController;
use App\Http\Controllers\SitemapController;
use App\Models\SiteSetting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Sitemaps
Route::get('/feed', [RssController::class, 'index']);
Route::get('/sitemap.xml', [SitemapController::class, 'index']);
Route::get('/sitemap-pages.xml', [SitemapController::class, 'pages']);
Route::get('/sitemap-articles.xml', [SitemapController::class, 'articles']);
Route::get('/sitemap-categories.xml', [SitemapController::class, 'categories']);
Route::get('/sitemap-guides.xml', [SitemapController::class, 'guides']);
Route::get('/sitemap-products.xml', [SitemapController::class, 'products']);
Route::get('/sitemap-news.xml', [SitemapController::class, 'news']);
Route::get('/sitemap-images.xml', [SitemapController::class, 'images']);
Route::get('/sitemap-games-{page}.xml', [SitemapController::class, 'games'])->where('page', '[1-9][0-9]*');

// Dynamic robots.txt from admin panel
Route::get('/robots.txt', function () {
    $content = SiteSetting::get('seo_robots_txt_content', "User-agent: *\nAllow: /");

    // Append sitemap URL (use frontend URL, not backend API URL)
    $sitemapUrl = rtrim(env('FRONTEND_URL', config('app.url')), '/').'/sitemap.xml';
    if (! str_contains($content, 'Sitemap:')) {
        $content .= "\n\nSitemap: ".$sitemapUrl;
    }

    return response($content, 200)
        ->header('Content-Type', 'text/plain');
});

Route::get('/{key}.txt', function ($key) {
    $configuredKey = SiteSetting::get('seo_indexnow_key');
    if ($key === $configuredKey) {
        return response($key, 200)
            ->header('Content-Type', 'text/plain');
    }
    abort(404);
})->where('key', '[a-zA-Z0-9]+');

