<?php

namespace App\Console\Commands;

use App\Models\PageSeo;
use Illuminate\Console\Command;

/**
 * The claims about how many people read this site, removed.
 *
 * `seo:fix-game-counts` corrects the catalogue figure because that is a number
 * the database can settle. It deliberately only *reports* these, on the
 * grounds that a regex should not decide what the audience is — and that was
 * right until somebody decided. This is that decision, written out.
 *
 * What was standing on 17 Aug 2026:
 *
 *   /marketing  "Partner with TechPlay to reach millions of gaming enthusiasts."
 *   /marketing  "a highly engaged, tech-savvy audience of millions worldwide"
 *   /impressum  "we foster a trusted environment for our millions of readers worldwide"
 *   /terms      "a trusted advisor for millions of enthusiasts worldwide"
 *
 * None of it is true, and on /marketing it is said to people being asked for
 * money, which is the worst place to leave an unchecked claim. The replacements
 * do not swap in a smaller number — a real one would be out of date within the
 * month and invites the same problem back. They describe the audience by what
 * it is instead of how much of it there is, which is both defensible and, for
 * an advertiser, more useful: "engaged and technical" sells better than a
 * figure the buyer can check against a traffic estimator and disbelieve.
 *
 * Each replacement is written out in full rather than matched by pattern, and
 * the command refuses to write when it cannot find the exact text it expects —
 * so an edit made in the admin panel is never silently overwritten by a
 * half-matching rule.
 *
 *     php artisan seo:fix-audience-claims --dry-run
 *     php artisan seo:fix-audience-claims
 */
class FixAudienceClaims extends Command
{
    protected $signature = 'seo:fix-audience-claims {--dry-run : Show what would change without writing}';

    protected $description = 'Replace unsupported claims about audience size in page SEO';

    /**
     * @var array<string, array<int, array{0: string, 1: string}>> path => [[before, after], …]
     */
    private const REPLACEMENTS = [
        '/marketing' => [
            [
                'Partner with TechPlay to reach millions of gaming enthusiasts.',
                'Partner with TechPlay to reach an audience that arrives for the hardware numbers and stays for the catalogue.',
            ],
            [
                'a highly engaged, tech-savvy audience of millions worldwide',
                'a highly engaged, technical audience',
            ],
        ],
        '/impressum' => [
            [
                'we foster a trusted environment for our millions of readers worldwide',
                'we foster a trusted environment for our readers',
            ],
        ],
        '/terms' => [
            [
                'it is a trusted advisor for millions of enthusiasts worldwide',
                'it is a reference for people who take games and hardware seriously',
            ],
        ],
    ];

    /** Fields that can carry the claim. */
    private const FIELDS = ['meta_title', 'meta_description', 'og_title', 'og_description'];

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');
        $touched = 0;
        $unmatched = [];

        foreach (self::REPLACEMENTS as $path => $pairs) {
            $row = PageSeo::where('page_path', $path)->first();

            if (! $row) {
                $this->warn("  {$path} — nema zapisa, preskacem");

                continue;
            }

            $changes = [];

            foreach (self::FIELDS as $field) {
                $before = (string) ($row->{$field} ?? '');

                if ($before === '') {
                    continue;
                }

                $after = $before;

                foreach ($pairs as [$find, $replace]) {
                    if (str_contains($after, $find)) {
                        $after = str_replace($find, $replace, $after);
                    }
                }

                if ($after !== $before) {
                    $changes[$field] = $after;
                }
            }

            // Anything the copy no longer says the way this command expects.
            // Reported rather than forced: the text has been edited by hand
            // before and will be again.
            foreach ($pairs as [$find, $_]) {
                $found = false;

                foreach (self::FIELDS as $field) {
                    if (str_contains((string) ($row->{$field} ?? ''), $find)) {
                        $found = true;
                        break;
                    }
                }

                if (! $found) {
                    $unmatched[] = [$path, $find];
                }
            }

            if ($changes === []) {
                continue;
            }

            $touched++;
            $this->line("  <fg=yellow>~</> {$path}");

            foreach ($changes as $field => $after) {
                $this->line("      {$field}");
            }

            if (! $dry) {
                $row->forceFill($changes)->save();
                PageSeo::forgetCache($row->page_path);
            }
        }

        $this->newLine();

        if ($touched === 0) {
            $this->info('Nema tvrdnji o publici za ispravku.');
        } elseif ($dry) {
            $this->info("{$touched} stranica bi se promijenilo. Probni hod — nista nije upisano.");
        } else {
            PageSeo::forgetCache();
            $this->info("{$touched} stranica ispravljeno. Rebuild fronta da nova metapodaci izadju.");
        }

        if ($unmatched !== []) {
            $this->newLine();
            $this->warn('Ocekivani tekst nije nadjen — vjerovatno je vec izmijenjen rucno:');

            foreach ($unmatched as [$path, $find]) {
                $excerpt = mb_strlen($find) > 70 ? mb_substr($find, 0, 70).'…' : $find;
                $this->line("  <fg=cyan>{$path}</>  \"{$excerpt}\"");
            }
        }

        return self::SUCCESS;
    }
}
