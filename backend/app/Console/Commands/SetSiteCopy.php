<?php

namespace App\Console\Commands;

use App\Models\PageSeo;
use App\Models\SiteSetting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

/**
 * The site's headline copy, where it lives in the database rather than in code.
 *
 * Most of TechPlay's wording is in components and moves with a deploy. Two of
 * the most visible strings are not: the homepage's title and description come
 * from a `page_seo` row, and the site-wide fallback description from a
 * `site_settings` key. Both are edited in the admin panel, which means neither
 * is in version control and neither gets reviewed.
 *
 * That is how this happened: on 17 Aug 2026 the homepage was telling Google it
 * held a "Database of 1M+ Games" and "over 1 million games". The catalogue held
 * 141,580 — the claim was out by a factor of seven, in the one place a search
 * engine reads first. A separate hard-coded "200K+" in the hero was wrong in
 * the same direction and has been replaced by a figure read from the API.
 *
 * So this command exists to make those two strings reviewable: the wording sits
 * in the diff, and running it is a deliberate act rather than a form somebody
 * half-remembers editing. It is idempotent — run it as often as you like.
 *
 *     php artisan site:copy            # apply
 *     php artisan site:copy --dry-run  # show what would change
 */
class SetSiteCopy extends Command
{
    protected $signature = 'site:copy {--dry-run : Print the changes without writing them}';

    protected $description = 'Apply the reviewed homepage copy, site description and robots.txt';

    /**
     * Deliberately no game count in either string.
     *
     * A number here would be a third place for the catalogue size to rot, and
     * this one cannot correct itself — the hero reads its figure from the API
     * precisely so that no human has to remember to update it. Say the thing
     * that stays true instead.
     */
    /*
     * Three platform names, because that is both the product and the search
     * term. An earlier version said "Synced From Steam", which described a
     * third of what this does — nowhere else shows a player what they own
     * across platforms, and that is the whole reason to be here.
     */
    private const HOME_TITLE = 'TechPlay — One Game Library for PC, PlayStation & Xbox';

    /*
     * 145 characters, because the last sentence is the one worth keeping.
     *
     * At 185 Google cut it mid-clause — "...and get a straight answer" — and
     * the promise the page is actually making went missing from the snippet.
     * Nothing was added to make it shorter; two joins were tightened and the
     * closing line came back whole.
     */
    private const HOME_DESCRIPTION = 'Connect Steam, PlayStation and Xbox: every game you own in one library, with the hours you played, and a straight answer on what to play tonight.';

    private const HOME_OG_TITLE = 'TechPlay — one library for everything you play';

    private const HOME_OG_DESCRIPTION = 'Steam, PlayStation and Xbox in one library, filled from what you actually play. Then TechPlay reads it back: your taste, your year, and what to play next.';

    /** Used on any page that has not been given wording of its own. */
    private const SITE_DESCRIPTION = 'TechPlay puts every game you own in one library — Steam, PlayStation and Xbox together — alongside game reviews, release dates, hardware coverage and guides.';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');

        $home = PageSeo::where('page_path', '/')->first();

        if (! $home) {
            $this->error('No page_seo row for "/" — nothing to update. Create the Homepage entry in the admin panel first.');

            return self::FAILURE;
        }

        $changes = [
            'homepage title' => [$home->meta_title, self::HOME_TITLE],
            'homepage description' => [$home->meta_description, self::HOME_DESCRIPTION],
            'homepage og:title' => [$home->og_title, self::HOME_OG_TITLE],
            'homepage og:description' => [$home->og_description, self::HOME_OG_DESCRIPTION],
            'site-wide description' => [SiteSetting::where('key', 'seo_meta_description')->value('value'), self::SITE_DESCRIPTION],
        ];

        foreach ($changes as $label => [$before, $after]) {
            if ($before === $after) {
                $this->line("  = {$label} — already correct");

                continue;
            }

            $this->line("  <fg=yellow>~</> {$label}");
            $this->line('      before: '.($before === null ? '(empty)' : $before));
            $this->line('      after:  '.$after);
        }

        // Before the dry-run exit, or --dry-run would never show it.
        $this->fixRobots($dry);

        if ($dry) {
            $this->newLine();
            $this->info('Dry run — nothing written.');

            return self::SUCCESS;
        }

        $home->forceFill([
            'meta_title' => self::HOME_TITLE,
            'meta_description' => self::HOME_DESCRIPTION,
            'og_title' => self::HOME_OG_TITLE,
            'og_description' => self::HOME_OG_DESCRIPTION,
        ])->save();

        SiteSetting::updateOrCreate(
            ['key' => 'seo_meta_description'],
            ['value' => self::SITE_DESCRIPTION],
        );

        // The keys here were guesses, and both were wrong: the endpoints cache
        // under 'settings.all' / 'settings.grouped' and
        // 'page_seo.path.<md5>'. The rows were written correctly and the API
        // kept serving the old wording for an hour, through two rebuilds.
        Cache::forget('settings.all');
        Cache::forget('settings.grouped');
        PageSeo::forgetCache('/');

        $this->newLine();
        $this->info('Applied. Rebuild the frontend so the new metadata is rendered.');

        return self::SUCCESS;
    }

    /**
     * robots.txt, corrected in place rather than replaced.
     *
     * It lives in a `site_settings` row and is edited in a form, so like the
     * homepage copy it was never reviewed — and it still pointed Googlebot-News
     * at /tech/, a section that moved to /hardware and now answers 404 on all
     * four of its paths.
     *
     * Only the known-wrong lines are touched. Whoever wrote the rest of this
     * file had reasons, and a command that overwrites it wholesale would lose
     * them the first time it ran.
     */
    private function fixRobots(bool $dry): void
    {
        $robots = (string) SiteSetting::get('seo_robots_txt_content', '');

        if ($robots === '') {
            $this->line('  = robots.txt — not set in the database, nothing to correct');

            return;
        }

        $fixed = str_replace(
            ['Allow: /tech/', 'Disallow: /tech/'],
            ['Allow: /hardware/', 'Disallow: /hardware/'],
            $robots
        );

        // The Sitemap line is appended by the route on every request now, so a
        // stored one is at best duplication and at worst the wrong hostname.
        $fixed = trim((string) preg_replace('/^[ 	]*Sitemap:.*$/mi', '', $fixed));

        if ($fixed === trim($robots)) {
            $this->line('  = robots.txt — already correct');

            return;
        }

        $this->line('  <fg=yellow>~</> robots.txt — /tech/ paths and any stored Sitemap line');

        if (! $dry) {
            SiteSetting::updateOrCreate(['key' => 'seo_robots_txt_content'], ['value' => $fixed]);
        }
    }
}
