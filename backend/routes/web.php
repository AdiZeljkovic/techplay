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
/*
 * Sitemaps: these routes are a fallback, not what the site serves.
 *
 * `sitemap:generate` writes the same XML to public/ every six hours, and
 * FrankenPHP serves any real file there before PHP is reached — so on
 * production the files win and none of the routes below ever run.
 *
 * That is on purpose: the catalogue files are ~8 MB each and 166,000 URLs in
 * total, which is not something to assemble per request. But it cost an hour on
 * 17 Aug 2026, because a fix to SitemapController changed nothing and every
 * obvious suspect — OPcache, config cache, route cache, a stale process — was
 * eliminated before anybody thought to look in public/.
 *
 * So: change the controller, then run `php artisan sitemap:generate`. The
 * routes stay because they are what the generator calls, and because a missing
 * file should answer with fresh XML rather than a 404.
 */
Route::get('/sitemap.xml', [SitemapController::class, 'index']);
Route::get('/sitemap-pages.xml', [SitemapController::class, 'pages']);
Route::get('/sitemap-articles.xml', [SitemapController::class, 'articles']);
Route::get('/sitemap-categories.xml', [SitemapController::class, 'categories']);
Route::get('/sitemap-guides.xml', [SitemapController::class, 'guides']);
Route::get('/sitemap-lists.xml', [SitemapController::class, 'lists']);
Route::get('/sitemap-products.xml', [SitemapController::class, 'products']);
Route::get('/sitemap-news.xml', [SitemapController::class, 'news']);
Route::get('/sitemap-images.xml', [SitemapController::class, 'images']);
Route::get('/sitemap-games-{page}.xml', [SitemapController::class, 'games'])->where('page', '[1-9][0-9]*');
Route::get('/sitemap-studios.xml', [SitemapController::class, 'studios']);
Route::get('/sitemap-series.xml', [SitemapController::class, 'series']);

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
