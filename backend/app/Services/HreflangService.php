<?php

namespace App\Services;

use App\Models\Article;

class HreflangService
{
    /**
     * Supported languages
     */
    public const LANGUAGES = [
        'hr' => 'Hrvatski',
        'en' => 'English',
        'de' => 'Deutsch',
        'sr' => 'Srpski',
    ];

    /**
     * Get hreflang tags for an article
     */
    public static function getHreflangTags(Article $article): array
    {
        $tags = [];
        $baseUrl = config('app.frontend_url', 'https://techplay.gg');

        // Add current article's language
        $tags[] = [
            'lang' => $article->language,
            'url' => "{$baseUrl}/news/{$article->slug}",
        ];

        // Get all translations
        $translations = self::getTranslations($article);

        foreach ($translations as $translation) {
            $tags[] = [
                'lang' => $translation->language,
                'url' => "{$baseUrl}/news/{$translation->slug}",
            ];
        }

        // Add x-default (usually the original/main language)
        $defaultArticle = $article->translation_of_id
            ? Article::find($article->translation_of_id)
            : $article;

        $tags[] = [
            'lang' => 'x-default',
            'url' => "{$baseUrl}/news/{$defaultArticle->slug}",
        ];

        return $tags;
    }

    /**
     * Get all translations of an article
     */
    public static function getTranslations(Article $article): \Illuminate\Support\Collection
    {
        // If this is a translation, get the original and its other translations
        if ($article->translation_of_id) {
            return Article::where('translation_of_id', $article->translation_of_id)
                ->where('id', '!=', $article->id)
                ->where('status', 'published')
                ->get()
                ->push(Article::find($article->translation_of_id));
        }

        // This is the original, get all translations pointing to it
        return Article::where('translation_of_id', $article->id)
            ->where('status', 'published')
            ->get();
    }

    /**
     * Generate HTML link tags for hreflang
     */
    public static function generateLinkTags(Article $article): string
    {
        $tags = self::getHreflangTags($article);

        return collect($tags)
            ->map(fn($tag) => sprintf(
                '<link rel="alternate" hreflang="%s" href="%s" />',
                $tag['lang'],
                $tag['url']
            ))
            ->implode("\n");
    }

    /**
     * Get available languages that don't have translations yet
     */
    public static function getMissingTranslations(Article $article): array
    {
        $existingLangs = collect(self::getHreflangTags($article))
            ->pluck('lang')
            ->filter(fn($l) => $l !== 'x-default')
            ->toArray();

        return array_diff(array_keys(self::LANGUAGES), $existingLangs);
    }
}
