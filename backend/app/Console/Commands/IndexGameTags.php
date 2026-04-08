<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class IndexGameTags extends Command
{
    protected $signature   = 'games:index-tags';
    protected $description = 'Backfill genre_names, platform_names, tag_names arrays from JSON columns';

    public function handle(): int
    {
        $total = DB::table('games')->whereNotNull('details_crawled_at')->count();
        $this->info("Backfilling {$total} games...");

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $chunkSize = 5000;
        $offset    = 0;

        while (true) {
            $rows = DB::select("
                SELECT id,
                    ARRAY(SELECT elem->>'name' FROM json_array_elements(COALESCE(details_data->'genres', '[]'::json)) elem WHERE elem->>'name' IS NOT NULL) AS genres,
                    ARRAY(SELECT lower(elem->'platform'->>'name') FROM json_array_elements(COALESCE(platforms, '[]'::json)) elem WHERE elem->'platform'->>'name' IS NOT NULL) AS platforms,
                    ARRAY(SELECT lower(elem->>'name') FROM json_array_elements(COALESCE(details_data->'tags', '[]'::json)) elem WHERE elem->>'name' IS NOT NULL) AS tags
                FROM games
                WHERE details_crawled_at IS NOT NULL
                ORDER BY id
                LIMIT ? OFFSET ?
            ", [$chunkSize, $offset]);

            if (empty($rows)) break;

            foreach ($rows as $row) {
                $genres    = '{' . implode(',', array_map(fn($g) => '"' . str_replace('"', '\\"', $g) . '"', $row->genres ?? [])) . '}';
                $platforms = '{' . implode(',', array_map(fn($p) => '"' . str_replace('"', '\\"', $p) . '"', $row->platforms ?? [])) . '}';
                $tags      = '{' . implode(',', array_map(fn($t) => '"' . str_replace('"', '\\"', $t) . '"', $row->tags ?? [])) . '}';

                DB::statement(
                    "UPDATE games SET genre_names = ?, platform_names = ?, tag_names = ? WHERE id = ?",
                    [$genres, $platforms, $tags, $row->id]
                );
            }

            $bar->advance(count($rows));
            $offset += $chunkSize;

            if (count($rows) < $chunkSize) break;
        }

        $bar->finish();
        $this->newLine();
        $this->info('Done!');

        return self::SUCCESS;
    }
}
