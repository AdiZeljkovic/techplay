<?php

namespace Tests\Feature;

use App\Filament\Components\SeoFields;
use Tests\TestCase;

/**
 * The SEO readout in the article rail.
 *
 * Scoring is tested as data rather than through the rendered HTML: `analyse()`
 * returns the checks and the score, and the blade only decides how to draw them.
 * That split is the reason these are one-line tests instead of substring
 * searches through a div.
 */
class SeoReadoutTest extends TestCase
{
    private function analyse(array $overrides = []): array
    {
        return SeoFields::analyse(array_merge([
            'title' => '',
            'excerpt' => '',
            'content' => '',
            'meta_title' => '',
            'meta_description' => '',
            'focus_keyword' => '',
            'featured_image_url' => null,
            'slug' => '',
        ], $overrides));
    }

    /**
     * Characters, not bytes.
     *
     * Every length check ran through `strlen`. On 141 of the 624 live meta
     * descriptions that disagreed with the real length by up to ten characters —
     * a curly apostrophe is three bytes, an ellipsis is three, č and ž are two.
     */
    public function test_lengths_are_counted_in_characters(): void
    {
        // 150 characters, and 160 bytes: ten of them are two-byte letters.
        $description = str_repeat('č', 10).str_repeat('a', 140);

        $this->assertSame(160, strlen($description));
        $this->assertSame(150, mb_strlen($description));

        $result = $this->analyse([
            'title' => 'A headline of a perfectly reasonable length for search',
            'content' => str_repeat('word ', 400),
            'meta_description' => $description,
        ]);

        $descCheck = collect($result['checks'])->first(fn ($c) => str_contains($c['label'], 'Meta description'));

        $this->assertSame('good', $descCheck['tone']);
        $this->assertStringContainsString('150 characters', $descCheck['label']);
    }

    /**
     * Words survive our own alphabet.
     *
     * `str_word_count` reads bytes against an ASCII letter list, so it split
     * words at every diacritic — on one 886-word review it returned 895.
     */
    public function test_words_are_counted_across_diacritics(): void
    {
        $this->assertSame(3, SeoFields::words('<p>ovo je riječ</p>'));
        $this->assertSame(5, SeoFields::words('<h2>Naslov</h2><p>još jedna čista rečenica</p>'));
        $this->assertSame(0, SeoFields::words(''));
    }

    /**
     * An empty form is not a failing grade.
     *
     * Opening "New Article" used to greet you with `3% — Poor SEO, needs work`
     * over seven red lines, before a word had been typed.
     */
    public function test_a_blank_article_is_not_scored(): void
    {
        $this->assertFalse($this->analyse()['started']);

        $this->assertTrue($this->analyse(['title' => 'Something'])['started']);
        $this->assertTrue($this->analyse(['content' => '<p>Something</p>'])['started']);
    }

    /**
     * Leaving the SEO title empty is what its own helper text tells you to do.
     *
     * The old check scored `meta_title` alone and gave 3 of 10 for an empty one,
     * so following the instruction cost you marks. What matters is the title
     * search will actually print.
     */
    public function test_an_unset_seo_title_is_not_a_fault_when_the_headline_fits(): void
    {
        $result = $this->analyse([
            'title' => 'Hogwarts Legacy 2 is officially being made',
            'content' => str_repeat('word ', 400),
        ]);

        $check = collect($result['checks'])->first(fn ($c) => str_contains($c['label'], 'Search title'));

        $this->assertSame('good', $check['tone']);
        $this->assertStringContainsString('headline', $check['label']);
    }

    public function test_a_long_headline_with_no_override_is_flagged(): void
    {
        $result = $this->analyse([
            'title' => 'Samsung Galaxy S24 review: flagship power meets advanced AI without the ultra premium',
        ]);

        $check = collect($result['checks'])->first(fn ($c) => str_contains($c['label'], 'Search title'));

        $this->assertSame('warn', $check['tone']);
        $this->assertStringContainsString('Set an SEO title', $check['hint']);
    }

    /**
     * A finished piece can actually reach the top of the scale. The old scoring
     * could not: an empty meta title capped it at 93, and filling one in to a
     * length nobody writes was the only way past.
     */
    public function test_a_complete_article_scores_full_marks(): void
    {
        $result = $this->analyse([
            'title' => 'Quake gets a free new campaign for its thirtieth anniversary',
            'slug' => 'quake-free-campaign-thirtieth-anniversary',
            'excerpt' => str_repeat('a', 150),
            'meta_description' => str_repeat('b', 150),
            'focus_keyword' => 'Quake',
            'featured_image_url' => 'articles/quake.jpg',
            'content' => '<h2>Quake at thirty</h2><h3>Two</h3><p><a href="/news">link</a> '.str_repeat('word ', 400).'</p>',
        ]);

        $this->assertSame($result['max'], $result['score']);
        $this->assertSame(100, $result['max']);
        $this->assertEmpty(array_filter($result['checks'], fn ($c) => $c['tone'] !== 'good'));
    }

    /**
     * The tab's own badge used to be a green tick shown whenever `meta_title`
     * was filled — rewarding the one thing the checks have stopped asking for,
     * and silent about the other eight.
     */
    public function test_the_tab_badge_counts_what_is_still_open(): void
    {
        [$count, $colour] = SeoFields::tabBadge([
            'title' => '', 'excerpt' => '', 'content' => '', 'meta_title' => '',
            'meta_description' => '', 'focus_keyword' => '', 'featured_image_url' => null, 'slug' => '',
        ]);
        $this->assertNull($count, 'a blank article has nothing to report');

        [$count, $colour] = SeoFields::tabBadge([
            'title' => 'Quake gets a free new campaign for its thirtieth anniversary',
            'slug' => 'quake-free-campaign-thirtieth-anniversary',
            'excerpt' => str_repeat('a', 150),
            'meta_description' => str_repeat('b', 150),
            'focus_keyword' => 'Quake',
            'featured_image_url' => 'articles/quake.jpg',
            'content' => '<h2>Quake at thirty</h2><h3>Two</h3><p><a href="/news">link</a> '.str_repeat('word ', 400).'</p>',
        ]);
        $this->assertNull($count, 'a finished article has nothing to report either');
        $this->assertSame('success', $colour);

        // A piece with a missing image and no description: two hard failures.
        [$count, $colour] = SeoFields::tabBadge([
            'title' => 'A headline of a perfectly reasonable length for search',
            'content' => '<h2>One</h2><h3>Two</h3><p><a href="/news">x</a> search '.str_repeat('word ', 400).'</p>',
            'excerpt' => str_repeat('a', 150),
            'meta_description' => '', 'meta_title' => '', 'focus_keyword' => 'search', 'featured_image_url' => null,
            'slug' => 'a-headline',
        ]);
        $this->assertSame('2', $count);
        $this->assertSame('danger', $colour);
    }

    /**
     * Auto-fill never invents an ellipsis or cuts a word in half — the fix the
     * title button already had and the description button had been missing,
     * where `substr` could also have sliced a multibyte character in two.
     */
    public function test_shorten_cuts_on_a_word_and_keeps_characters_whole(): void
    {
        $long = 'Ovo je rečenica koja ima čitav niz naših slova i mora se presjeći negdje na razmaku a ne usred riječi';

        $cut = SeoFields::shorten($long, 60);

        $this->assertLessThanOrEqual(60, mb_strlen($cut));
        $this->assertStringNotContainsString('...', $cut);
        $this->assertStringNotContainsString('…', $cut);
        // Still valid UTF-8: a byte-wise cut through "č" would fail this.
        $this->assertSame($cut, mb_convert_encoding($cut, 'UTF-8', 'UTF-8'));
        $this->assertStringStartsWith('Ovo je rečenica', $cut);
    }
}
