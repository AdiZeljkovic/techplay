<?php

namespace App\Console\Commands;

use App\Models\Game;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportRawgCsv extends Command
{
    protected $signature = 'rawg:import-csv
        {--path= : Path to CSV file (default: storage/app/rawg-dataset/rawg-games-dataset.csv)}
        {--chunk=500 : Insert chunk size}
        {--skip=0 : Skip first N rows (resume)}';

    protected $description = 'Import RAWG CSV dataset into the games table';

    public function handle(): int
    {
        $path  = $this->option('path') ?? storage_path('app/rawg-dataset/rawg-games-dataset.csv');
        $chunk = (int) $this->option('chunk');
        $skip  = (int) $this->option('skip');

        if (! file_exists($path)) {
            $this->error("File not found: {$path}");
            return self::FAILURE;
        }

        $this->info("Opening: {$path}");
        $this->info("Chunk size: {$chunk} | Skip: {$skip} rows");
        $this->newLine();

        $handle = fopen($path, 'r');
        if (! $handle) {
            $this->error('Cannot open file.');
            return self::FAILURE;
        }

        // Read header
        $headers = fgetcsv($handle, 0, ',');
        $headers = array_map('trim', $headers);
        $colIndex = array_flip($headers);

        $get = fn (array $row, string $col): ?string => isset($colIndex[$col], $row[$colIndex[$col]])
            ? ($row[$colIndex[$col]] === '' ? null : $row[$colIndex[$col]])
            : null;

        $jsonDecode = function (?string $val): ?array {
            if ($val === null || $val === '' || $val === 'nan') return null;
            $decoded = json_decode($val, true);
            if (json_last_error() !== JSON_ERROR_NONE) return null;
            return is_array($decoded) ? $decoded : null;
        };

        $buffer    = [];
        $rowNum    = 0;
        $imported  = 0;
        $skipped   = 0;
        $errors    = 0;
        $startTime = microtime(true);

        while (($row = fgetcsv($handle, 0, ',')) !== false) {
            $rowNum++;

            if ($rowNum <= $skip) {
                continue;
            }

            $slug = trim($get($row, 'slug') ?? '');
            $name = trim($get($row, 'name') ?? '');

            if (! $slug || ! $name) {
                $skipped++;
                continue;
            }

            $ratingRaw  = $get($row, 'rating');
            $metacRaw   = $get($row, 'metacritic');
            $releasedRaw = $get($row, 'released');

            // CSV uses pipe-separated strings (not JSON) for most list fields
            $platforms  = $this->parsePipe($get($row, 'platforms'),
                fn ($n) => ['platform' => ['name' => $n, 'slug' => '']]);
            $genres     = $this->parsePipe($get($row, 'genres'),
                fn ($n) => ['name' => $n, 'slug' => '']);
            $tags       = $this->parsePipe($get($row, 'tags'),
                fn ($n) => ['name' => $n, 'slug' => str_replace(' ', '-', strtolower($n)), 'language' => 'eng']);
            $developers = $this->parsePipe($get($row, 'developers'),
                fn ($n) => ['name' => $n]);
            $publishers = $this->parsePipe($get($row, 'publishers'),
                fn ($n) => ['name' => $n]);
            $stores     = $this->parsePipe($get($row, 'stores'),
                fn ($n) => ['id' => 0, 'url' => '', 'store' => ['id' => 0, 'name' => $n, 'domain' => '']]);
            $ratings          = $jsonDecode($get($row, 'ratings'));
            $shortScreenshots = $jsonDecode($get($row, 'short_screenshots'));
            $esrbRaw          = $get($row, 'esrb_rating');
            $esrb             = $esrbRaw && $esrbRaw !== 'nan' ? ['name' => $esrbRaw, 'slug' => strtolower($esrbRaw)] : null;

            // Build details_data in RAWG-compatible format
            $detailsData = [
                'id'                          => (int) ($get($row, 'id') ?? 0),
                'slug'                        => $slug,
                'name'                        => $name,
                'released'                    => $releasedRaw,
                'background_image'            => $get($row, 'background_image'),
                'background_image_additional' => $get($row, 'background_image_additional'),
                'rating'                      => $ratingRaw !== null ? (float) $ratingRaw : null,
                'rating_top'                  => (int) ($get($row, 'rating_top') ?? 5),
                'ratings'                     => $ratings ?? [],
                'ratings_count'               => (int) ($get($row, 'ratings_count') ?? 0),
                'metacritic'                  => $metacRaw !== null ? (int) $metacRaw : null,
                'metacritic_url'              => $get($row, 'metacritic_url'),
                'metacritic_platforms'        => $jsonDecode($get($row, 'metacritic_platforms')) ?? [],
                'description'                 => $get($row, 'description'),
                'description_raw'             => $get($row, 'description_raw'),
                'playtime'                    => (int) ($get($row, 'playtime') ?? 0),
                'esrb_rating'                 => $esrb,
                'achievements_count'          => (int) ($get($row, 'achievements_count') ?? 0),
                'movies_count'                => (int) ($get($row, 'movies_count') ?? 0),
                'additions_count'             => (int) ($get($row, 'additions_count') ?? 0),
                'game_series_count'           => (int) ($get($row, 'game_series_count') ?? 0),
                'screenshots_count'           => (int) ($get($row, 'screenshots_count') ?? 0),
                'reddit_url'                  => $get($row, 'reddit_url'),
                'reddit_count'                => (int) ($get($row, 'reddit_count') ?? 0),
                'website'                     => $get($row, 'website'),
                'platforms'                   => $platforms ?? [],
                'developers'                  => $developers ?? [],
                'publishers'                  => $publishers ?? [],
                'genres'                      => $genres ?? [],
                'tags'                        => $tags ?? [],
                'stores'                      => $stores ?? [],
                'tba'                         => filter_var($get($row, 'tba'), FILTER_VALIDATE_BOOLEAN),
            ];

            // Build PostgreSQL TEXT[] literals for GIN-indexed columns
            $toTextArray = fn (array $items) => '{' . implode(',', array_map(
                fn ($s) => '"' . str_replace('"', '\\"', $s) . '"', $items
            )) . '}';

            $genreNamesArr    = $toTextArray(array_column($genres ?? [], 'name'));
            $platformNamesArr = $toTextArray(array_map(
                fn ($p) => strtolower($p['platform']['name'] ?? ''),
                array_filter($platforms ?? [], fn ($p) => !empty($p['platform']['name']))
            ));
            $tagNamesArr      = $toTextArray(array_map(
                fn ($t) => strtolower($t['name'] ?? ''),
                array_filter($tags ?? [], fn ($t) => !empty($t['name']))
            ));

            $buffer[] = [
                'slug'                   => $slug,
                'igdb_id'                => null,
                'name'                   => mb_substr($name, 0, 500),
                'released'               => ($releasedRaw && $releasedRaw !== 'nan' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $releasedRaw)) ? $releasedRaw : null,
                'rating'                 => $ratingRaw !== null && $ratingRaw !== 'nan' ? round((float) $ratingRaw, 2) : null,
                'metacritic'             => $metacRaw !== null && $metacRaw !== 'nan' ? (int) $metacRaw : null,
                'background_image'       => (($img = $get($row, 'background_image')) && str_starts_with($img, 'http')) ? $img : null,
                'genre_names'            => $genreNamesArr,
                'platform_names'         => $platformNamesArr,
                'tag_names'              => $tagNamesArr,
                'platforms'              => json_encode($platforms ?? []),
                'short_screenshots'      => json_encode($shortScreenshots ?? []),
                'details_data'           => json_encode($detailsData),
                'screenshots_data'       => json_encode(['count' => 0, 'results' => []]),
                'movies_data'            => json_encode(['count' => 0, 'results' => []]),
                'series_data'            => json_encode(['count' => 0, 'results' => []]),
                'suggested_data'         => json_encode(['count' => 0, 'results' => []]),
                'additions_data'         => json_encode(['count' => 0, 'results' => []]),
                'details_crawled_at'     => now(),
                'screenshots_crawled_at' => null,
                'movies_crawled_at'      => null,
                'series_crawled_at'      => null,
                'suggested_crawled_at'   => null,
                'additions_crawled_at'   => null,
                'created_at'             => now(),
                'updated_at'             => now(),
            ];

            if (count($buffer) >= $chunk) {
                [$imported, $errors] = $this->flushBuffer($buffer, $imported, $errors, $rowNum);
                $buffer = [];

                // Progress every 10k rows
                if ($imported % 10000 === 0) {
                    $elapsed = round(microtime(true) - $startTime);
                    $rate    = $imported / max(1, $elapsed);
                    $this->line("  Imported: " . number_format($imported) . " | Row: " . number_format($rowNum) . " | {$elapsed}s | " . number_format($rate) . " rows/s");
                }
            }
        }

        // Flush remaining
        if (! empty($buffer)) {
            [$imported, $errors] = $this->flushBuffer($buffer, $imported, $errors, $rowNum);
        }

        fclose($handle);


        $elapsed = round(microtime(true) - $startTime);
        $this->newLine();
        $this->info("Done! Imported: " . number_format($imported) . " games in {$elapsed}s.");
        $this->line("Skipped (no slug/name): {$skipped} | Chunk errors: {$errors}");

        return self::SUCCESS;
    }

    private function parsePipe(?string $val, callable $transform): array
    {
        if (! $val || $val === 'nan') return [];
        return array_values(array_filter(array_map(
            fn ($item) => $transform(trim($item)),
            explode('|', $val)
        ), fn ($item) => ! empty(array_filter($item))));
    }

    private function flushBuffer(array $buffer, int $imported, int $errors, int $rowNum): array
    {
        $columns = [
            'name', 'released', 'rating', 'metacritic', 'background_image',
            'genre_names', 'platform_names', 'tag_names',
            'platforms', 'short_screenshots', 'details_data', 'details_crawled_at',
            'updated_at',
        ];

        try {
            DB::table('games')->upsert($buffer, ['slug'], $columns);
            $imported += count($buffer);
        } catch (\Exception $e) {
            // Chunk failed — try row by row to save as many as possible
            foreach ($buffer as $record) {
                try {
                    DB::table('games')->upsert([$record], ['slug'], $columns);
                    $imported++;
                } catch (\Exception $rowError) {
                    $this->warn("Skipped row (slug={$record['slug']}): " . substr($rowError->getMessage(), 0, 120));
                    $errors++;
                }
            }
        }

        return [$imported, $errors];
    }
}
