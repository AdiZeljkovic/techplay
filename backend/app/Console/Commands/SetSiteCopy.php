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

    protected $description = 'Apply the reviewed homepage and site-wide SEO copy';

    /**
     * Deliberately no game count in either string.
     *
     * A number here would be a third place for the catalogue size to rot, and
     * this one cannot correct itself — the hero reads its figure from the API
     * precisely so that no human has to remember to update it. Say the thing
     * that stays true instead.
     */
    private const HOME_TITLE = 'TechPlay — Game Library & Backlog Tracker, Synced From Steam';

    private const HOME_DESCRIPTION = 'Connect Steam and your game library fills itself — hours, sessions, finished titles. See your taste in numbers, and get a straight answer on what to play tonight.';

    private const HOME_OG_TITLE = 'TechPlay — your game library, kept for you';

    private const HOME_OG_DESCRIPTION = 'Your library fills itself from what you actually play. Then TechPlay reads it back: your taste, your year, and what to play next.';

    /** Used on any page that has not been given wording of its own. */
    private const SITE_DESCRIPTION = 'TechPlay keeps a record of your gaming — a library that fills itself from what you play — alongside game reviews, release dates, hardware coverage and guides.';

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

        // Both are read through caches that would otherwise serve the old
        // wording until they expired on their own.
        Cache::forget('site_settings');
        Cache::forget('page_seo./');

        $this->newLine();
        $this->info('Applied. Rebuild the frontend so the new metadata is rendered.');

        return self::SUCCESS;
    }
}
