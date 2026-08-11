<?php

namespace App\Console\Commands\Diagnose;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Disk use, rows pointing at files that are gone, and files nobody points at.
 *
 * A missing file is the direction that matters most: it is a broken image on a
 * page somebody is looking at right now, and nothing in the application will
 * ever report it. The other direction — files no row mentions — is only ever a
 * list of candidates, because a path can reach a page through a route this
 * cannot see.
 *
 * The columns are discovered from the database rather than listed here. A
 * hand-written list goes stale the moment a column is renamed, and the guard
 * that skips a column which no longer exists makes that look like a clean
 * result. This project already had exactly that: `articles.featured_image` was
 * checked for years after the column became `featured_image_url`.
 *
 * Read-only. Deletes nothing.
 */
class DiagnoseStorage extends Command
{
    protected $signature = 'diagnose:storage {--orphans : Also list files no row references}';

    protected $description = 'Disk use per directory and rows whose file is missing';

    /**
     * Columns whose name matches the search but which never hold a file:
     * alt text, a route path, an enum. Listed as table.column.
     */
    private const NOT_FILES = [
        'page_seo.page_path',
        'users.profile_visibility',
    ];

    /** Suffixes appended to a resized variant of the same upload. */
    private const VARIANT_SUFFIXES = ['thumbnail', 'thumb', 'small', 'medium', 'large'];

    /** Values skipped, by reason, so the output can account for them. */
    private array $skipped = ['frontend' => 0, 'external' => 0, 'not_a_file' => 0];

    /** An original above this has no business being served to a phone. */
    private const OVERSIZED_BYTES = 1572864; // 1.5 MB

    public function handle(): int
    {
        $this->perDirectory();
        $referenced = $this->missingFiles();
        $this->oversized();

        if ($this->option('orphans')) {
            $this->orphanFiles($referenced + $this->referencedInHtml());
        }

        return self::SUCCESS;
    }

    /**
     * Originals nobody resized, and originals too big to serve.
     *
     * Image optimisation is disabled in Next.js on purpose — the game library
     * would eat the disk — so whatever is uploaded here is what a visitor
     * downloads. A 6 MB hero image is 6 MB on someone's mobile data.
     */
    private function oversized(): void
    {
        $disk = Storage::disk('public');

        $this->newLine();
        $this->info('Prevelike originalne slike');

        $big = [];

        foreach ($disk->allFiles() as $file) {
            if (! preg_match('/\.(jpe?g|png|webp|gif)$/i', $file)) {
                continue;
            }

            // A variant is derived from an original; only the original is worth
            // reporting, otherwise every large upload shows up four times.
            if ($this->stem($file) !== $this->join(trim(pathinfo($file, PATHINFO_DIRNAME), '.'), pathinfo($file, PATHINFO_FILENAME))) {
                continue;
            }

            try {
                $bytes = $disk->size($file);
            } catch (\Throwable) {
                continue;
            }

            if ($bytes >= self::OVERSIZED_BYTES) {
                $big[] = [$file, $bytes];
            }
        }

        if ($big === []) {
            $this->line('  Nijedna preko '.$this->human(self::OVERSIZED_BYTES).'.');

            return;
        }

        usort($big, fn ($a, $b) => $b[1] <=> $a[1]);
        $total = array_sum(array_column($big, 1));
        $shown = array_slice($big, 0, 12);

        $this->line(sprintf('  %d slika preko %s, ukupno %s. Next optimizacija je isključena — ovo ide posjetiocu kakvo jeste.',
            count($big), $this->human(self::OVERSIZED_BYTES), $this->human($total)));

        $this->table(['Fajl', 'Veličina'],
            array_map(fn ($r) => [$r[0], $this->human($r[1])], $shown));

        if (count($big) > count($shown)) {
            $this->line('  (prikazano '.count($shown).' od '.count($big).')');
        }
    }

    private function perDirectory(): void
    {
        $disk = Storage::disk('public');

        $this->newLine();
        $this->info('Javni disk, po direktoriju');

        $rows = [];

        foreach ($disk->directories() as $dir) {
            $files = $disk->allFiles($dir);
            $bytes = 0;

            foreach ($files as $file) {
                try {
                    $bytes += $disk->size($file);
                } catch (\Throwable) {
                    // A file that vanished between listing and sizing is not
                    // worth failing the whole report over.
                }
            }

            $rows[] = [$dir, count($files), $bytes];
        }

        usort($rows, fn ($a, $b) => $b[2] <=> $a[2]);

        $this->table(
            ['Direktorij', 'Fajlova', 'Veličina'],
            array_map(fn ($r) => [$r[0], number_format($r[1]), $this->human($r[2])], $rows)
        );

        $this->line('  ukupno: '.$this->human(array_sum(array_column($rows, 2))));
    }

    /**
     * @return array<string, true> every stem the database points at
     */
    private function missingFiles(): array
    {
        $disk = Storage::disk('public');

        $this->newLine();
        $this->info('Redovi čiji fajl ne postoji');

        $referenced = [];
        $findings = [];
        $checked = 0;

        foreach ($this->pathColumns() as [$table, $column]) {
            $checked++;
            $missing = 0;
            $sample = [];

            DB::table($table)
                ->whereNotNull($column)
                ->orderBy($column)
                ->chunk(1000, function ($rows) use (&$missing, &$sample, &$referenced, $column, $disk) {
                    foreach ($rows as $row) {
                        $path = $this->normalise((string) $row->{$column});

                        if ($path === null) {
                            continue;
                        }

                        $referenced[$this->stem($path)] = true;

                        if (! $disk->exists($path)) {
                            $missing++;

                            if (count($sample) < 2) {
                                $sample[] = $path;
                            }
                        }
                    }
                });

            if ($missing > 0) {
                $findings[] = [$table.'.'.$column, number_format($missing), implode(', ', $sample)];
            }
        }

        if ($findings === []) {
            $this->line('  Nijedan — svaki zapisani put ima svoj fajl.');
        } else {
            $this->line('  Ovo su slomljene slike na stranicama koje su trenutno žive.');
            $this->table(['Kolona', 'Nedostaje', 'Primjer'], $findings);
        }

        $this->line(sprintf(
            '  (%d kolona; preskočeno: %s u frontend/public, %s na tuđem hostu, %s nije fajl.)',
            $checked,
            number_format($this->skipped['frontend']),
            number_format($this->skipped['external']),
            number_format($this->skipped['not_a_file']),
        ));

        return $referenced;
    }

    /**
     * Every text column in the schema whose name suggests it holds a file.
     * Discovered, not listed, so a renamed column keeps being checked.
     *
     * @return list<array{0: string, 1: string}>
     */
    private function pathColumns(): array
    {
        if (DB::getDriverName() !== 'pgsql') {
            return [];
        }

        $rows = DB::select("
            select table_name, column_name
            from information_schema.columns
            where table_schema = 'public'
              and data_type in ('text', 'character varying')
              and column_name !~ '_alt$'
              and column_name ~ '(image|path|avatar|banner|icon|cover|photo|thumbnail|logo)'
            order by table_name, column_name
        ");

        $columns = [];

        foreach ($rows as $row) {
            $key = $row->table_name.'.'.$row->column_name;

            if (! in_array($key, self::NOT_FILES, true)) {
                $columns[] = [$row->table_name, $row->column_name];
            }
        }

        return $columns;
    }

    /**
     * A stored path in its on-disk form, or null when this disk is not where
     * the file lives.
     *
     * Four things end up in these columns and only one of them is ours:
     *
     *  - `articles/foo.jpg` — relative to the public disk. Ours.
     *  - `/storage/articles/foo.jpg` — the same file, written by Storage::url().
     *  - `/ranks/apex.webp` — a leading slash and no `storage/` means Next.js
     *    serves it out of frontend/public. Not on this disk, not missing.
     *  - `cpu`, `⚡`, a Steam CDN URL — not a file at all, or not our file.
     *
     * Getting this wrong is not a harmless false positive: the first version of
     * this check reported all twenty rank icons as broken images on a live site.
     */
    private function normalise(string $value): ?string
    {
        $value = trim($value);

        if ($value === '') {
            return null;
        }

        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            $path = (string) parse_url($value, PHP_URL_PATH);

            if (! str_contains($path, '/storage/')) {
                $this->skipped['external']++;

                return null;
            }

            $value = $path;
        }

        // An icon column often holds an emoji or a lucide icon name. A file has
        // an extension; those do not.
        if (! preg_match('/\.[a-z0-9]{2,5}$/i', $value)) {
            $this->skipped['not_a_file']++;

            return null;
        }

        if (str_starts_with($value, '/')) {
            $value = ltrim($value, '/');

            if (! str_starts_with($value, 'storage/')) {
                $this->skipped['frontend']++;

                return null;
            }
        }

        if (str_starts_with($value, 'storage/')) {
            $value = substr($value, 8);
        }

        return $value === '' ? null : $value;
    }

    /**
     * The identity an upload shares with its own resized variants:
     * `articles/foo-20260811-medium.webp` and `articles/foo-20260811.jpg`
     * are one upload, and only one of them is ever stored in a column.
     */
    private function stem(string $path): string
    {
        $dir = trim(pathinfo($path, PATHINFO_DIRNAME), '.');
        $name = pathinfo($path, PATHINFO_FILENAME);

        // Two writers, two separators: ImageOptimizationService joins with a
        // dash, the media pipeline with an underscore.
        foreach (self::VARIANT_SUFFIXES as $suffix) {
            foreach (['-', '_'] as $separator) {
                if (str_ends_with($name, $separator.$suffix)) {
                    return $this->join($dir, substr($name, 0, -strlen($suffix) - 1));
                }
            }
        }

        return $this->join($dir, $name);
    }

    private function join(string $dir, string $name): string
    {
        return ($dir === '' ? '' : $dir.'/').$name;
    }

    /**
     * Images embedded in article and guide bodies.
     *
     * The editor writes `<img src="…/storage/articles/content/x.png">` straight
     * into the HTML, so those files are referenced by no column at all. Without
     * reading the bodies, the orphan list is mostly live article images — on
     * production that was 466 files and 196 MB of them, which makes the list
     * useless as anything but a warning label.
     *
     * @return array<string, true>
     */
    private function referencedInHtml(): array
    {
        if (DB::getDriverName() !== 'pgsql') {
            return [];
        }

        $columns = DB::select("
            select table_name, column_name
            from information_schema.columns
            where table_schema = 'public'
              and data_type = 'text'
              and column_name in ('content', 'body', 'description_html')
        ");

        $found = [];

        foreach ($columns as $column) {
            DB::table($column->table_name)
                ->whereNotNull($column->column_name)
                ->where($column->column_name, 'like', '%/storage/%')
                ->orderBy($column->column_name)
                ->chunk(200, function ($rows) use (&$found, $column) {
                    foreach ($rows as $row) {
                        preg_match_all('#/storage/([\w\-./]+\.[a-z0-9]{2,5})#i',
                            (string) $row->{$column->column_name}, $matches);

                        foreach ($matches[1] as $path) {
                            $found[$this->stem($path)] = true;
                        }
                    }
                });
        }

        return $found;
    }

    /**
     * Files on disk that nothing mentions — not a column, not an article body.
     * Candidates only, never a delete list. Nothing here proves a file is
     * unreachable; it proves nothing this command can read names it.
     *
     * @param  array<string, true>  $referenced
     */
    private function orphanFiles(array $referenced): void
    {
        $disk = Storage::disk('public');

        $this->newLine();
        $this->info('Fajlovi koje nijedna kolona ne spominje');

        $perDir = [];

        foreach ($disk->allFiles() as $file) {
            if (isset($referenced[$this->stem($file)])) {
                continue;
            }

            $dir = trim(pathinfo($file, PATHINFO_DIRNAME), '.');
            $dir = $dir === '' ? '(korijen)' : explode('/', $dir)[0];

            $perDir[$dir] ??= ['count' => 0, 'bytes' => 0, 'sample' => []];
            $perDir[$dir]['count']++;

            try {
                $perDir[$dir]['bytes'] += $disk->size($file);
            } catch (\Throwable) {
            }

            if (count($perDir[$dir]['sample']) < 1) {
                $perDir[$dir]['sample'][] = basename($file);
            }
        }

        if ($perDir === []) {
            $this->line('  Nijedan.');

            return;
        }

        uasort($perDir, fn ($a, $b) => $b['bytes'] <=> $a['bytes']);

        $this->table(
            ['Direktorij', 'Fajlova', 'Veličina', 'Primjer'],
            array_map(fn ($dir, $d) => [$dir, number_format($d['count']), $this->human($d['bytes']), $d['sample'][0] ?? ''],
                array_keys($perDir), $perDir)
        );

        $this->newLine();
        $this->warn('  Ovo NIJE spisak za brisanje.');
        $this->line('  Slike ugrađene u tekst članaka i vodiča su odbijene i ne pojavljuju se ovdje,');
        $this->line('  ali sadržaj može doći i s mjesta koje ova komanda ne čita. Trag, ne presuda.');
    }

    private function human(int $bytes): string
    {
        foreach (['B', 'KB', 'MB', 'GB'] as $i => $unit) {
            $value = $bytes / (1024 ** $i);

            if ($value < 1024 || $unit === 'GB') {
                return round($value, 1).' '.$unit;
            }
        }

        return $bytes.' B';
    }
}
