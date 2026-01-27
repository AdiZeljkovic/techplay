<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SitemapController;

Route::get('/', function () {
    return view('welcome');
});

// Sitemaps
Route::get('/sitemap-images.xml', [SitemapController::class, 'images']);
Route::get('/sitemap-videos.xml', [SitemapController::class, 'videos']);
Route::get('/sitemap-news.xml', [SitemapController::class, 'news']);

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

