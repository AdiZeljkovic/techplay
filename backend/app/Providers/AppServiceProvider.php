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
use App\Models\Order;
use App\Models\PageSeo;
use App\Models\Post;
use App\Models\Product;
use App\Models\SiteSetting;
use App\Models\Thread;
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
use App\Observers\MediaObserver;
use App\Observers\OrderObserver;
use App\Observers\PageSeoObserver;
use App\Observers\PostObserver;
use App\Observers\ProductObserver;
use App\Observers\SiteSettingObserver;
use App\Observers\ThreadObserver;
use App\Services\LoggingService;
use App\Services\RewardLedger;
use App\Services\Socialite\BattleNetProvider;
use App\Services\Socialite\DiscordProvider;
use Filament\Forms\Components\FileUpload;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
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
        // Request-scoped: a singleton lives and dies with the request, so what
        // one reader earned can never leak into another's response.
        $this->app->singleton(RewardLedger::class);

        // A floor under every outbound HTTP call. Guzzle's default timeout is
        // zero — meaning wait forever — and several integrations in the request
        // path (Turnstile on login, Steam OpenID, the PayPal webhook verifier)
        // set none of their own. One slow third party could pin every Octane
        // worker until the whole site stopped answering. Callers that need
        // longer still override this per request.
        Http::globalOptions([
            'timeout' => 10,
            'connect_timeout' => 3,
        ]);
    }

    /**
     * The default 60/min-per-IP api limiter, with one exception: our own
     * Next.js server. Every SSR request reaches Octane from 127.0.0.1, so
     * the whole site's server-side rendering shared a single visitor's
     * budget — five API calls per game page meant twelve page views a
     * minute site-wide before the backend started answering 429, which the
     * frontend dutifully showed readers as missing pages. The SSR process
     * now identifies itself with a shared-secret header instead; source IP
     * proves nothing here, since X-Forwarded-For passes through.
     */
    private function bootApiRateLimiter(): void
    {
        RateLimiter::for('api', function ($request) {
            $secret = (string) config('services.internal.token');

            if ($secret !== '' && hash_equals($secret, (string) $request->header('X-Internal-Token'))) {
                return Limit::none();
            }

            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->bootApiRateLimiter();

        // Register custom Socialite providers
        $this->bootSocialite();

        // The reset link has to land on the frontend. Laravel's default builds
        // it with url(), which here is the API host — the user would follow the
        // mail into a domain that has no such page.
        ResetPassword::createUrlUsing(function ($user, string $token) {
            return rtrim(config('app.frontend_url'), '/')
                .'/reset-password?token='.$token
                .'&email='.urlencode($user->getEmailForPasswordReset());
        });

        // Every admin upload is raster-only, enforced server-side.
        //
        // Filament's ->image() expands to `image/*`, which includes
        // image/svg+xml — and an SVG is a script container. Uploaded to the
        // public disk it is served from api-beta.techplay.gg, the same origin
        // that holds the Filament session cookie, so a journalist could plant
        // one and send the link to an admin. Laravel's own `image` rule
        // dropped SVG in v11; Filament's helper did not follow.
        //
        // A rule rather than acceptedFileTypes: rules accumulate, so a later
        // ->image() cannot widen it back, and an upload added tomorrow is
        // covered without anyone remembering.
        FileUpload::configureUsing(function (FileUpload $upload): void {
            $upload->rule('mimes:jpeg,jpg,png,gif,webp,avif');
        });

        // Force HTTPS in production/staging and fix URL generation.
        // The host check that used to live here read request() during boot,
        // which under Octane runs once per worker before any request exists —
        // so it took a different branch depending on the runtime.
        if ($this->app->environment('production', 'staging')) {
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
        Thread::observe(ThreadObserver::class);
        Post::observe(ForumPostObserver::class);
        Guide::observe(GuideObserver::class);
        Media::observe(MediaObserver::class);
        Category::observe(CategoryObserver::class);
        SiteSetting::observe(SiteSettingObserver::class);
        PageSeo::observe(PageSeoObserver::class);
        Order::observe(OrderObserver::class);

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

        // Without this, Socialite::driver('discord') throws — which is what
        // both "Sign in with Discord" buttons have been doing.
        $socialite->extend('discord', function ($app) use ($socialite) {
            return $socialite->buildProvider(DiscordProvider::class, config('services.discord'));
        });
    }
}
