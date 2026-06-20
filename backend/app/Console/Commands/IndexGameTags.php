<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class IndexGameTags extends Command
{
    protected $signature = 'games:index-tags';

    protected $description = 'Backfill genre_names, platform_names, tag_names arrays from JSON columns';

    public function handle(): int
    {
        $min = DB::table('games')->whereNotNull('details_crawled_at')->min('id');
        $max = DB::table('games')->whereNotNull('details_crawled_at')->max('id');

        if (! $min) {
            $this->info('No games found.');

            return self::SUCCESS;
        }

        $chunkSize = 10000;
        $total = (int) ceil(($max - $min + 1) / $chunkSize);

        $this->info("Backfilling IDs {$min}–{$max} in chunks of {$chunkSize}...");
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        for ($start = $min; $start <= $max; $start += $chunkSize) {
            $end = $start + $chunkSize - 1;

            DB::statement("
                UPDATE games SET
                    genre_names    = ARRAY(SELECT elem->>'name'
                                          FROM json_array_elements(COALESCE(details_data->'genres', '[]'::json)) elem
                                          WHERE elem->>'name' IS NOT NULL),
                    platform_names = ARRAY(SELECT lower(elem->'platform'->>'name')
                                          FROM json_array_elements(COALESCE(platforms, '[]'::json)) elem
                                          WHERE elem->'platform'->>'name' IS NOT NULL),
                    tag_names      = ARRAY(SELECT lower(elem->>'name')
                                          FROM json_array_elements(COALESCE(details_data->'tags', '[]'::json)) elem
                                          WHERE elem->>'name' IS NOT NULL)
                WHERE details_crawled_at IS NOT NULL
                  AND id >= ? AND id <= ?
            ", [$start, $end]);

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Done!');

        return self::SUCCESS;
    }
}
