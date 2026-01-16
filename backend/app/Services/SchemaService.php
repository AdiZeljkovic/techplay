<?php

namespace App\Services;

use App\Models\Article;
use Illuminate\Support\Str;

class SchemaService
{
    /**
     * Generate Review Schema for review articles
     */
    public static function getReviewSchema(Article $article): ?array
    {
        if (!$article->review_rating || $article->category !== 'reviews') {
            return null;
        }

        return [
            '@context' => 'https://schema.org',
            '@type' => 'Review',
            'itemReviewed' => [
                '@type' => 'Product',
                'name' => self::extractProductName($article->title),
            ],
            'reviewRating' => [
                '@type' => 'Rating',
                'ratingValue' => $article->review_rating,
                'bestRating' => '10',
                'worstRating' => '1',
            ],
            'author' => [
                '@type' => 'Person',
                'name' => $article->author?->display_name ?? $article->author?->username ?? 'TechPlay',
            ],
            'publisher' => [
                '@type' => 'Organization',
                'name' => 'TechPlay',
            ],
            'datePublished' => $article->published_at?->toIso8601String(),
            'reviewBody' => Str::limit(strip_tags($article->excerpt ?? $article->content), 500),
            'positiveNotes' => $article->review_pros ?? [],
            'negativeNotes' => $article->review_cons ?? [],
        ];
    }

    /**
     * Generate VideoObject Schema for embedded videos
     */
    public static function getVideoSchema(Article $article): array
    {
        $videos = [];

        // Match YouTube embeds
        preg_match_all(
            '/(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/',
            $article->content ?? '',
            $youtubeMatches
        );

        foreach ($youtubeMatches[1] ?? [] as $videoId) {
            $videos[] = [
                '@context' => 'https://schema.org',
                '@type' => 'VideoObject',
                'name' => $article->title,
                'description' => $article->excerpt ?? Str::limit(strip_tags($article->content), 200),
                'thumbnailUrl' => "https://img.youtube.com/vi/{$videoId}/maxresdefault.jpg",
                'uploadDate' => $article->published_at?->toIso8601String(),
                'embedUrl' => "https://www.youtube.com/embed/{$videoId}",
                'contentUrl' => "https://www.youtube.com/watch?v={$videoId}",
            ];
        }

        // Match Twitch embeds
        preg_match_all(
            '/twitch\.tv\/videos\/(\d+)/',
            $article->content ?? '',
            $twitchMatches
        );

        foreach ($twitchMatches[1] ?? [] as $videoId) {
            $videos[] = [
                '@context' => 'https://schema.org',
                '@type' => 'VideoObject',
                'name' => $article->title,
                'description' => $article->excerpt ?? Str::limit(strip_tags($article->content), 200),
                'uploadDate' => $article->published_at?->toIso8601String(),
                'embedUrl' => "https://player.twitch.tv/?video={$videoId}",
            ];
        }

        return $videos;
    }

    /**
     * Generate HowTo Schema for guide articles
     */
    public static function getHowToSchema(Article $article): ?array
    {
        if ($article->category !== 'guides') {
            return null;
        }

        // Parse H2/H3 headings as steps
        preg_match_all('/<h[23][^>]*>(.*?)<\/h[23]>/i', $article->content ?? '', $matches);

        if (empty($matches[1])) {
            return null;
        }

        $steps = [];
        foreach ($matches[1] as $index => $heading) {
            $steps[] = [
                '@type' => 'HowToStep',
                'position' => $index + 1,
                'name' => strip_tags($heading),
                'text' => strip_tags($heading),
            ];
        }

        return [
            '@context' => 'https://schema.org',
            '@type' => 'HowTo',
            'name' => $article->title,
            'description' => $article->excerpt ?? Str::limit(strip_tags($article->content), 200),
            'image' => $article->featured_image_url,
            'datePublished' => $article->published_at?->toIso8601String(),
            'step' => $steps,
        ];
    }

    /**
     * Generate Person Schema for author pages
     */
    public static function getPersonSchema($user): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'Person',
            'name' => $user->display_name ?? $user->username,
            'image' => $user->avatar_url,
            'jobTitle' => $user->role === 'admin' ? 'Editor' : 'Contributor',
            'url' => config('app.frontend_url') . '/profile/' . $user->username,
            'sameAs' => array_filter([
                $user->social_twitter ? "https://twitter.com/{$user->social_twitter}" : null,
                $user->social_instagram ? "https://instagram.com/{$user->social_instagram}" : null,
            ]),
        ];
    }

    /**
     * Extract product name from article title
     */
    private static function extractProductName(string $title): string
    {
        // Remove common prefixes: "Review:", "Test:", "Recenzija:"
        $cleaned = preg_replace('/^(Review|Test|Recenzija|Pregled):\s*/i', '', $title);

        // Remove rating at end: "- 9/10", "(8.5/10)"
        $cleaned = preg_replace('/[\s\-–]+\d+(\.\d+)?\/10.*$/i', '', $cleaned);

        return trim($cleaned);
    }

    /**
     * Get all schemas for an article
     */
    public static function getAllSchemas(Article $article): array
    {
        $schemas = [];

        // Review schema
        $review = self::getReviewSchema($article);
        if ($review) {
            $schemas[] = $review;
        }

        // Video schemas
        $videos = self::getVideoSchema($article);
        $schemas = array_merge($schemas, $videos);

        // HowTo schema
        $howTo = self::getHowToSchema($article);
        if ($howTo) {
            $schemas[] = $howTo;
        }

        return $schemas;
    }
}
