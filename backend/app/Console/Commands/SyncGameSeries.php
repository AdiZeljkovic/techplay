<?php

namespace App\Console\Commands;

use App\Models\GameSeries;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Rebuild `game_series` from the game rows.
 *
 * Idempotent, and safe to run after every catalogue sync: a series that gained
 * games gets a new count, one that lost them all is removed, and a slug already
 * published never moves — see resolveSlug().
 *
 *     php artisan games:sync-series
 *     php artisan games:sync-series --dry-run
 */
class SyncGameSeries extends Command
{
    protected $signature = 'games:sync-series {--dry-run : Report what would change without writing}';

    protected $description = 'Rebuild the game_series index from games.series_key';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');

        /*
         * Driver-aware, so the test suite can run it.
         *
         * Production is PostgreSQL and the tests are in-memory SQLite, which
         * has no `extract(year from ...)` and no `regexp_replace`. Dates come
         * back whole and the year is taken in PHP; the description check
         * mirrors Game::indexable(), which draws the same line for a single
         * title and splits on the driver for the same reason.
         */
        $described = DB::getDriverName() === 'pgsql'
            ? "count(*) filter (where description is not null and length(regexp_replace(description, '<[^>]+>', '', 'g')) > 50)"
            : 'sum(case when description is not null and length(description) > 50 then 1 else 0 end)';

        $rows = DB::table('games')
            ->selectRaw('series_key, max(series_name) as name, count(*) as games_count, min(released) as first_released, max(released) as last_released, '.$described.' as described_count')
            ->whereNotNull('series_key')
            ->whereNotNull('series_name')
            ->where('series_name', '<>', '')
            ->groupBy('series_key')
            ->get()
            ->all();

        $this->line('  '.count($rows).' series in the catalogue.');

        // Slugs already published win. A rebuild that reassigned them would
        // silently 404 every link and sitemap entry pointing at the old one.
        $taken = GameSeries::pluck('slug', 'series_key')->all();
        $claimed = array_flip($taken);

        $created = 0;
        $updated = 0;
        $collisions = [];

        // Biggest first, so when two names slugify the same the series a reader
        // is more likely to mean gets the bare slug rather than whichever row
        // the database happened to return first.
        usort($rows, fn ($a, $b) => $b->games_count <=> $a->games_count);

        foreach ($rows as $row) {
            $key = (int) $row->series_key;

            $slug = $taken[$key] ?? $this->resolveSlug((string) $row->name, $key, $claimed, $collisions);

            if ($slug === null) {
                continue;
            }

            $claimed[$slug] = $key;

            $attributes = [
                'name' => (string) $row->name,
                'slug' => $slug,
                'games_count' => (int) $row->games_count,
                'first_year' => $this->year($row->first_released),
                'last_year' => $this->year($row->last_released),
                'described_count' => (int) $row->described_count,
            ];

            if ($dry) {
                isset($taken[$key]) ? $updated++ : $created++;

                continue;
            }

            $series = GameSeries::updateOrCreate(['series_key' => $key], $attributes);

            $series->wasRecentlyCreated ? $created++ : $updated++;
        }

        // A series key that no longer appears in `games` — the games were
        // deleted, or the aggregator regrouped them.
        $live = array_map(fn ($r) => (int) $r->series_key, $rows);
        $stale = GameSeries::whereNotIn('series_key', $live ?: [0])->pluck('slug', 'series_key');

        if (! $dry && $stale->isNotEmpty()) {
            GameSeries::whereIn('series_key', $stale->keys())->delete();
        }

        $this->line("  created {$created}, updated {$updated}, removed {$stale->count()}.");

        if ($collisions !== []) {
            // Named rather than counted: a suffixed slug is a URL somebody may
            // have to explain later.
            $this->line('  '.count($collisions).' name(s) already taken, suffixed with the series key:');
            foreach (array_slice($collisions, 0, 10) as $line) {
                $this->line("    {$line}");
            }
        }

        $indexable = $dry ? null : GameSeries::indexable()->count();

        if ($indexable !== null) {
            $this->info("  {$indexable} series carry three games or more with something written about them.");
        }

        return self::SUCCESS;
    }

    /**
     * @param  array<string, int>  $claimed
     * @param  list<string>  $collisions
     */
    private function resolveSlug(string $name, int $key, array $claimed, array &$collisions): ?string
    {
        $base = Str::slug($name);

        if ($base === '') {
            // A name that is punctuation or a script Str::slug drops entirely.
            // There is no readable URL to build, so the series has none.
            return null;
        }

        if (! isset($claimed[$base])) {
            return $base;
        }

        $collisions[] = "{$name} → {$base}-{$key}";

        return "{$base}-{$key}";
    }

    /**
     * The year out of a date the driver may hand back as a string or a
     * DateTime, guarded for the unsignedSmallInteger column — the catalogue
     * holds a handful of placeholder dates far outside anything ever shipped.
     */
    private function year(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        $year = (int) substr((string) $value, 0, 4);

        return $year >= 1950 && $year <= 2100 ? $year : null;
    }
}
