<?php

use App\Http\Controllers\RssController;
use App\Http\Controllers\SitemapController;
use App\Models\SiteSetting;
use App\Services\GeminiService;
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

// DEBUG: Test Gemini API directly (no cache, hardcoded data)
Route::get('/debug-gemini-test', function () {
    $geminiService = app(GeminiService::class);

    Log::info('=== GEMINI DEBUG TEST STARTED ===');

    $testData = [
        'character' => [
            'name' => 'TestChar',
            'level' => 80,
            'class' => 'Mage',
            'race' => 'Human',
            'faction' => 'Alliance',
            'achievement_points' => 5000,
        ],
        'achievements' => [
            'total_completed' => 100,
            'has_void_elf' => false,
            'midnight_relevant' => 0,
        ],
        'mounts' => [
            'total' => 50,
            'void_themed' => 2,
        ],
        'housing_score' => 30,
        'midnight_readiness' => 25,
    ];

    $result = $geminiService->analyzeCharacterReadiness($testData);

    Log::info('=== GEMINI DEBUG TEST FINISHED ===', ['result' => $result]);

    return response()->json([
        'success' => $result !== null,
        'result' => $result,
        'message' => $result ? 'Gemini API works!' : 'Gemini failed - check tail -f logs',
        'check_logs' => 'tail -f storage/logs/laravel.log',
    ]);
});
