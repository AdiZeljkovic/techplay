<?php

use App\Http\Controllers\RssController;
use App\Http\Controllers\SitemapController;
use App\Models\SiteSetting;
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

    // Where the sitemap lives — and it has to be the site's own hostname.
    //
    // This read FRONTEND_URL and fell back to config('app.url'), which is the
    // API host. With FRONTEND_URL unset on the server it produced
    //
    //     Sitemap: https://api-beta.techplay.gg/sitemap.xml
    //
    // on techplay.gg's robots.txt. A crawler following that lands on a
    // different hostname whose index points back at techplay.gg, and a sitemap
    // listing URLs on a host other than its own is refused unless both are
    // verified as the same property. One fallback was very likely costing the
    // whole 166,000-URL sitemap.
    //
    // config('app.site_url') is normalised in config/app.php: one address,
    // never the comma-separated CORS list, and read through config so that
    // `config:cache` cannot turn it into null.
    $sitemapUrl = rtrim((string) config('app.site_url'), '/').'/sitemap.xml';

    // A Sitemap line already in the stored content is replaced rather than
    // kept: the one this bug wrote is exactly the kind that would survive.
    $content = trim((string) preg_replace('/^[ \t]*Sitemap:.*$/mi', '', $content));
    $content .= "\n\nSitemap: ".$sitemapUrl;

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
