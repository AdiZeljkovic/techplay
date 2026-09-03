<?php

namespace Tests\Feature;

use Database\Seeders\PageSeoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Two things on this site are called support, and they mean opposite things.
 *
 * `techplay.gg/support` takes PayPal donations. The help centre is at
 * help.techplay.gg. For eight months the `/support` row in `page_seo` read
 *
 *     Expert Support Center & FAQs | 2026 Technical Help | TechPlay
 *
 * so anyone who clicked that search result arrived at a page asking them for
 * money — and there were no FAQs anywhere on the site to arrive at instead.
 *
 * The migration fixed the live row. This guards the other half: the seeder
 * carried the same copy, and a re-seed would have put it straight back with
 * nothing failing and nobody noticing until it turned up in search again.
 */
class SupportPageSeoTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_donation_page_no_longer_advertises_a_support_centre(): void
    {
        $this->seed(PageSeoSeeder::class);

        $row = DB::table('page_seo')->where('page_path', '/support')->first();

        $this->assertNotNull($row);

        $copy = mb_strtolower($row->meta_title.' '.$row->meta_description);

        foreach (['support center', 'support centre', 'faq', 'troubleshoot', 'help center'] as $claim) {
            $this->assertStringNotContainsString(
                $claim,
                $copy,
                "The donation page still promises \"{$claim}\" — that is the help centre, on another host."
            );
        }

        $this->assertStringContainsString('support us', mb_strtolower($row->page_name.' '.$row->meta_title));
    }

    /**
     * The help centre's own row, and the canonical that keeps it from being a
     * duplicate of itself.
     *
     * Next routes the help centre internally at `/help`, which is the path
     * `generatePageMetadata()` looks up — but the address a reader and a
     * crawler see is the subdomain. Without a canonical saying so, the two are
     * an unresolved duplicate pair and Google picks whichever it likes.
     */
    public function test_the_help_centre_has_a_row_pointing_at_its_real_address(): void
    {
        // Inserted by the migration, so no seeding here on purpose: the row has
        // to exist on production, where seeders are not run.
        $row = DB::table('page_seo')->where('page_path', '/help')->first();

        $this->assertNotNull($row, 'The /help page_seo row is missing — the migration did not run.');
        $this->assertSame(rtrim((string) config('app.help_url'), '/'), $row->canonical_url);
        $this->assertFalse((bool) $row->is_noindex);
    }
}
