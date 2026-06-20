<?php

namespace App\Services;

use App\Models\Article;
use App\Models\Comment;
use App\Models\Guide;
use App\Models\MediaKitSetting;
use App\Models\Review;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class MediaKitService
{
    /**
     * Get all statistics for media kit
     */
    public function getStatistics(): array
    {
        return Cache::remember('media_kit.statistics', 3600, function () {
            return [
                'content' => $this->getContentStats(),
                'engagement' => $this->getEngagementStats(),
                'audience' => $this->getAudienceStats(),
                'social' => $this->getSocialStats(),
            ];
        });
    }

    /**
     * Get content statistics
     */
    private function getContentStats(): array
    {
        $totalArticles = Article::count();
        $totalReviews = Review::count();
        $totalGuides = Guide::count();

        $totalViews = Article::sum('views') + Review::sum('views') + Guide::sum('views');

        $avgArticleLength = Article::avg('reading_time');

        $articlesThisMonth = Article::whereBetween('published_at', [
            now()->startOfMonth(),
            now(),
        ])->count();

        return [
            'total_articles' => $totalArticles,
            'total_reviews' => $totalReviews,
            'total_guides' => $totalGuides,
            'total_content' => $totalArticles + $totalReviews + $totalGuides,
            'total_views' => $totalViews,
            'avg_article_length' => round($avgArticleLength ?? 0),
            'articles_this_month' => $articlesThisMonth,
        ];
    }

    /**
     * Get engagement statistics
     */
    private function getEngagementStats(): array
    {
        $totalComments = Comment::count();
        $totalUsers = User::count();

        // Get average comments per article
        $avgComments = Comment::select(DB::raw('COUNT(*) / (SELECT COUNT(*) FROM articles) as avg'))
            ->value('avg');

        return [
            'total_comments' => $totalComments,
            'total_registered_users' => $totalUsers,
            'avg_comments_per_article' => round($avgComments ?? 0, 1),
        ];
    }

    /**
     * Get audience statistics (manual or from GA4)
     */
    private function getAudienceStats(): array
    {
        $ga4Enabled = MediaKitSetting::where('key', 'enable_ga4_integration')
            ->value('value');

        if ($ga4Enabled && filter_var($ga4Enabled, FILTER_VALIDATE_BOOLEAN)) {
            // TODO: Implement GA4 integration when ready
            // return $this->fetchGA4Stats();
        }

        // Manual fallback
        return [
            'monthly_visitors' => (int) MediaKitSetting::where('key', 'manual_monthly_visitors')->value('value') ?? 0,
            'avg_session_duration' => MediaKitSetting::where('key', 'manual_avg_session')->value('value') ?? 'N/A',
            'bounce_rate' => MediaKitSetting::where('key', 'manual_bounce_rate')->value('value') ?? 'N/A',
            'pages_per_session' => MediaKitSetting::where('key', 'manual_pages_per_session')->value('value') ?? 'N/A',
        ];
    }

    /**
     * Get social media statistics
     */
    private function getSocialStats(): array
    {
        $facebookFollowers = (int) MediaKitSetting::where('key', 'social_facebook_followers')->value('value') ?? 0;
        $instagramFollowers = (int) MediaKitSetting::where('key', 'social_instagram_followers')->value('value') ?? 0;
        $youtubeSubscribers = (int) MediaKitSetting::where('key', 'social_youtube_subscribers')->value('value') ?? 0;
        $tiktokFollowers = (int) MediaKitSetting::where('key', 'social_tiktok_followers')->value('value') ?? 0;

        return [
            'facebook_followers' => $facebookFollowers,
            'instagram_followers' => $instagramFollowers,
            'youtube_subscribers' => $youtubeSubscribers,
            'tiktok_followers' => $tiktokFollowers,
            'total_social_reach' => $facebookFollowers + $instagramFollowers + $youtubeSubscribers + $tiktokFollowers,
        ];
    }

    /**
     * Clear media kit cache
     */
    public function clearCache(): void
    {
        Cache::forget('media_kit.full');
        Cache::forget('media_kit.statistics');
    }
}
