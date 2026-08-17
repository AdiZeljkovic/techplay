<?php

namespace App\Console\Commands;

use App\Models\Game;
use App\Models\PageSeo;
use Illuminate\Console\Command;

/**
 * The catalogue size, corrected everywhere it is asserted.
 *
 * On 17 Aug 2026, thirty-six of the forty-four `page_seo` rows told search
 * engines the site held "1M+" games. The catalogue held 141,580 — the claim was
 * out by a factor of seven, and it was on /privacy and /cookies as readily as
 * on /games.
 *
 * These rows are written in an admin form, so none of it was ever reviewed and
 * the same sentence was pasted across three dozen pages. `site:copy` fixed the
 * homepage; this fixes the rest.
 *
 * It is deliberately a *replacement of the number*, not a rewrite. Somebody
 * wrote those descriptions and most of each one is fine; swapping the figure
 * keeps their work and removes only the false part. Rewriting thirty-six pages
 * of copy is a job for a person, not a regex.
 *
 *     php artisan seo:fix-game-counts --dry-run
 *     php artisan seo:fix-game-counts
 */
class FixSeoGameCounts extends Command
{
    protected $signature = 'seo:fix-game-counts {--dry-run : Show what would change without writing}';

    protected $description = 'Replace overstated game-catalogue figures in page SEO with the real one';

    /** Fields that can carry the claim. */
    private const FIELDS = ['meta_title', 'meta_description', 'og_title', 'og_description', 'seo_text'];

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');

        // Rounded down to the ten-thousand, so the sentence stays true as the
        // catalogue grows and nobody has to run this again next month. An exact
        // figure in prose is a figure that starts rotting the day it is written.
        $actual = Game::count();
        $safe = (int) floor($actual / 10000) * 10000;

        if ($safe < 10000) {
            $this->error("Catalogue reports {$actual} games — refusing to write a figure from that.");

            return self::FAILURE;
        }

        $spelled = number_format($safe);

        $this->line('Catalogue holds <fg=green>'.number_format($actual)."</> games; writing <fg=green>{$spelled}+</>.");
        $this->newLine();

        // The figure is replaced whatever noun follows it.
        //
        // A first version listed the nouns — games, titles, game database — and
        // three phrasings walked straight past it: "1M+ Game Data", "over 1M
        // titles", "the TechPlay 1M+ Game Encyclopedia". Copy written by hand
        // across three dozen pages always has a wording nobody predicted, so
        // match the number and leave the sentence alone.
        //
        // Ordered longest-first: "over 1M" has to be seen before "1M".
        //
        // The digits-with-separators form was missed on the first run and left
        // "our 1,000,000+ game database" standing on /impressum and "data on
        // over 1,000,000 titles" on /marketing — the page where the claim is
        // made to somebody being asked for money. Written out, the number does
        // not look like the shorthand the earlier patterns were built for.
        $patterns = [
            '/\bover\s+1[,.\s]?000[,.\s]?000\+?(?=\W)/i' => "over {$spelled}",
            '/\bover\s+1\s*M\+?(?=\W)/i' => "over {$spelled}",
            '/\bover\s+(?:1|one)\s+million(?=\W)/i' => "over {$spelled}",
            '/\b1[,.\s]?000[,.\s]?000\+/' => "{$spelled}+",
            '/\b1[,.\s]?000[,.\s]?000\b/' => $spelled,
            '/\b1\s*M\+/i' => "{$spelled}+",
            '/\b(?:1|one)\s+million\b/i' => $spelled,
            // The earlier, smaller overstatement, from before the catalogue was
            // cleaned twice.
            '/\b200,?000\+?(?=\W)/i' => "{$spelled}+",
            // Vaguer forms of the same claim: "millions of titles in our
            // digital encyclopedia", "over a million titles".
            '/\bmillions\s+of\s+(titles|games)\b/i' => "{$spelled} $1",
            '/\bover\s+a\s+million\s+(titles|games)\b/i' => "over {$spelled} $1",
        ];

        $touched = 0;

        foreach (PageSeo::all() as $row) {
            $changes = [];

            foreach (self::FIELDS as $field) {
                $before = (string) ($row->{$field} ?? '');

                if ($before === '') {
                    continue;
                }

                $after = preg_replace(array_keys($patterns), array_values($patterns), $before);

                if ($after !== null && $after !== $before) {
                    $changes[$field] = $after;
                }
            }

            if ($changes === []) {
                continue;
            }

            $touched++;
            $this->line("  <fg=yellow>~</> {$row->page_path}");

            foreach ($changes as $field => $after) {
                $this->line("      {$field}: ".$this->excerpt($after));
            }

            if (! $dry) {
                $row->forceFill($changes)->save();
                // Per path: the endpoint caches each one separately for an hour.
                PageSeo::forgetCache($row->page_path);
            }
        }

        $this->newLine();

        if ($touched === 0) {
            $this->info('No catalogue figures to correct.');
        } elseif ($dry) {
            $this->info("{$touched} page(s) would change. Dry run — nothing written.");
        } else {
            PageSeo::forgetCache();
            $this->info("{$touched} page(s) corrected. Rebuild the frontend so the new metadata is served.");
        }

        // Always — a run that changes nothing is exactly when somebody needs to
        // be told what is still standing.
        $this->reportAudienceClaims();

        return self::SUCCESS;
    }

    /**
     * Claims about the audience, reported rather than rewritten.
     *
     * "millions of readers", "an audience of millions" — these are the same
     * kind of overstatement as the catalogue figure, but they are not the
     * catalogue and no number in this database can settle them. On /marketing
     * they are also a claim made to people being asked for money, which is the
     * worst place to leave one standing unexamined.
     *
     * A regex should not decide what the audience is. This prints them so a
     * person can.
     */
    private function reportAudienceClaims(): void
    {
        $found = [];

        foreach (PageSeo::all() as $row) {
            foreach (self::FIELDS as $field) {
                $value = (string) ($row->{$field} ?? '');

                // Plain string search rather than a lookahead. The regex form
                // of this worked everywhere it was tested and silently found
                // nothing inside the command; the point here is to be readable
                // and certain, not clever.
                if (stripos($value, 'million') === false) {
                    continue;
                }

                foreach (preg_split('/(?<=[.!?])\s+/', $value) as $sentence) {
                    if (stripos($sentence, 'million') === false) {
                        continue;
                    }

                    // The catalogue forms are corrected above; what is left is
                    // about the audience.
                    if (preg_match('/million[s]?\s+(?:of\s+)?(?:titles|games)/i', $sentence)) {
                        continue;
                    }

                    $clean = trim((string) preg_replace(['/<[^>]*>/', '/\s+/'], ['', ' '], $sentence));

                    if ($clean !== '') {
                        $found[] = [$row->page_path, mb_strlen($clean) > 110 ? mb_substr($clean, 0, 110).'…' : $clean];
                    }
                }
            }
        }

        if ($found === []) {
            return;
        }

        $this->newLine();
        $this->warn('Claims about the audience, left untouched — each needs a real figure or removal:');

        foreach ($found as [$path, $sentence]) {
            $this->line("  <fg=cyan>{$path}</>  {$sentence}");
        }
    }

    /** Enough of the corrected line to recognise it, without filling the screen. */
    private function excerpt(string $text): string
    {
        $text = preg_replace('/\s+/', ' ', trim($text));

        return mb_strlen($text) > 110 ? mb_substr($text, 0, 110).'…' : $text;
    }
}
