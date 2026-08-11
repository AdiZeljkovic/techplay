<?php

namespace App\Providers;

use App\Models\Achievement;
use App\Models\AdCampaign;
use App\Models\Article;
use App\Models\Category;
use App\Models\Comment;
use App\Models\Customization;
use App\Models\EditorialChannel;
use App\Models\Game;
use App\Models\GameRating;
use App\Models\Giveaway;
use App\Models\Gta6Character;
use App\Models\Gta6Vehicle;
use App\Models\Gta6Weapon;
use App\Models\Guide;
use App\Models\Media;
use App\Models\MediaKitSetting;
use App\Models\News;
use App\Models\NewsletterSubscriber;
use App\Models\Order;
use App\Models\PageSeo;
use App\Models\Post;
use App\Models\Product;
use App\Models\Rank;
use App\Models\Report;
use App\Models\Review;
use App\Models\RewardItem;
use App\Models\SiteSetting;
use App\Models\SupportTier;
use App\Models\Thread;
use App\Models\User;
use App\Models\UserGame;
use App\Models\UserSupport;
use App\Policies\AdminOnlyPolicy;
use App\Policies\ArticlePolicy;
use App\Policies\ContentPolicy;
use App\Policies\ModerationPolicy;
use App\Policies\NewsPolicy;
use App\Policies\ReviewPolicy;
use App\Policies\UserManagementPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * Every model behind a Filament resource is listed. Filament treats an
     * unmapped model as "allowed", so an omission here is not a missing
     * feature — it is an open door for anyone who can open the panel.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // Editorial — these three keep their own hand-written policies, which
        // are already tiered by permission (create/update on `manage content`,
        // delete on `delete articles`, publish on `publish articles`).
        Article::class => ArticlePolicy::class,
        Review::class => ReviewPolicy::class,
        News::class => NewsPolicy::class,

        // Forum moderation
        Comment::class => ModerationPolicy::class,
        Post::class => ModerationPolicy::class,
        Thread::class => ModerationPolicy::class,
        Report::class => ModerationPolicy::class,

        // Editorial content and the curated databases
        Category::class => ContentPolicy::class,
        EditorialChannel::class => ContentPolicy::class,
        Game::class => ContentPolicy::class,
        GameRating::class => ContentPolicy::class,
        Gta6Character::class => ContentPolicy::class,
        Gta6Vehicle::class => ContentPolicy::class,
        Gta6Weapon::class => ContentPolicy::class,
        Guide::class => ContentPolicy::class,
        Media::class => ContentPolicy::class,
        PageSeo::class => ContentPolicy::class,

        // Money, personal data, configuration, economy
        Achievement::class => AdminOnlyPolicy::class,
        AdCampaign::class => AdminOnlyPolicy::class,
        Customization::class => AdminOnlyPolicy::class,
        Giveaway::class => AdminOnlyPolicy::class,
        MediaKitSetting::class => AdminOnlyPolicy::class,
        NewsletterSubscriber::class => AdminOnlyPolicy::class,
        Order::class => AdminOnlyPolicy::class,
        Product::class => AdminOnlyPolicy::class,
        Rank::class => AdminOnlyPolicy::class,
        RewardItem::class => AdminOnlyPolicy::class,
        SiteSetting::class => AdminOnlyPolicy::class,
        SupportTier::class => AdminOnlyPolicy::class,
        UserGame::class => AdminOnlyPolicy::class,

        // `manage users` — Editor-in-Chief holds this by design.
        User::class => UserManagementPolicy::class,
        UserSupport::class => AdminOnlyPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        //
    }
}
