<?php

namespace App\Services;

use App\Models\Article;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class InternalLinkService
{
    /**
     * Suggest internal links based on content
     */
    public static function suggestLinks(string $content, ?int $excludeArticleId = null, int $limit = 5): array
    {
        // Extract keywords from content
        $keywords = self::extractKeywords($content);

        if (empty($keywords)) {
            return [];
        }

        // Build query to find matching articles
        $query = Article::query()
            ->where('status', 'published')
            ->select('id', 'title', 'slug', 'excerpt', 'category');

        if ($excludeArticleId) {
            $query->where('id', '!=', $excludeArticleId);
        }

        // Build WHERE conditions for keyword matching
        $query->where(function ($q) use ($keywords) {
            foreach ($keywords as $keyword) {
                $q->orWhere('title', 'ILIKE', "%{$keyword}%")
                    ->orWhere('slug', 'ILIKE', "%{$keyword}%");
            }
        });

        // Get articles and score them
        $articles = $query->limit(50)->get();

        $scored = $articles->map(function ($article) use ($keywords) {
            $score = 0;
            $titleLower = Str::lower($article->title);
            $slugLower = Str::lower($article->slug);

            foreach ($keywords as $keyword) {
                $keywordLower = Str::lower($keyword);

                // Title match is worth more
                if (Str::contains($titleLower, $keywordLower)) {
                    $score += 3;
                }
                // Slug match
                if (Str::contains($slugLower, $keywordLower)) {
                    $score += 2;
                }
            }

            return [
                'id' => $article->id,
                'title' => $article->title,
                'slug' => $article->slug,
                'url' => '/news/' . $article->slug,
                'excerpt' => Str::limit($article->excerpt, 100),
                'category' => $article->category,
                'score' => $score,
            ];
        });

        // Sort by score and return top results
        return $scored
            ->sortByDesc('score')
            ->take($limit)
            ->values()
            ->toArray();
    }

    /**
     * Extract keywords from content
     */
    private static function extractKeywords(string $content, int $limit = 10): array
    {
        // Strip HTML tags
        $text = strip_tags($content);

        // Convert to lowercase and extract words
        $words = str_word_count(Str::lower($text), 1);

        // Filter: min 4 chars, not a stopword
        $stopwords = self::getStopwords();
        $filtered = array_filter($words, function ($word) use ($stopwords) {
            return strlen($word) >= 4 && !in_array($word, $stopwords);
        });

        // Count frequency
        $frequency = array_count_values($filtered);

        // Sort by frequency
        arsort($frequency);

        // Return top keywords
        return array_slice(array_keys($frequency), 0, $limit);
    }

    /**
     * Get stopwords to filter out
     */
    private static function getStopwords(): array
    {
        return [
            // English
            'that',
            'this',
            'with',
            'from',
            'have',
            'been',
            'were',
            'they',
            'their',
            'will',
            'would',
            'could',
            'should',
            'about',
            'which',
            'when',
            'what',
            'where',
            'there',
            'these',
            'those',
            'other',
            'some',
            'more',
            'also',
            'just',
            'only',
            'even',
            'after',
            'before',
            'being',
            'through',
            'between',
            'each',
            'while',
            'into',
            'very',

            // Croatian/Serbian
            'koji',
            'koja',
            'koje',
            'ovaj',
            'ova',
            'ovo',
            'taj',
            'ta',
            'to',
            'onaj',
            'ona',
            'ono',
            'biti',
            'imati',
            'moći',
            'htjeti',
            'trebati',
            'tako',
            'samo',
            'više',
            'manje',
            'između',
            'prije',
            'poslije',
            'sada',
            'kada',
            'gdje',
            'zašto',
            'kako',
            'što',
            'tko',
            'čemu',
            'svaki',
            'svaka',
            'svako',
            'neki',
            'neka',
            'neko',
            'isti',
            'ista',
        ];
    }

    /**
     * Find articles that link to a given article
     */
    public static function findInboundLinks(int $articleId): array
    {
        $article = Article::find($articleId);
        if (!$article)
            return [];

        $slug = $article->slug;

        return Article::where('status', 'published')
            ->where('id', '!=', $articleId)
            ->where(function ($q) use ($slug) {
                $q->where('content', 'LIKE', "%/news/{$slug}%")
                    ->orWhere('content', 'LIKE', "%href=\"{$slug}\"%");
            })
            ->select('id', 'title', 'slug')
            ->get()
            ->toArray();
    }

    /**
     * Find orphan pages (articles with no inbound links)
     */
    public static function findOrphanPages(): array
    {
        $articles = Article::where('status', 'published')
            ->select('id', 'title', 'slug', 'views', 'created_at')
            ->get();

        $allContent = Article::where('status', 'published')
            ->pluck('content')
            ->implode(' ');

        $orphans = [];
        foreach ($articles as $article) {
            // Check if this article is linked from any other article
            $isLinked = Str::contains($allContent, [
                "/news/{$article->slug}",
                "href=\"{$article->slug}\"",
            ]);

            if (!$isLinked) {
                $orphans[] = [
                    'id' => $article->id,
                    'title' => $article->title,
                    'slug' => $article->slug,
                    'views' => $article->views,
                    'created_at' => $article->created_at,
                ];
            }
        }

        return $orphans;
    }
}
