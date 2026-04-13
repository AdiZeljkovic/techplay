<?php

namespace App\Console\Commands;

use App\Models\Game;
use App\Services\MobyGamesService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ImportMobyCsv extends Command
{
    protected $signature = 'moby:import
        {--dir= : Directory containing MobyGames CSV files}
        {--file= : Single CSV file to import}
        {--batch=500 : Upsert batch size}';

    protected $description = 'Bulk-import MobyGames CSV files into the games table';

    // Maps CSV file name substrings to normalized platform_names tags
    private const PLATFORM_MAP = [
        'Windows'         => ['PC', 'Windows'],
        'Linux'           => ['PC', 'Linux'],
        'Macintosh'       => ['PC', 'Mac'],
        'DOS'             => ['PC', 'DOS'],
        'PlayStation 5'   => ['PlayStation', 'PS5'],
        'PlayStation 4'   => ['PlayStation', 'PS4'],
        'PlayStation 3'   => ['PlayStation', 'PS3'],
        'PlayStation 2'   => ['PlayStation', 'PS2'],
        'PlayStation'     => ['PlayStation', 'PS1'],
        'Xbox Series X'   => ['Xbox', 'Xbox Series X'],
        'Xbox One'        => ['Xbox', 'Xbox One'],
        'Xbox 360'        => ['Xbox', 'Xbox 360'],
        'Nintendo Switch' => ['Nintendo', 'Switch'],
        'Wii U'           => ['Nintendo', 'Wii U'],
        'Wii'             => ['Nintendo', 'Wii'],
        'Android'         => ['Mobile', 'Android'],
        'iPhone'          => ['Mobile', 'iOS'],
    ];

    public function handle(): int
    {
        $files = $this->collectFiles();

        if (empty($files)) {
            $this->error('No CSV files found. Provide --dir or --file.');
            return self::FAILURE;
        }

        $total = 0;
        foreach ($files as $file) {
            $total += $this->importFile($file);
        }

        $this->info("Done. Total rows upserted: {$total}");
        return self::SUCCESS;
    }

    private function collectFiles(): array
    {
        if ($file = $this->option('file')) {
            return file_exists($file) ? [$file] : [];
        }

        $dir = $this->option('dir');
        if (! $dir || ! is_dir($dir)) {
            $this->error("Directory not found: {$dir}");
            return [];
        }

        return glob(rtrim($dir, '/') . '/*.csv') ?: [];
    }

    private function importFile(string $path): int
    {
        $filename     = basename($path, '.csv');
        $platformTags = $this->detectPlatformTags($filename);

        $this->info("Importing: {$filename}.csv → platform tags: [" . implode(', ', $platformTags) . "]");

        $handle = fopen($path, 'r');
        if (! $handle) {
            $this->error("Cannot open: {$path}");
            return 0;
        }

        // Read and validate header row
        $header = fgetcsv($handle);
        if (! $header) {
            fclose($handle);
            return 0;
        }

        $header = array_map('strtolower', array_map('trim', $header));
        $colMap = array_flip($header);

        // MobyGames CSV columns (case-insensitive):
        // game_id, title, moby_url, release_year, moby_score, genres
        $required = ['game_id', 'title', 'moby_url'];
        foreach ($required as $col) {
            if (! isset($colMap[$col])) {
                $this->error("Missing required column '{$col}' in {$filename}.csv");
                $this->line('Available columns: ' . implode(', ', $header));
                fclose($handle);
                return 0;
            }
        }

        $batchSize = (int) $this->option('batch');
        $batch     = [];
        $count     = 0;
        $skipped   = 0;

        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < count($required)) {
                $skipped++;
                continue;
            }

            $mobyId      = (int) ($row[$colMap['game_id']] ?? 0);
            $title       = trim($row[$colMap['title']] ?? '');
            $mobyUrl     = trim($row[$colMap['moby_url']] ?? '');
            $releaseYear = trim($row[$colMap['release_year'] ?? -1] ?? '');
            $mobyScore   = trim($row[$colMap['moby_score'] ?? -1] ?? '');
            $genresRaw   = trim($row[$colMap['genres'] ?? -1] ?? '');

            if (! $mobyId || ! $title || ! $mobyUrl) {
                $skipped++;
                continue;
            }

            $slug = MobyGamesService::slugFromUrl($mobyUrl);
            if (! $slug) {
                $slug = Str::slug($title);
            }

            // Parse release date
            $released = null;
            if ($releaseYear && is_numeric($releaseYear)) {
                $released = $releaseYear . '-01-01';
            }

            // Parse genres: comma-separated string
            $genreNames = [];
            if ($genresRaw) {
                $genreNames = array_filter(array_map('trim', explode(',', $genresRaw)));
            }

            // Build record
            $record = [
                'moby_id'          => $mobyId,
                'slug'             => $slug,
                'name'             => $title,
                'has_description'  => false,
            ];

            if ($released) {
                $record['released'] = $released;
            }

            if ($mobyScore !== '' && is_numeric($mobyScore)) {
                $record['rating'] = (float) $mobyScore;
            }

            $batch[] = [
                'record'       => $record,
                'genreNames'   => $genreNames,
                'platformTags' => $platformTags,
            ];

            if (count($batch) >= $batchSize) {
                $count += $this->flushBatch($batch);
                $batch = [];
                $this->line("  → {$count} rows processed");
            }
        }

        if (! empty($batch)) {
            $count += $this->flushBatch($batch);
        }

        fclose($handle);

        if ($skipped > 0) {
            $this->warn("  Skipped {$skipped} invalid rows");
        }
        $this->info("  → {$count} rows upserted from {$filename}.csv");

        return $count;
    }

    private function flushBatch(array $batch): int
    {
        $records = array_column($batch, 'record');

        // Upsert by moby_id (ignore slug conflicts — first writer wins)
        Game::upsert(
            $records,
            ['moby_id'],
            ['name', 'slug', 'released', 'rating', 'has_description']
        );

        // Update TEXT[] arrays via raw SQL (Eloquent can't handle PostgreSQL arrays)
        foreach ($batch as $item) {
            $game = Game::where('moby_id', $item['record']['moby_id'])->first();
            if (! $game) {
                continue;
            }

            if (! empty($item['genreNames'])) {
                $this->updateTextArray($game->id, 'genre_names', $item['genreNames']);
            }

            if (! empty($item['platformTags'])) {
                // Merge with existing platform_names (multiple CSVs may cover same game)
                $existing = $this->getTextArray($game->id, 'platform_names');
                $merged   = array_unique(array_merge($existing, $item['platformTags']));
                $this->updateTextArray($game->id, 'platform_names', $merged);
            }
        }

        return count($records);
    }

    private function updateTextArray(int $gameId, string $column, array $values): void
    {
        $literal = '{' . implode(',', array_map(fn($v) => '"' . addslashes($v) . '"', $values)) . '}';
        DB::statement("UPDATE games SET {$column} = ? WHERE id = ?", [$literal, $gameId]);
    }

    private function getTextArray(int $gameId, string $column): array
    {
        $result = DB::selectOne("SELECT {$column} FROM games WHERE id = ?", [$gameId]);
        if (! $result) {
            return [];
        }

        $raw = $result->{$column};
        if (! $raw || $raw === '{}') {
            return [];
        }

        // Parse PostgreSQL array literal: {"Tag 1","Tag 2"}
        $inner = trim($raw, '{}');
        if (! $inner) {
            return [];
        }

        preg_match_all('/"((?:[^"\\\\]|\\\\.)*)"|([^,]+)/', $inner, $matches);
        $values = [];
        foreach ($matches[0] as $m) {
            $values[] = trim($m, '"');
        }
        return $values;
    }

    private function detectPlatformTags(string $filename): array
    {
        // Try longest match first (e.g. "PlayStation 4" before "PlayStation")
        $map = self::PLATFORM_MAP;
        arsort($map); // sort by value length descending — but we need by key length
        $sorted = $map;
        uksort($sorted, fn($a, $b) => strlen($b) - strlen($a));

        foreach ($sorted as $keyword => $tags) {
            if (stripos($filename, $keyword) !== false) {
                return $tags;
            }
        }

        // Unknown platform — use filename as a single tag
        return [Str::title(str_replace(['-', '_'], ' ', $filename))];
    }
}
