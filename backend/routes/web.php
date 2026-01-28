<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SitemapController;

Route::get('/', function () {
    return view('welcome');
});

// Sitemaps
Route::get('/feed', [App\Http\Controllers\RssController::class, 'index']);
Route::get('/sitemap.xml', [SitemapController::class, 'index']);
Route::get('/sitemap-pages.xml', [SitemapController::class, 'pages']);
Route::get('/sitemap-articles.xml', [SitemapController::class, 'articles']);
Route::get('/sitemap-categories.xml', [SitemapController::class, 'categories']);
Route::get('/sitemap-guides.xml', [SitemapController::class, 'guides']);
Route::get('/sitemap-videos.xml', [SitemapController::class, 'videos']);
Route::get('/sitemap-products.xml', [SitemapController::class, 'products']);
Route::get('/sitemap-news.xml', [SitemapController::class, 'news']);
Route::get('/sitemap-images.xml', [SitemapController::class, 'images']);

// Dynamic robots.txt from admin panel
Route::get('/robots.txt', function () {
    $content = \App\Models\SiteSetting::get('seo_robots_txt_content', "User-agent: *\nAllow: /");

    // Append sitemap URL
    $sitemapUrl = config('app.url') . '/sitemap.xml';
    if (!str_contains($content, 'Sitemap:')) {
        $content .= "\n\nSitemap: " . $sitemapUrl;
    }

    return response($content, 200)
        ->header('Content-Type', 'text/plain');
});

Route::get('/{key}.txt', function ($key) {
    $configuredKey = \App\Models\SiteSetting::get('seo_indexnow_key');
    if ($key === $configuredKey) {
        return response($key, 200)
            ->header('Content-Type', 'text/plain');
    }
    abort(404);
})->where('key', '[a-zA-Z0-9]+');

