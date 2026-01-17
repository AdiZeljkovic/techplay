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

Route::get('/{key}.txt', function ($key) {
    $configuredKey = \App\Models\SiteSetting::get('seo_indexnow_key');
    if ($key === $configuredKey) {
        return response($key, 200)
            ->header('Content-Type', 'text/plain');
    }
    abort(404);
})->where('key', '[a-zA-Z0-9]+');

