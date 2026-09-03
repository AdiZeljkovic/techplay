<?php

use App\Models\PageSeo;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * `techplay.gg/support` has been promising a help centre since January.
 *
 * The row read:
 *
 *     Expert Support Center & FAQs | 2026 Technical Help | TechPlay
 *     Get expert technical assistance at the TechPlay Support Center. Browse
 *     our 2026 FAQs, troubleshoot account issues, and get help with our
 *     140,000+ game database.
 *
 * The page behind it takes PayPal donations. Everything in that description is
 * false: there were no FAQs, no troubleshooting and no support centre, and the
 * game count was wrong as well. Whoever clicked that result in the last eight
 * months arrived at a page asking them for money.
 *
 * Two changes:
 *
 * **`/support` now describes donations**, which is what it is.
 *
 * **`/help` gets a row of its own**, carrying a canonical that points at the
 * subdomain. Next routes the help centre internally at `/help`, so that is the
 * path `generatePageMetadata()` looks up — but the address a reader and a
 * crawler see is `help.techplay.gg`, and without the canonical the two are a
 * duplicate pair with nothing saying which one counts.
 *
 * `PageSeoSeeder` carries the same correction in the same commit. Without that,
 * a re-seed quietly reintroduces eight months of wrong copy.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('page_seo')
            ->where('page_path', '/support')
            ->update([
                'page_name' => 'Support us',
                'meta_title' => 'Support Us — Back Independent Gaming Media | TechPlay',
                'meta_description' => 'TechPlay runs without a publisher behind it. Back the site with a one-off contribution or a monthly supporter tier, and help keep the reviews independent.',
                'meta_keywords' => json_encode(['support techplay', 'donate', 'supporter tiers', 'independent gaming media']),
                'updated_at' => now(),
            ]);

        // updateOrInsert, not insert: this migration must be safe to run on a
        // database where the row was added by hand in the admin panel first.
        DB::table('page_seo')->updateOrInsert(
            ['page_path' => '/help'],
            [
                'page_name' => 'Help centre',
                'meta_title' => 'Help Centre — Answers and Troubleshooting | TechPlay',
                'meta_description' => 'Answers to what we are asked most: sign-in trouble, connecting Steam, Xbox, PlayStation, GOG and Epic, how XP works, emails, and what happens to your data.',
                'meta_keywords' => json_encode(['techplay help', 'help centre', 'account help', 'connect steam account']),
                'canonical_url' => rtrim((string) config('app.help_url'), '/'),
                'is_noindex' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        // The endpoint holds these for an hour under two keys. Two console
        // commands have written correct rows before and had them served stale
        // while everybody rebuilt the frontend wondering why nothing changed.
        PageSeo::forgetCache('/support');
        PageSeo::forgetCache('/help');
    }

    public function down(): void
    {
        // The `/help` row is this migration's own and goes back.
        DB::table('page_seo')->where('page_path', '/help')->delete();

        // `/support` does not. Rolling back would mean writing a description
        // that was false when it was written and is no less false now, and a
        // reversal that restores a lie is not a reversal worth automating. If
        // the old text is ever wanted, it is in this file's docblock.
        PageSeo::forgetCache('/help');
    }
};
