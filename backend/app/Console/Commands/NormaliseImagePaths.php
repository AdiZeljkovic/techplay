<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Turn stored absolute image URLs back into storage paths.
 *
 * 401 of 625 articles hold the full thing —
 * `https://api-beta.techplay.gg/storage/articles/01KQZ….jpg` — and 223 hold
 * `articles/01KJB….png`. Both render today, because
 * `Article::getFeaturedImageUrlAttribute()` passes an absolute URL straight
 * through and expands a bare path through the storage disk.
 *
 * Which is exactly why it is worth fixing quietly rather than urgently: the
 * hostname in those 401 rows is data, not configuration. Rename the API domain
 * — and `api-beta` is a name this project already calls historical — and 401
 * article images break at once, with nothing in the code to change, because the
 * old name is sitting in the database.
 *
 * Only our own storage prefix is stripped. A row pointing at somebody else's
 * host is left exactly as it is.
 */
class NormaliseImagePaths extends Command
{
    protected $signature = 'images:normalise-paths {--dry-run : count what would change and write nothing}';

    protected $description = 'Rewrite stored absolute image URLs on our own storage back to relative paths';

    public function handle(): int
    {
        $prefixes = array_values(array_unique(array_filter([
            rtrim((string) config('app.url'), '/').'/storage/',
            rtrim((string) config('app.asset_url'), '/').'/storage/',
        ], fn ($p) => $p !== '/storage/')));

        if ($prefixes === []) {
            $this->error('No app URL configured — nothing to strip.');

            return self::FAILURE;
        }

        $this->line('Stripping: '.implode(', ', $prefixes));

        $targets = [
            'articles' => ['featured_image_url'],
            'guides' => ['featured_image_url'],
        ];

        $dry = (bool) $this->option('dry-run');
        $total = 0;

        foreach ($targets as $table => $columns) {
            foreach ($columns as $column) {
                foreach ($prefixes as $prefix) {
                    $query = DB::table($table)->where($column, 'like', $prefix.'%');
                    $count = (clone $query)->count();

                    if ($count === 0) {
                        continue;
                    }

                    $total += $count;
                    $this->line(sprintf('  %s.%s — %d row%s', $table, $column, $count, $count === 1 ? '' : 's'));

                    if (! $dry) {
                        $query->update([
                            $column => DB::raw("substring({$column} from ".(mb_strlen($prefix) + 1).')'),
                        ]);
                    }
                }
            }
        }

        $this->info($dry
            ? "Dry run: {$total} rows would be rewritten."
            : "Rewrote {$total} rows.");

        return self::SUCCESS;
    }
}
