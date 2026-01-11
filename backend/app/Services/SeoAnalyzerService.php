<?php

namespace App\Services;

class SeoAnalyzerService
{
    /**
     * Analyze article data and return SEO score with recommendations.
     */
    public static function analyze(array $data): array
    {
        $checks = [];
        $recommendations = [];

        // Extract data with defaults
        $title = $data['title'] ?? '';
        $seoTitle = $data['seo_title'] ?? $title;
        $excerpt = $data['excerpt'] ?? '';
        $seoDescription = $data['seo_description'] ?? $excerpt;
        $focusKeyword = strtolower(trim($data['focus_keyword'] ?? ''));
        $content = strip_tags($data['content'] ?? '');
        $slug = $data['slug'] ?? '';
        $featuredImage = $data['featured_image_url'] ?? null;

        // 1. SEO Title Length (15 points)
        $titleLength = mb_strlen($seoTitle);
        if ($titleLength >= 50 && $titleLength <= 60) {
            $checks['title_length'] = ['status' => 'pass', 'score' => 15, 'message' => 'SEO title length is optimal (50-60 chars).'];
        } elseif ($titleLength >= 40 && $titleLength <= 70) {
            $checks['title_length'] = ['status' => 'warning', 'score' => 10, 'message' => 'SEO title length is acceptable but could be improved.'];
            $recommendations[] = 'Adjust SEO title to 50-60 characters for optimal display.';
        } else {
            $checks['title_length'] = ['status' => 'fail', 'score' => 0, 'message' => 'SEO title is too ' . ($titleLength < 40 ? 'short' : 'long') . '.'];
            $recommendations[] = 'SEO title should be 50-60 characters. Current: ' . $titleLength;
        }

        // 2. Meta Description Length (15 points)
        $descLength = mb_strlen($seoDescription);
        if ($descLength >= 150 && $descLength <= 160) {
            $checks['meta_description'] = ['status' => 'pass', 'score' => 15, 'message' => 'Meta description length is optimal.'];
        } elseif ($descLength >= 120 && $descLength <= 170) {
            $checks['meta_description'] = ['status' => 'warning', 'score' => 10, 'message' => 'Meta description length is acceptable.'];
            $recommendations[] = 'Adjust meta description to 150-160 characters.';
        } elseif ($descLength > 0) {
            $checks['meta_description'] = ['status' => 'fail', 'score' => 5, 'message' => 'Meta description is too ' . ($descLength < 120 ? 'short' : 'long') . '.'];
            $recommendations[] = 'Meta description should be 150-160 characters. Current: ' . $descLength;
        } else {
            $checks['meta_description'] = ['status' => 'fail', 'score' => 0, 'message' => 'Meta description is missing.'];
            $recommendations[] = 'Add a meta description to improve search appearance.';
        }

        // 3. Focus Keyword in Title (10 points)
        if (!empty($focusKeyword)) {
            if (stripos($seoTitle, $focusKeyword) !== false) {
                $checks['keyword_in_title'] = ['status' => 'pass', 'score' => 10, 'message' => 'Focus keyword appears in SEO title.'];
            } else {
                $checks['keyword_in_title'] = ['status' => 'fail', 'score' => 0, 'message' => 'Focus keyword not found in SEO title.'];
                $recommendations[] = 'Include your focus keyword in the SEO title.';
            }
        } else {
            $checks['keyword_in_title'] = ['status' => 'warning', 'score' => 0, 'message' => 'No focus keyword set.'];
            $recommendations[] = 'Set a focus keyword to improve SEO analysis.';
        }

        // 4. Focus Keyword in Content (10 points)
        if (!empty($focusKeyword)) {
            $keywordCount = substr_count(strtolower($content), $focusKeyword);
            if ($keywordCount >= 3) {
                $checks['keyword_in_content'] = ['status' => 'pass', 'score' => 10, 'message' => "Focus keyword appears $keywordCount times in content."];
            } elseif ($keywordCount >= 1) {
                $checks['keyword_in_content'] = ['status' => 'warning', 'score' => 5, 'message' => 'Focus keyword appears only ' . $keywordCount . ' time(s).'];
                $recommendations[] = 'Use focus keyword at least 3 times in content.';
            } else {
                $checks['keyword_in_content'] = ['status' => 'fail', 'score' => 0, 'message' => 'Focus keyword not found in content.'];
                $recommendations[] = 'Include focus keyword in your article content.';
            }
        } else {
            $checks['keyword_in_content'] = ['status' => 'skip', 'score' => 0, 'message' => 'Skipped (no focus keyword).'];
        }

        // 5. Focus Keyword in Meta Description (10 points)
        if (!empty($focusKeyword) && !empty($seoDescription)) {
            if (stripos($seoDescription, $focusKeyword) !== false) {
                $checks['keyword_in_meta'] = ['status' => 'pass', 'score' => 10, 'message' => 'Focus keyword appears in meta description.'];
            } else {
                $checks['keyword_in_meta'] = ['status' => 'fail', 'score' => 0, 'message' => 'Focus keyword not in meta description.'];
                $recommendations[] = 'Include focus keyword in meta description.';
            }
        } else {
            $checks['keyword_in_meta'] = ['status' => 'skip', 'score' => 0, 'message' => 'Skipped (missing keyword or description).'];
        }

        // 6. Content Length (15 points)
        $wordCount = str_word_count($content);
        if ($wordCount >= 600) {
            $checks['content_length'] = ['status' => 'pass', 'score' => 15, 'message' => "Content has $wordCount words. Excellent!"];
        } elseif ($wordCount >= 300) {
            $checks['content_length'] = ['status' => 'warning', 'score' => 10, 'message' => "Content has $wordCount words. Consider adding more."];
            $recommendations[] = 'Aim for 600+ words for comprehensive coverage.';
        } else {
            $checks['content_length'] = ['status' => 'fail', 'score' => 5, 'message' => "Content is too short ($wordCount words)."];
            $recommendations[] = 'Content should be at least 300 words. Current: ' . $wordCount;
        }

        // 7. Has Excerpt (10 points)
        if (!empty(trim($excerpt))) {
            $checks['has_excerpt'] = ['status' => 'pass', 'score' => 10, 'message' => 'Excerpt is provided.'];
        } else {
            $checks['has_excerpt'] = ['status' => 'fail', 'score' => 0, 'message' => 'No excerpt provided.'];
            $recommendations[] = 'Add an excerpt for better previews and SEO.';
        }

        // 8. Has Featured Image (10 points)
        if (!empty($featuredImage)) {
            $checks['has_image'] = ['status' => 'pass', 'score' => 10, 'message' => 'Featured image is set.'];
        } else {
            $checks['has_image'] = ['status' => 'fail', 'score' => 0, 'message' => 'No featured image.'];
            $recommendations[] = 'Add a featured image to improve engagement.';
        }

        // 9. Slug Contains Keyword (5 points)
        if (!empty($focusKeyword) && !empty($slug)) {
            $keywordSlug = \Illuminate\Support\Str::slug($focusKeyword);
            if (stripos($slug, $keywordSlug) !== false) {
                $checks['keyword_in_slug'] = ['status' => 'pass', 'score' => 5, 'message' => 'Focus keyword appears in URL slug.'];
            } else {
                $checks['keyword_in_slug'] = ['status' => 'warning', 'score' => 2, 'message' => 'Consider adding keyword to URL.'];
                $recommendations[] = 'Include focus keyword in the URL slug.';
            }
        } else {
            $checks['keyword_in_slug'] = ['status' => 'skip', 'score' => 0, 'message' => 'Skipped (no keyword or slug).'];
        }

        // Calculate total score
        $totalScore = array_sum(array_column($checks, 'score'));
        $maxScore = 100;
        $percentage = min(100, round(($totalScore / $maxScore) * 100));

        return [
            'score' => $percentage,
            'grade' => self::getGrade($percentage),
            'checks' => $checks,
            'recommendations' => $recommendations,
        ];
    }

    /**
     * Get letter grade based on score.
     */
    private static function getGrade(int $score): string
    {
        if ($score >= 80)
            return 'A';
        if ($score >= 60)
            return 'B';
        if ($score >= 40)
            return 'C';
        if ($score >= 20)
            return 'D';
        return 'F';
    }

    /**
     * Auto-generate SEO title from article title.
     */
    public static function generateSeoTitle(string $title): string
    {
        $seoTitle = trim($title);
        if (mb_strlen($seoTitle) > 60) {
            $seoTitle = mb_substr($seoTitle, 0, 57) . '...';
        }
        return $seoTitle;
    }

    /**
     * Auto-generate meta description from excerpt.
     */
    public static function generateMetaDescription(string $excerpt): string
    {
        $description = trim(strip_tags($excerpt));
        if (mb_strlen($description) > 160) {
            $description = mb_substr($description, 0, 157) . '...';
        }
        return $description;
    }

    /**
     * Suggest focus keyword from title.
     */
    public static function suggestFocusKeyword(string $title): string
    {
        // Common stop words to filter out
        $stopWords = [
            'the',
            'a',
            'an',
            'is',
            'are',
            'was',
            'were',
            'be',
            'been',
            'being',
            'have',
            'has',
            'had',
            'do',
            'does',
            'did',
            'will',
            'would',
            'could',
            'should',
            'may',
            'might',
            'must',
            'shall',
            'can',
            'need',
            'dare',
            'ought',
            'used',
            'to',
            'of',
            'in',
            'for',
            'on',
            'with',
            'at',
            'by',
            'from',
            'as',
            'into',
            'through',
            'during',
            'before',
            'after',
            'above',
            'below',
            'between',
            'under',
            'again',
            'further',
            'then',
            'once',
            'here',
            'there',
            'when',
            'where',
            'why',
            'how',
            'all',
            'each',
            'few',
            'more',
            'most',
            'other',
            'some',
            'such',
            'no',
            'nor',
            'not',
            'only',
            'own',
            'same',
            'so',
            'than',
            'too',
            'very',
            'just',
            'and',
            'but',
            'if',
            'or',
            'because',
            'as',
            'until',
            'while',
            'this',
            'that',
            'these',
            'those',
            'what',
            'which',
            'who',
            'whom',
            'i',
            'me',
            'my',
            'myself',
            'we',
            'our',
            'ours',
            'ourselves',
            'you',
            'your',
            'yours',
            'yourself',
            'he',
            'him',
            'his',
            'himself',
            'she',
            'her',
            'hers',
            'herself',
            'it',
            'its',
            'itself',
            'they',
            'them',
            'their',
            'theirs',
            'themselves',
            'new',
            'old'
        ];

        $words = preg_split('/\s+/', strtolower(trim($title)));
        $words = array_filter($words, function ($word) use ($stopWords) {
            return strlen($word) > 2 && !in_array($word, $stopWords);
        });

        // Return first significant word or first two words combined
        $significantWords = array_values($words);
        if (count($significantWords) >= 2) {
            return $significantWords[0] . ' ' . $significantWords[1];
        } elseif (count($significantWords) === 1) {
            return $significantWords[0];
        }

        return '';
    }
}
