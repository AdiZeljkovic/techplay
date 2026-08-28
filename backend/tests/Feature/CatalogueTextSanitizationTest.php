<?php

namespace Tests\Feature;

use App\Services\SanitizationService;
use Tests\TestCase;

/**
 * Game descriptions are somebody else's text, and they carry somebody else's links.
 *
 * MobyGames writes links back to MobyGames into the descriptions it hands over:
 * 57,172 of them across 36,916 game pages, measured 28 Aug 2026. They were
 * nofollowed, so nothing leaked to search — they simply sent readers from
 * thirty-six thousand of our pages to a rival catalogue, inside sentences like
 * "the sequel to V Tennis".
 *
 * The anchor goes and the words stay. Deleting the link text would leave
 * "the sequel to , notable as", which is worse than the link.
 */
class CatalogueTextSanitizationTest extends TestCase
{
    private SanitizationService $sanitizer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sanitizer = app(SanitizationService::class);
    }

    public function test_a_link_loses_its_anchor_and_keeps_its_words(): void
    {
        $out = $this->sanitizer->sanitizeCatalogueText(
            '<p>V-Tennis 2 is the sequel to <a href="https://www.mobygames.com/game/71251/v-tennis/">V Tennis</a>, notable for its animation.</p>'
        );

        $this->assertStringNotContainsString('mobygames.com', $out);
        $this->assertStringNotContainsString('<a ', $out);
        $this->assertStringContainsString('the sequel to V Tennis, notable', $out);
    }

    public function test_the_rest_of_the_formatting_survives(): void
    {
        $out = $this->sanitizer->sanitizeCatalogueText(
            '<p>A <strong>bold</strong> claim and an <em>italic</em> one.</p><ul><li>first</li><li>second</li></ul>'
        );

        foreach (['<strong>', '<em>', '<ul>', '<li>'] as $tag) {
            $this->assertStringContainsString($tag, $out, "{$tag} should have survived.");
        }
    }

    public function test_it_is_still_a_sanitiser(): void
    {
        $out = $this->sanitizer->sanitizeCatalogueText(
            '<p>Fine.</p><script>alert(1)</script><img src=x onerror=alert(1)><iframe src="https://evil.example"></iframe>'
        );

        foreach (['<script', 'onerror', '<iframe', '<img'] as $bad) {
            $this->assertStringNotContainsString($bad, $out, "{$bad} got through.");
        }
        $this->assertStringContainsString('Fine.', $out);
    }

    public function test_forum_posts_keep_their_links(): void
    {
        // The reason this is its own profile rather than a change to the shared
        // one: a forum post is somebody deliberately linking somewhere, and
        // that has to keep working.
        $out = $this->sanitizer->sanitizeRichContent(
            '<p>Look at <a href="https://example.com/thing">this</a>.</p>'
        );

        $this->assertStringContainsString('<a', $out);
        $this->assertStringContainsString('example.com/thing', $out);
        $this->assertStringContainsString('nofollow', $out, 'External links should still be nofollowed.');
    }
}
