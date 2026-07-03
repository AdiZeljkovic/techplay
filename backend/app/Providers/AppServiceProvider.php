<?php

namespace App\Providers;

use App\Models\Article;
use App\Models\Category;
use App\Models\Comment;
use App\Models\Game;
use App\Models\Gta6Character;
use App\Models\Gta6Vehicle;
use App\Models\Gta6Weapon;
use App\Models\Guide;
use App\Models\Media;
use App\Models\MediaKitSetting;
use App\Models\PageSeo;
use App\Models\Post;
use App\Models\Product;
use App\Models\Review;
use App\Models\SiteSetting;
use App\Models\Thread;
use App\Models\Video;
use App\Observers\ArticleObserver;
use App\Observers\CategoryObserver;
use App\Observers\CommentObserver;
use App\Observers\ContentObserver;
use App\Observers\ForumPostObserver;
use App\Observers\GameObserver;
use App\Observers\Gta6CharacterObserver;
use App\Observers\Gta6VehicleObserver;
use App\Observers\Gta6WeaponObserver;
use App\Observers\GuideObserver;
use App\Observers\MediaKitSettingObserver;
use App\Observers\MediaObserver;
use App\Observers\PageSeoObserver;
use App\Observers\PostObserver;
use App\Observers\ProductObserver;
use App\Observers\ReviewObserver;
use App\Observers\SiteSettingObserver;
use App\Observers\ThreadObserver;
use App\Observers\VideoObserver;
use App\Services\LoggingService;
use App\Services\Socialite\BattleNetProvider;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Laravel\Socialite\Contracts\Factory;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register custom Socialite providers
        $this->bootSocialite();

        // Force HTTPS in production/staging and fix URL generation
        if ($this->app->environment('production') || $this->app->environment('staging') || request()->getHost() !== 'localhost') {
            URL::forceScheme('https');

            // Fix APP_URL if it's set to HTTP in .env
            if (str_starts_with(config('app.url'), 'http://')) {
                config(['app.url' => str_replace('http://', 'https://', config('app.url'))]);
            }
        }
        // Existing observers
        Post::observe(PostObserver::class);
        Article::observe(ContentObserver::class);

        // Real-time broadcast observers
        Article::observe(ArticleObserver::class);
        Comment::observe(CommentObserver::class);
        Product::observe(ProductObserver::class);
        Review::observe(ReviewObserver::class);
        Thread::observe(ThreadObserver::class);
        Post::observe(ForumPostObserver::class);
        Video::observe(VideoObserver::class);
        Guide::observe(GuideObserver::class);
        Media::observe(MediaObserver::class);
        Category::observe(CategoryObserver::class);
        SiteSetting::observe(SiteSettingObserver::class);
        PageSeo::observe(PageSeoObserver::class);
        MediaKitSetting::observe(MediaKitSettingObserver::class);

        // GTA 6 content observers — cache invalidation + Next.js ISR revalidation
        Gta6Character::observe(Gta6CharacterObserver::class);
        Gta6Vehicle::observe(Gta6VehicleObserver::class);
        Gta6Weapon::observe(Gta6WeaponObserver::class);

        // Game database — Cloudflare/ISR revalidation + IndexNow on Filament edits
        Game::observe(GameObserver::class);

        // Prevent N+1 queries in non-production environments
        Model::preventLazyLoading(! app()->isProduction());

        // MONITORING: Query performance logging
        if (config('logging.slow_query_threshold')) {
            DB::listen(function ($query) {
                if ($query->time > config('logging.slow_query_threshold', 1000)) {
                    app(LoggingService::class)->logSlowQuery(
                        $query->sql,
                        $query->time,
                        $query->bindings
                    );
                }
            });
        }

        // Pulse Authorization
        Gate::define('viewPulse', function ($user = null) {
            // For now, allow local dev or logged in admins.
            // Since user might be null, we need to check.
            // Actually, Pulse auth usually handles user resolution.
            // Let's allow if user has 'admin' role.
            $user = $user ?? auth()->user();

            return $user && in_array($user->role, ['admin', 'super_admin']);
        });
    }

    /**
     * Register custom Socialite providers
     */
    protected function bootSocialite(): void
    {
        $socialite = $this->app->make(Factory::class);

        $socialite->extend('battlenet', function ($app) use ($socialite) {
            $config = config('services.battlenet');

            return $socialite->buildProvider(BattleNetProvider::class, $config);
        });
    }
}
