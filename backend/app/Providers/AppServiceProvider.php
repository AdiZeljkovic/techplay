<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

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
        // Existing observers
        \App\Models\Post::observe(\App\Observers\PostObserver::class);
        \App\Models\Article::observe(\App\Observers\ContentObserver::class);

        // Real-time broadcast observers
        \App\Models\Article::observe(\App\Observers\ArticleObserver::class);
        \App\Models\Comment::observe(\App\Observers\CommentObserver::class);
        \App\Models\Product::observe(\App\Observers\ProductObserver::class);
        \App\Models\Review::observe(\App\Observers\ReviewObserver::class);
        \App\Models\Thread::observe(\App\Observers\ThreadObserver::class);
        \App\Models\Post::observe(\App\Observers\ForumPostObserver::class);
        \App\Models\Video::observe(\App\Observers\VideoObserver::class);
        \App\Models\Guide::observe(\App\Observers\GuideObserver::class);
        \App\Models\Media::observe(\App\Observers\MediaObserver::class);

        // Prevent N+1 queries in non-production environments
        \Illuminate\Database\Eloquent\Model::preventLazyLoading(!app()->isProduction());

        // Pulse Authorization
        \Illuminate\Support\Facades\Gate::define('viewPulse', function ($user = null) {
            // For now, allow local dev or logged in admins. 
            // Since user might be null, we need to check.
            // Actually, Pulse auth usually handles user resolution. 
            // Let's allow if user has 'admin' role.
            $user = $user ?? auth()->user();
            return $user && in_array($user->role, ['admin', 'super_admin']);
        });
    }
}
