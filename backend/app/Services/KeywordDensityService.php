<?php

namespace App\Services;

use Illuminate\Support\Str;

class KeywordDensityService
{
    /**
     * Analyze content for keyword density and SEO issues
     */
    public static function analyze(string $content, ?string $focusKeyword = null): array
    {
        $text = strip_tags($content);
        $wordCount = str_word_count($text);

        $result = [
            'word_count' => $wordCount,
            'reading_time_minutes' => ceil($wordCount / 200),
            'focus_keyword' => null,
            'issues' => [],
            'suggestions' => [],
        ];

        if (!$focusKeyword) {
            $result['suggestions'][] = 'Set a focus keyword for better SEO analysis';
            return $result;
        }

        $focusKeyword = Str::lower($focusKeyword);
        $textLower = Str::lower($text);
        $contentLower = Str::lower($content);

        // Count keyword occurrences
        $keywordCount = substr_count($textLower, $focusKeyword);
        $density = $wordCount > 0 ? round(($keywordCount / $wordCount) * 100, 2) : 0;

        $result['focus_keyword'] = [
            'keyword' => $focusKeyword,
            'count' => $keywordCount,
            'density' => $density,
            'status' => self::getDensityStatus($density),
        ];

        // Check keyword in headings
        $inH1 = (bool) preg_match('/<h1[^>]*>.*?' . preg_quote($focusKeyword, '/') . '.*?<\/h1>/is', $contentLower);
        $inH2 = (bool) preg_match('/<h2[^>]*>.*?' . preg_quote($focusKeyword, '/') . '.*?<\/h2>/is', $contentLower);

        $result['heading_usage'] = [
            'in_h1' => $inH1,
            'in_h2' => $inH2,
        ];

        // Check first paragraph
        $firstParagraph = '';
        if (preg_match('/<p[^>]*>(.*?)<\/p>/is', $content, $match)) {
            $firstParagraph = Str::lower(strip_tags($match[1]));
        }
        $result['in_first_paragraph'] = Str::contains($firstParagraph, $focusKeyword);

        // Generate issues
        if ($density === 0) {
            $result['issues'][] = [
                'type' => 'critical',
                'message' => 'Focus keyword not found in content',
            ];
        } elseif ($density > 3) {
            $result['issues'][] = [
                'type' => 'warning',
                'message' => 'Keyword stuffing detected - density too high (' . $density . '%)',
            ];
        } elseif ($density < 0.5) {
            $result['issues'][] = [
                'type' => 'info',
                'message' => 'Focus keyword density is low (' . $density . '%) - consider adding more instances',
            ];
        }

        if (!$inH1 && !$inH2) {
            $result['issues'][] = [
                'type' => 'warning',
                'message' => 'Focus keyword not found in any heading (H1 or H2)',
            ];
        }

        if (!$result['in_first_paragraph']) {
            $result['issues'][] = [
                'type' => 'info',
                'message' => 'Focus keyword not found in first paragraph',
            ];
        }

        // Generate suggestions
        if ($keywordCount > 0 && $density <= 3 && $density >= 0.5) {
            $result['suggestions'][] = 'Good keyword usage!';
        }

        if ($wordCount < 300) {
            $result['issues'][] = [
                'type' => 'warning',
                'message' => 'Content is too short (' . $wordCount . ' words) - aim for 500+ words',
            ];
        } elseif ($wordCount > 1500) {
            $result['suggestions'][] = 'Long-form content (good for SEO)';
        }

        // Calculate SEO score
        $result['seo_score'] = self::calculateScore($result);

        return $result;
    }

    /**
     * Get density status
     */
    private static function getDensityStatus(float $density): string
    {
        if ($density === 0)
            return 'missing';
        if ($density < 0.5)
            return 'low';
        if ($density > 3)
            return 'high';
        return 'optimal';
    }

    /**
     * Calculate overall SEO score (0-100)
     */
    private static function calculateScore(array $result): int
    {
        $score = 50; // Base score

        // Keyword density
        $densityStatus = $result['focus_keyword']['status'] ?? 'missing';
        if ($densityStatus === 'optimal')
            $score += 20;
        elseif ($densityStatus === 'low')
            $score += 10;
        elseif ($densityStatus === 'high')
            $score -= 10;
        elseif ($densityStatus === 'missing')
            $score -= 20;

        // Heading usage
        if ($result['heading_usage']['in_h1'] ?? false)
            $score += 10;
        if ($result['heading_usage']['in_h2'] ?? false)
            $score += 5;

        // First paragraph
        if ($result['in_first_paragraph'] ?? false)
            $score += 10;

        // Word count
        $wordCount = $result['word_count'] ?? 0;
        if ($wordCount >= 500)
            $score += 5;
        if ($wordCount >= 1000)
            $score += 5;

        // Deduct for issues
        foreach ($result['issues'] as $issue) {
            if ($issue['type'] === 'critical')
                $score -= 15;
            elseif ($issue['type'] === 'warning')
                $score -= 5;
        }

        return max(0, min(100, $score));
    }
}
