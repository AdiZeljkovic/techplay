<?php

namespace App\Filament\Components;

use Filament\Actions\Action;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Illuminate\Support\HtmlString;

class SeoFields
{
    /**
     * A title cut back to `$max` characters on a word boundary.
     *
     * Returns the title untouched when it already fits.
     */
    public static function shorten(string $title, int $max = 60): string
    {
        $title = trim($title);

        if (mb_strlen($title) <= $max) {
            return $title;
        }

        $head = mb_substr($title, 0, $max + 1);
        $break = mb_strrpos($head, ' ');

        $cut = $break === false ? mb_substr($title, 0, $max) : mb_substr($head, 0, $break);

        return rtrim($cut, ' 	,.:;-–—');
    }

    /**
     * Get SEO Tab schema with auto-fill and SEO checker
     */
    public static function make(string $urlPrefix = 'techplay.gg/', bool $includeCanonical = true): array
    {
        return [
            // SEO CHECKER - Live analysis
            Placeholder::make('seo_analysis')
                ->label('')
                ->content(function ($get) {
                    $title = $get('title') ?? '';
                    $excerpt = $get('excerpt') ?? '';
                    $content = $get('content') ?? '';
                    $metaTitle = $get('meta_title') ?? '';
                    $metaDescription = $get('meta_description') ?? '';
                    $focusKeyword = $get('focus_keyword') ?? '';
                    $featuredImage = $get('featured_image_url');
                    $slug = $get('slug') ?? '';

                    $checks = [];
                    $score = 0;
                    $maxScore = 0;

                    // ═══════════════════════════════════════════════════════════
                    // SEO CHECKS
                    // ═══════════════════════════════════════════════════════════

                    // 1. Title length check
                    $maxScore += 10;
                    $titleLen = strlen($title);
                    if ($titleLen >= 30 && $titleLen <= 60) {
                        $checks[] = ['✅', 'Title length is optimal ('.$titleLen.' chars)', 'success'];
                        $score += 10;
                    } elseif ($titleLen > 0 && $titleLen < 30) {
                        $checks[] = ['⚠️', 'Title is too short ('.$titleLen.'/30+ chars)', 'warning'];
                        $score += 5;
                    } elseif ($titleLen > 60) {
                        $checks[] = ['⚠️', 'Title is too long ('.$titleLen.'/60 chars)', 'warning'];
                        $score += 5;
                    } else {
                        $checks[] = ['❌', 'Title is missing', 'danger'];
                    }

                    // 2. Meta Title check
                    $maxScore += 10;
                    $metaTitleLen = strlen($metaTitle);
                    if ($metaTitleLen >= 50 && $metaTitleLen <= 60) {
                        $checks[] = ['✅', 'Meta title length is optimal ('.$metaTitleLen.' chars)', 'success'];
                        $score += 10;
                    } elseif ($metaTitleLen > 0) {
                        $checks[] = ['⚠️', 'Meta title: '.$metaTitleLen.' chars (optimal: 50-60)', 'warning'];
                        $score += 5;
                    } else {
                        $checks[] = ['💡', 'Meta title not set (will use article title)', 'info'];
                        $score += 3;
                    }

                    // 3. Meta Description check
                    $maxScore += 15;
                    $metaDescLen = strlen($metaDescription);
                    if ($metaDescLen >= 150 && $metaDescLen <= 160) {
                        $checks[] = ['✅', 'Meta description is optimal ('.$metaDescLen.' chars)', 'success'];
                        $score += 15;
                    } elseif ($metaDescLen >= 120 && $metaDescLen < 150) {
                        $checks[] = ['⚠️', 'Meta description could be longer ('.$metaDescLen.'/150-160 chars)', 'warning'];
                        $score += 10;
                    } elseif ($metaDescLen > 0) {
                        $checks[] = ['⚠️', 'Meta description: '.$metaDescLen.' chars (optimal: 150-160)', 'warning'];
                        $score += 5;
                    } else {
                        $checks[] = ['❌', 'Meta description is missing', 'danger'];
                    }

                    // 4. Focus Keyword check
                    $maxScore += 15;
                    if (! empty($focusKeyword)) {
                        $keywordInTitle = stripos($title, $focusKeyword) !== false;
                        $keywordInContent = stripos($content, $focusKeyword) !== false;
                        $keywordInSlug = stripos($slug, str_replace(' ', '-', strtolower($focusKeyword))) !== false;

                        if ($keywordInTitle && $keywordInContent) {
                            $checks[] = ['✅', 'Focus keyword found in title and content', 'success'];
                            $score += 15;
                        } elseif ($keywordInTitle || $keywordInContent) {
                            $checks[] = ['⚠️', 'Focus keyword found in '.($keywordInTitle ? 'title' : 'content').' only', 'warning'];
                            $score += 8;
                        } else {
                            $checks[] = ['❌', 'Focus keyword not found in title or content', 'danger'];
                            $score += 2;
                        }

                        if ($keywordInSlug) {
                            $checks[] = ['✅', 'Focus keyword in URL slug', 'success'];
                        }
                    } else {
                        $checks[] = ['💡', 'Set a focus keyword for SEO optimization', 'info'];
                    }

                    // 5. Content length check
                    $maxScore += 15;
                    $wordCount = str_word_count(strip_tags($content));
                    if ($wordCount >= 300) {
                        $checks[] = ['✅', 'Content length is good ('.$wordCount.' words)', 'success'];
                        $score += 15;
                    } elseif ($wordCount >= 150) {
                        $checks[] = ['⚠️', 'Content is short ('.$wordCount.'/300+ words recommended)', 'warning'];
                        $score += 8;
                    } elseif ($wordCount > 0) {
                        $checks[] = ['❌', 'Content is too short ('.$wordCount.' words)', 'danger'];
                        $score += 3;
                    } else {
                        $checks[] = ['❌', 'No content yet', 'danger'];
                    }

                    // 6. Featured Image check
                    $maxScore += 10;
                    if (! empty($featuredImage)) {
                        $checks[] = ['✅', 'Featured image is set', 'success'];
                        $score += 10;
                    } else {
                        $checks[] = ['❌', 'Featured image is missing', 'danger'];
                    }

                    // 7. Excerpt check
                    $maxScore += 10;
                    $excerptLen = strlen($excerpt);
                    if ($excerptLen >= 100 && $excerptLen <= 200) {
                        $checks[] = ['✅', 'Excerpt length is optimal ('.$excerptLen.' chars)', 'success'];
                        $score += 10;
                    } elseif ($excerptLen > 0) {
                        $checks[] = ['⚠️', 'Excerpt: '.$excerptLen.' chars (optimal: 100-200)', 'warning'];
                        $score += 5;
                    } else {
                        $checks[] = ['💡', 'Add an excerpt for better social sharing', 'info'];
                    }

                    // 8. Headings in content
                    $maxScore += 10;
                    $hasH2 = preg_match('/<h2/i', $content);
                    $hasH3 = preg_match('/<h3/i', $content);
                    if ($hasH2 && $hasH3) {
                        $checks[] = ['✅', 'Content has proper heading structure (H2, H3)', 'success'];
                        $score += 10;
                    } elseif ($hasH2 || $hasH3) {
                        $checks[] = ['⚠️', 'Add more heading levels for better structure', 'warning'];
                        $score += 5;
                    } elseif ($wordCount > 100) {
                        $checks[] = ['💡', 'Add headings (H2, H3) to structure content', 'info'];
                    }

                    // 9. Internal/External links
                    $maxScore += 5;
                    $hasLinks = preg_match('/<a\s/i', $content);
                    if ($hasLinks) {
                        $checks[] = ['✅', 'Content contains links', 'success'];
                        $score += 5;
                    } elseif ($wordCount > 150) {
                        $checks[] = ['💡', 'Consider adding relevant links', 'info'];
                    }

                    // ═══════════════════════════════════════════════════════════
                    // BUILD OUTPUT
                    // ═══════════════════════════════════════════════════════════

                    $percentage = $maxScore > 0 ? round(($score / $maxScore) * 100) : 0;

                    // Determine overall color
                    if ($percentage >= 80) {
                        $overallColor = '#22c55e'; // green
                        $overallEmoji = '🎯';
                        $overallText = 'Excellent SEO!';
                    } elseif ($percentage >= 60) {
                        $overallColor = '#eab308'; // yellow
                        $overallEmoji = '👍';
                        $overallText = 'Good, with room to improve';
                    } elseif ($percentage >= 40) {
                        $overallColor = '#f97316'; // orange
                        $overallEmoji = '⚠️';
                        $overallText = 'Needs improvement';
                    } else {
                        $overallColor = '#ef4444'; // red
                        $overallEmoji = '❌';
                        $overallText = 'Poor SEO - needs work';
                    }

                    $html = '<div style="background: rgba(0,0,0,0.2); border-radius: 8px; padding: 12px; margin-bottom: 16px;">';

                    // Score header
                    $html .= '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">';
                    $html .= '<span style="font-size: 14px; font-weight: 600;">SEO Score</span>';
                    $html .= '<span style="font-size: 20px; font-weight: bold; color: '.$overallColor.';">'.$overallEmoji.' '.$percentage.'%</span>';
                    $html .= '</div>';

                    // Progress bar
                    $html .= '<div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-bottom: 12px;">';
                    $html .= '<div style="height: 100%; width: '.$percentage.'%; background: '.$overallColor.'; border-radius: 3px; transition: width 0.3s;"></div>';
                    $html .= '</div>';

                    // Status
                    $html .= '<div style="font-size: 12px; color: '.$overallColor.'; margin-bottom: 12px;">'.$overallText.'</div>';

                    // Checks list
                    $html .= '<div style="font-size: 12px; line-height: 1.8;">';
                    foreach ($checks as $check) {
                        $color = match ($check[2]) {
                            'success' => '#22c55e',
                            'warning' => '#eab308',
                            'danger' => '#ef4444',
                            'info' => '#60a5fa',
                            default => '#9ca3af',
                        };
                        $html .= '<div style="color: '.$color.';">'.$check[0].' '.$check[1].'</div>';
                    }
                    $html .= '</div>';

                    $html .= '</div>';

                    return new HtmlString($html);
                })
                ->live(),

            // Focus Keyword
            TextInput::make('focus_keyword')
                ->label('Focus Keyword')
                ->placeholder('e.g. PS5 review, gaming news')
                ->helperText('Primary keyword for SEO optimization')
                ->live(onBlur: true),

            // SEO Title with auto-fill
            TextInput::make('meta_title')
                ->label('SEO Title')
                ->placeholder('Custom title for search engines...')
                ->maxLength(70)
                ->live(onBlur: true)
                ->helperText(
                    fn ($state) => $state
                    ? (strlen($state).'/70 chars'.(strlen($state) >= 50 && strlen($state) <= 60 ? ' ✓ Optimal' : ''))
                    : 'Leave empty to use article title. Optimal: 50-60 chars'
                )
                ->suffixAction(
                    Action::make('fill_from_title')
                        ->icon('heroicon-o-arrow-down-tray')
                        ->tooltip('Fill from Article Title')
                        ->action(function ($get, $set) {
                            $title = $get('title');

                            if ($title) {
                                // Cut on a word, and never fabricate an ellipsis.
                                //
                                // This used to be substr($title, 0, 57).'...', so
                                // every article with a title over sixty characters
                                // got a <title> tag ending mid-word: "makes a
                                // surprise return to …", "Extended Look o…". Google
                                // truncates the SERP line itself — a title tag with
                                // an ellipsis in it is just a shorter title that
                                // reads as broken, in the tab and on every share
                                // card.
                                $set('meta_title', SeoFields::shorten($title, 60));
                            }
                        })
                ),

            // Meta Description with auto-fill
            Textarea::make('meta_description')
                ->label('Meta Description')
                ->placeholder('Compelling description for search results...')
                ->rows(3)
                ->maxLength(160)
                ->live(onBlur: true)
                ->helperText(
                    fn ($state) => $state
                    ? (strlen($state).'/160 chars'.(strlen($state) >= 150 && strlen($state) <= 160 ? ' ✓ Optimal' : ''))
                    : 'Optimal: 150-160 characters'
                )
                ->hintAction(
                    Action::make('fill_from_excerpt')
                        ->icon('heroicon-o-arrow-down-tray')
                        ->label('Fill from Excerpt')
                        ->action(function ($get, $set) {
                            $excerpt = $get('excerpt');
                            if ($excerpt) {
                                // Truncate to 160 chars if needed
                                $metaDesc = strlen($excerpt) > 160
                                    ? substr($excerpt, 0, 157).'...'
                                    : $excerpt;
                                $set('meta_description', $metaDesc);
                            }
                        })
                ),

            // Canonical URL (optional)
            ...(
                $includeCanonical
                ? [
                    TextInput::make('canonical_url')
                        ->label('Canonical URL')
                        ->placeholder('https://...')
                        ->url()
                        ->helperText('Leave empty for default URL'),
                ]
                : []
            ),

            // No-index toggle
            Toggle::make('is_noindex')
                ->label('Hide from Search Engines')
                ->helperText('Enable to prevent Google indexing'),
        ];
    }
}
