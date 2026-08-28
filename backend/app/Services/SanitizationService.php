<?php

namespace App\Services;

use Mews\Purifier\Facades\Purifier;

/**
 * Centralized content sanitization service
 *
 * SECURITY: Protects against XSS attacks in user-generated content
 *
 * FUTURE: When mews/purifier is installed, replace strip_tags with purifier
 * Installation: composer require mews/purifier
 * Config: php artisan vendor:publish --provider="Mews\Purifier\PurifierServiceProvider"
 */
class SanitizationService
{
    /**
     * Sanitize user content - allows NO HTML tags
     * Use for: Comments, forum posts, reports, messages
     */
    public function sanitizePlainText(string $content): string
    {
        // Remove ALL HTML tags
        $clean = strip_tags($content);

        // Decode HTML entities to prevent entity injection
        $clean = html_entity_decode($clean, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        // Re-encode to safe entities
        $clean = htmlspecialchars($clean, ENT_QUOTES | ENT_HTML5, 'UTF-8', false);

        // Trim whitespace
        $clean = trim($clean);

        return $clean;
    }

    /**
     * Sanitize title/headline - strips HTML but does NOT HTML-encode
     * Use for: Thread titles, article titles - where frontend handles escaping
     *
     * SECURITY: Safe because React/Next.js automatically escapes text content
     */
    public function sanitizeTitle(string $title): string
    {
        // Remove ALL HTML tags
        $clean = strip_tags($title);

        // Decode any existing HTML entities (prevents &amp; becoming &amp;amp;)
        $clean = html_entity_decode($clean, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        // Trim whitespace
        $clean = trim($clean);

        return $clean;
    }

    /**
     * Sanitize rich content - allows SAFE HTML tags (HTMLPurifier, "forum" profile)
     * Use for: Forum posts/threads and other user-supplied rich text.
     * No iframes, no images, rel=nofollow on links.
     */
    public function sanitizeRichContent(string $content): string
    {
        return Purifier::clean($content, 'forum');
    }

    /**
     * Sanitize third-party catalogue text (HTMLPurifier, "catalogue" profile).
     *
     * Use for: game descriptions, which arrive from MobyGames and are not ours.
     * Same safety as rich content, minus the anchors — the tag is dropped and
     * its text kept, so a sentence built around a link still reads.
     */
    public function sanitizeCatalogueText(string $content): string
    {
        return Purifier::clean($content, 'catalogue');
    }

    /**
     * Sanitize staff-authored content (HTMLPurifier, "staff_content" profile)
     * Use for: Article, guide and review bodies. Allows headings, images,
     * tables and whitelisted video embeds (YouTube, Vimeo, Twitch, Spotify).
     */
    public function sanitizeStaffContent(string $content): string
    {
        return Purifier::clean($content, 'staff_content');
    }

    /**
     * Sanitize search query - prevent SQL injection in LIKE queries
     */
    public function sanitizeSearchQuery(string $query): string
    {
        // Escape special LIKE characters
        $query = str_replace(['%', '_'], ['\\%', '\\_'], $query);

        // Remove null bytes
        $query = str_replace("\0", '', $query);

        return trim($query);
    }

    /**
     * Validate and sanitize URL
     */
    public function sanitizeUrl(?string $url): ?string
    {
        if (empty($url)) {
            return null;
        }

        // Only allow http and https protocols
        if (! preg_match('/^https?:\/\//i', $url)) {
            return null;
        }

        // Use filter_var for URL validation
        $clean = filter_var($url, FILTER_VALIDATE_URL);

        return $clean ?: null;
    }

    /**
     * Extract unique @username mentions from already-sanitized content.
     * Returns raw candidate usernames (caller must validate they exist).
     * Capped at 10 to bound notification fan-out per post.
     */
    public function extractMentions(string $content): array
    {
        if (! preg_match_all('/@([a-zA-Z0-9_]+)/', $content, $matches)) {
            return [];
        }

        return array_slice(array_values(array_unique($matches[1])), 0, 10);
    }

    /**
     * Check if content contains spam patterns
     */
    public function detectSpam(string $content): bool
    {
        $spamPatterns = [
            '/\b(viagra|cialis|casino|poker)\b/i',
            '/\b(buy now|click here|limited offer)\b/i',
            '/\[url=/i', // BBCode link spam
            '/(http\S+\s*){5,}/i', // 5+ URLs in content
        ];

        foreach ($spamPatterns as $pattern) {
            if (preg_match($pattern, $content)) {
                return true;
            }
        }

        return false;
    }
}
