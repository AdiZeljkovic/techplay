<?php

namespace App\Filament\Components;

use App\Support\Copy;
use Filament\Actions\Action;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Illuminate\Support\HtmlString;

/**
 * The SEO tab: one readout and five fields, shared by all four article types.
 *
 * ── What was wrong with the readout ───────────────────────────────────────
 *
 * Three things, in order of how much they cost.
 *
 * **1. It counted bytes and called them characters.** Every length check ran
 * through `strlen`. In UTF-8 a curly apostrophe is three bytes, an ellipsis is
 * three, and č/ć/ž/š/đ are two apiece — so on 141 of our 624 meta descriptions
 * the number on screen was wrong, by up to ten characters. One of them reads
 * `strlen = 160, mb_strlen = 150`: the writer was told they had hit the top of
 * the 150–160 band while actually sitting at the bottom of it. `str_word_count`
 * had the same fault on the body, splitting words at every diacritic.
 *
 * **2. It scored an empty article.** Open "New Article" and the panel said
 * `3% — Poor SEO, needs work` above seven failures, before a single word had
 * been typed. Nothing there is information: of course a blank form is blank.
 * The three points came from a consolation score for an unset meta title, which
 * leads to the next one.
 *
 * **3. It marked you down for doing the recommended thing.** The SEO Title
 * field says, in its own helper text, "leave empty to use article title" — and
 * leaving it empty scored 3 of 10 and printed a bulb icon at you. A check has to
 * measure what the page will actually publish, so it now takes the effective
 * search title (meta title, or the headline when there is none) and judges
 * *that*. Filling the field in is an override, not a chore.
 *
 * ── And how it looked ─────────────────────────────────────────────────────
 *
 * The block drew itself in inline styles: a `rgba(0,0,0,0.2)` ground that turned
 * into a grey slab on a light panel, a progress track at `rgba(255,255,255,0.1)`
 * that was invisible on white, and every line of text in its own hex. Because
 * every line was coloured, the whole panel read as an error dump whether the
 * article was in good shape or not.
 *
 * Now: problems get lines, passes get a count. The same rule as the dashboard.
 */
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

        return rtrim($cut, " \t,.:;-–—");
    }

    /**
     * Words in a string. Lives in `Copy` because `ContentObserver` needs the
     * same number and the two used to compute it differently.
     */
    public static function words(string $html): int
    {
        return Copy::words($html);
    }

    /**
     * Every check, as data.
     *
     * Returned rather than rendered so the scoring and the markup stay separate
     * — and so a test can assert on the verdict instead of on a string of HTML.
     *
     * @return array{score: int, max: int, checks: array<int, array{tone: string, label: string, hint: string|null}>, started: bool}
     */
    public static function analyse(array $state): array
    {
        $title = trim((string) ($state['title'] ?? ''));
        $excerpt = trim((string) ($state['excerpt'] ?? ''));
        $content = (string) ($state['content'] ?? '');
        $metaTitle = trim((string) ($state['meta_title'] ?? ''));
        $metaDescription = trim((string) ($state['meta_description'] ?? ''));
        $focusKeyword = trim((string) ($state['focus_keyword'] ?? ''));
        $featuredImage = $state['featured_image_url'] ?? null;
        $imageAlt = trim((string) ($state['featured_image_alt'] ?? ''));
        $slug = (string) ($state['slug'] ?? '');

        $words = static::words($content);

        // Nothing written yet is not a failing grade, it is an empty page.
        $started = $title !== '' || $words > 0;

        $checks = [];
        $score = 0;
        $max = 0;

        $add = function (string $tone, string $label, ?string $hint, int $points) use (&$checks, &$score) {
            $checks[] = ['tone' => $tone, 'label' => $label, 'hint' => $hint];
            $score += $points;
        };

        // 1 ── the headline itself
        $max += 10;
        $len = mb_strlen($title);
        if ($len >= 30 && $len <= 60) {
            $add('good', "Headline is {$len} characters", null, 10);
        } elseif ($len === 0) {
            $add('bad', 'No headline yet', null, 0);
        } elseif ($len < 30) {
            $add('warn', "Headline is short ({$len} characters)", 'Thirty or more gives search something to match.', 5);
        } else {
            $add('warn', "Headline is {$len} characters", 'Search cuts the line around sixty; the rest still reads on the site.', 5);
        }

        // 2 ── what search will actually print as the title
        //
        // The old check scored `meta_title` on its own and docked you three
        // quarters of the marks for leaving it empty — which is exactly what its
        // own helper text tells you to do. What matters is the effective title.
        $max += 10;
        $effective = $metaTitle !== '' ? $metaTitle : $title;
        $effectiveLen = mb_strlen($effective);
        $source = $metaTitle !== '' ? 'SEO title' : 'headline';
        if ($effectiveLen === 0) {
            $add('bad', 'Nothing for search to use as a title', null, 0);
        } elseif ($effectiveLen <= 60) {
            $add('good', "Search title fits ({$effectiveLen} characters, from the {$source})", null, 10);
        } else {
            $add('warn', "Search title will be cut ({$effectiveLen} characters, from the {$source})",
                $metaTitle === '' ? 'Set an SEO title below to control where it ends.' : null, 5);
        }

        // 3 ── the description under it
        $max += 15;
        $descLen = mb_strlen($metaDescription);
        if ($descLen >= 120 && $descLen <= 160) {
            $add('good', "Meta description is {$descLen} characters", null, 15);
        } elseif ($descLen === 0) {
            $add('bad', 'No meta description', 'Without one, Google writes its own from the page.', 0);
        } elseif ($descLen < 120) {
            $add('warn', "Meta description is short ({$descLen} characters)", 'Around 150 uses the whole line.', 8);
        } else {
            $add('warn', "Meta description is {$descLen} characters", 'Over about 160 gets cut.', 8);
        }

        // 4 ── the phrase this piece is for
        $max += 15;
        if ($focusKeyword === '') {
            $add('idle', 'No focus keyword set', 'Optional — it only turns on the three checks below it.', 0);
        } else {
            $inTitle = mb_stripos($title, $focusKeyword) !== false;
            $inBody = mb_stripos(strip_tags($content), $focusKeyword) !== false;
            $inSlug = str_contains(mb_strtolower($slug), str_replace(' ', '-', mb_strtolower($focusKeyword)));

            if ($inTitle && $inBody) {
                $add('good', 'Focus keyword is in the headline and the body', $inSlug ? 'And in the permalink.' : null, 15);
            } elseif ($inTitle || $inBody) {
                $add('warn', 'Focus keyword is only in the '.($inTitle ? 'headline' : 'body'), null, 8);
            } else {
                $add('bad', 'Focus keyword appears nowhere in the piece', null, 0);
            }
        }

        // 5 ── length of the piece
        $max += 15;
        if ($words >= 300) {
            $add('good', "{$words} words", null, 15);
        } elseif ($words === 0) {
            $add('bad', 'Nothing written yet', null, 0);
        } elseif ($words >= 150) {
            $add('warn', "{$words} words", 'Three hundred is where a piece starts ranking on its own.', 8);
        } else {
            $add('warn', "{$words} words", 'Short enough that search will treat it as a stub.', 4);
        }

        // 6 ── the picture every share needs, and whether anything describes it
        //
        // The alt text is the one field with a real gap in the catalogue —
        // 345 of 625 articles have none — and the old checker never mentioned
        // it, so nobody had a reason to notice.
        $max += 10;
        if (! filled($featuredImage)) {
            $add('bad', 'No featured image', 'Every share card and every list on the site uses it.', 0);
        } elseif ($imageAlt !== '') {
            $add('good', 'Featured image is set, with alt text', null, 10);
        } else {
            $add('warn', 'Featured image has no alt text', 'One line in the Media tab. Screen readers read it, and so does Google.', 6);
        }

        // 7 ── the standfirst
        $max += 10;
        $exLen = mb_strlen($excerpt);
        if ($exLen >= 100 && $exLen <= 200) {
            $add('good', "Standfirst is {$exLen} characters", null, 10);
        } elseif ($exLen === 0) {
            $add('warn', 'No standfirst', 'It is what cards and shares show when there is no meta description.', 0);
        } else {
            $add('warn', "Standfirst is {$exLen} characters", 'A hundred to two hundred fills a card.', 5);
        }

        // 8 ── structure
        $max += 10;
        $h2 = (bool) preg_match('/<h2/i', $content);
        $h3 = (bool) preg_match('/<h3/i', $content);
        if ($h2 && $h3) {
            $add('good', 'Body has H2 and H3 headings', null, 10);
        } elseif ($h2 || $h3) {
            $add('warn', 'Body has one heading level', 'A second level gives long pieces a shape.', 5);
        } elseif ($words > 300) {
            $add('warn', 'No headings in a long piece', null, 0);
        } else {
            $add('idle', 'No headings', 'Worth adding once the piece runs long.', 0);
        }

        // 9 ── links out of it
        $max += 5;
        if (preg_match('/<a\s/i', $content)) {
            $add('good', 'Body contains links', null, 5);
        } elseif ($words > 150) {
            $add('warn', 'No links in the body', 'One or two to our own pieces is usually enough.', 0);
        } else {
            $add('idle', 'No links yet', null, 0);
        }

        return ['score' => $score, 'max' => $max, 'checks' => $checks, 'started' => $started];
    }

    /**
     * What the SEO tab shows on its own label.
     *
     * It used to be a green ✓ whenever `meta_title` was filled in — which
     * rewarded exactly the thing the check inside the tab has stopped asking
     * for, and said nothing at all about the other eight checks. A tab badge
     * should carry the reason you would open the tab, so it carries the number
     * of things still open, and disappears when there are none.
     *
     * @return array{0: string|null, 1: string}
     */
    public static function tabBadge(array $state): array
    {
        $result = static::analyse($state);

        if (! $result['started']) {
            return [null, 'gray'];
        }

        $open = array_filter($result['checks'], fn ($c) => $c['tone'] === 'bad' || $c['tone'] === 'warn');

        if ($open === []) {
            return [null, 'success'];
        }

        return [(string) count($open), array_filter($open, fn ($c) => $c['tone'] === 'bad') === [] ? 'warning' : 'danger'];
    }

    /**
     * The state the readout reads, gathered from a form in one place so the tab
     * badge and the panel inside it can never be looking at different fields.
     *
     * @return array<string, mixed>
     */
    public static function state(
        callable $get,
        string $titleField = 'meta_title',
        string $descriptionField = 'meta_description',
    ): array {
        return [
            'title' => $get('title'),
            'excerpt' => $get('excerpt'),
            'content' => $get('content'),
            'meta_title' => $get($titleField),
            'meta_description' => $get($descriptionField),
            'focus_keyword' => $get('focus_keyword'),
            'featured_image_url' => $get('featured_image_url'),
            'featured_image_alt' => $get('featured_image_alt'),
            'slug' => $get('slug'),
        ];
    }

    /**
     * Get SEO Tab schema with auto-fill and SEO checker
     */
    /**
     * @param  string  $titleField  column the search title is stored in — `articles` calls it `meta_title`, `guides` calls it `seo_title`
     * @param  string  $descriptionField  likewise for the description
     */
    public static function make(
        string $urlPrefix = 'techplay.gg/',
        bool $includeCanonical = true,
        string $titleField = 'meta_title',
        string $descriptionField = 'meta_description',
    ): array {
        return [
            Placeholder::make('seo_analysis')
                ->label('')
                ->content(function ($get) use ($titleField, $descriptionField) {
                    $result = static::analyse(static::state($get, $titleField, $descriptionField));

                    // A blank form is blank. Scoring it says nothing about the
                    // piece and everything about the fact that it does not exist
                    // yet.
                    if (! $result['started']) {
                        return new HtmlString(
                            '<div class="tp-seo tp-seo--idle">'.
                            '<span class="tp-eyebrow">Search readiness</span>'.
                            '<p class="tp-seo__blank">Nothing to check yet.</p>'.
                            '<p class="tp-sub">This fills in as you write — it reads the headline, the body, the image and the fields below.</p>'.
                            '</div>'
                        );
                    }

                    $pct = $result['max'] > 0 ? (int) round($result['score'] / $result['max'] * 100) : 0;

                    $tone = match (true) {
                        $pct >= 80 => 'good',
                        $pct >= 55 => 'warn',
                        default => 'bad',
                    };

                    $verdict = match (true) {
                        $pct >= 80 => 'Ready to publish.',
                        $pct >= 55 => 'Publishable — the lines below would help.',
                        default => 'Worth another pass before this goes out.',
                    };

                    $open = array_values(array_filter($result['checks'], fn ($c) => $c['tone'] !== 'good'));
                    $passed = count($result['checks']) - count($open);

                    $html = '<div class="tp-seo">';

                    $html .= '<div class="tp-seo__head">';
                    $html .= '<span class="tp-eyebrow">Search readiness</span>';
                    $html .= '<strong class="tp-seo__score tp-tone-'.$tone.'">'.$pct.'<span class="tp-seo__pct">%</span></strong>';
                    $html .= '</div>';

                    $html .= '<span class="tp-seo__track"><span class="tp-tone-'.$tone.'" style="width: '.max(2, $pct).'%"></span></span>';
                    $html .= '<p class="tp-seo__verdict">'.$verdict.'</p>';

                    if ($open !== []) {
                        $html .= '<ul class="tp-seo__list">';
                        foreach ($open as $check) {
                            $html .= '<li class="tp-seo__item">';
                            $html .= '<span class="tp-seo__dot tp-tone-'.e($check['tone']).'"></span>';
                            $html .= '<span class="tp-seo__text">'.e($check['label']);
                            if ($check['hint'] !== null) {
                                $html .= '<em class="tp-seo__hint">'.e($check['hint']).'</em>';
                            }
                            $html .= '</span></li>';
                        }
                        $html .= '</ul>';
                    }

                    /*
                     * The passes are a count, not a list. Nine green lines every
                     * time you open the tab train the eye to skip the block, and
                     * then it skips the one red line too.
                     */
                    if ($passed > 0) {
                        $html .= '<p class="tp-seo__passed">'.$passed.' of '.count($result['checks']).' checks pass</p>';
                    }

                    return new HtmlString($html.'</div>');
                })
                ->live(),

            TextInput::make('focus_keyword')
                ->label('Focus keyword')
                ->placeholder('e.g. PS5 review, gaming news')
                ->helperText('Optional. The phrase this piece should be found by.')
                ->live(onBlur: true),

            TextInput::make($titleField)
                ->label('SEO title')
                ->placeholder('Leave empty to use the headline')
                ->maxLength(70)
                ->live(onBlur: true)
                ->hint(fn ($state) => filled($state) ? mb_strlen((string) $state).' / 70' : null)
                ->hintColor(fn ($state) => mb_strlen((string) $state) > 60 ? 'warning' : 'gray')
                ->helperText('Only needed when the headline reads badly in search, or runs past sixty characters.')
                ->suffixAction(
                    Action::make('fill_from_title')
                        ->icon('heroicon-o-arrow-down-tray')
                        ->tooltip('Fill from the headline')
                        ->action(function ($get, $set) use ($titleField) {
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
                                $set($titleField, SeoFields::shorten($title, 60));
                            }
                        })
                ),

            Textarea::make($descriptionField)
                ->label('Meta description')
                ->placeholder('The line under the title in search results.')
                ->rows(3)
                ->maxLength(160)
                ->live(onBlur: true)
                ->hint(fn ($state) => filled($state) ? mb_strlen((string) $state).' / 160' : null)
                ->hintColor(fn ($state) => mb_strlen((string) $state) < 120 ? 'gray' : 'success')
                ->helperText('Around 150 characters uses the whole line.')
                ->hintAction(
                    Action::make('fill_from_excerpt')
                        ->icon('heroicon-o-arrow-down-tray')
                        ->label('Fill from standfirst')
                        ->action(function ($get, $set) use ($descriptionField) {
                            $excerpt = $get('excerpt');

                            if ($excerpt) {
                                // Same fix as the title above, which this had
                                // been missing: `substr($excerpt, 0, 157).'...'`
                                // cut mid-word, invented an ellipsis Google does
                                // not want, and — counting bytes — could slice a
                                // multibyte character in half and leave broken
                                // text in the tag.
                                $set($descriptionField, SeoFields::shorten($excerpt, 160));
                            }
                        })
                ),

            ...(
                $includeCanonical
                ? [
                    TextInput::make('canonical_url')
                        ->label('Canonical URL')
                        ->placeholder('https://...')
                        ->url()
                        ->helperText('Only when this piece also lives somewhere else. Empty means this page is the original.'),
                ]
                : []
            ),

            Toggle::make('is_noindex')
                ->label('Hide from search engines')
                ->helperText('Keeps the page on the site but out of Google.'),
        ];
    }
}
