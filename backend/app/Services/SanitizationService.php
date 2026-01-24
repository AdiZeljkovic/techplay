<?php

namespace App\Services;

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
     * Sanitize rich content - allows SAFE HTML tags
     * Use for: Article content, guide descriptions (admin/editor only!)
     *
     * SECURITY: Only allow this for trusted users (admin/editor roles)
     * Regular users should NEVER have access to rich HTML input
     */
    public function sanitizeRichContent(string $content): string
    {
        // TODO: Replace with Purifier when installed
        // For now, use basic allowlist of safe tags
        $allowedTags = '<p><br><strong><em><u><a><ul><ol><li><blockquote><code><pre>';

        $clean = strip_tags($content, $allowedTags);

        // Remove dangerous attributes from allowed tags
        $clean = $this->removeDangerousAttributes($clean);

        return $clean;
    }

    /**
     * Remove dangerous HTML attributes (onclick, onerror, etc.)
     */
    private function removeDangerousAttributes(string $html): string
    {
        $dangerousPatterns = [
            '/\s*on\w+\s*=\s*["\'][^"\']*["\']/i', // onclick, onerror, etc.
            '/\s*style\s*=\s*["\'][^"\']*["\']/i',  // inline styles (can contain expressions)
            '/javascript:/i',                        // javascript: protocol
            '/vbscript:/i',                          // vbscript: protocol
            '/data:/i',                              // data: protocol (can embed scripts)
        ];

        foreach ($dangerousPatterns as $pattern) {
            $html = preg_replace($pattern, '', $html);
        }

        return $html;
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
        if (!preg_match('/^https?:\/\//i', $url)) {
            return null;
        }

        // Use filter_var for URL validation
        $clean = filter_var($url, FILTER_VALIDATE_URL);

        return $clean ?: null;
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
