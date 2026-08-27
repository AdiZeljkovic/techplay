<?php

namespace App\Console\Commands;

use App\Models\Article;
use App\Models\Guide;
use App\Services\ImageDimensionService;
use Illuminate\Console\Command;

/**
 * Measures the images already published so their share cards can declare a size.
 *
 * Facebook and X draw a card from og:image:width and og:image:height. Without
 * them the crawler fetches and measures the file itself, and the first share of
 * a piece often renders without the image — which is the share that matters,
 * because a link usually goes out once.
 *
 * Uploads from today forward record their own dimensions. This is for the 629
 * articles and 4 guides that came before, and it reads the files on disk rather
 * than fetching them over HTTP: the paths are stored as public URLs on the same
 * box, so going out through Cloudflare and back to measure our own files would
 * be slower and, given the bot rules, occasionally refused.
 *
 * Idempotent. Only rows with no dimensions are touched, so it can be run again
 * after an import without redoing work.
 *
 * New content does not need this: the observer measures on save. This is for
 * the 629 articles and 4 guides that were published before the columns
 * existed.
 */
class BackfillImageDimensions extends Command
{
    protected $signature = 'seo:backfill-image-dimensions
        {--apply : Write the measurements}
        {--limit=0 : Stop after this many rows, for a first look}';

    protected $description = 'Record width and height for featured images so share cards can declare them';

    /** Rows whose image cannot be measured are reported once, not per attempt. */
    private array $missing = [];

    public function handle(): int
    {
        $apply = (bool) $this->option('apply');
        $limit = (int) $this->option('limit');

        $articles = $this->measureTable(
            Article::query()->whereNotNull('featured_image_url')->whereNull('featured_image_width'),
            'featured_image_url', 'featured_image_width', 'featured_image_height', $apply, $limit
        );

        $guides = $this->measureTable(
            Guide::query()->whereNotNull('featured_image_url')->whereNull('featured_image_width'),
            'featured_image_url', 'featured_image_width', 'featured_image_height', $apply, $limit
        );

        $this->newLine();
        $this->line(sprintf('articles: %d measured, %d unreadable', $articles['done'], $articles['failed']));
        $this->line(sprintf('guides:   %d measured, %d unreadable', $guides['done'], $guides['failed']));

        if ($this->missing !== []) {
            $this->newLine();
            $this->warn('Could not read '.count($this->missing).' file(s); first few:');
            foreach (array_slice($this->missing, 0, 5) as $m) {
                $this->line('  '.$m);
            }
        }

        $this->newLine();
        $this->line($apply
            ? 'Written.'
            : 'Dry run — nothing was written. Re-run with --apply.');

        return self::SUCCESS;
    }

    /** @return array{done:int,failed:int} */
    private function measureTable($query, string $source, string $widthCol, string $heightCol, bool $apply, int $limit): array
    {
        $done = 0;
        $failed = 0;

        $query->select(['id', $source])->chunkById(200, function ($rows) use (
            $source, $widthCol, $heightCol, $apply, $limit, &$done, &$failed
        ) {
            foreach ($rows as $row) {
                if ($limit > 0 && $done + $failed >= $limit) {
                    return false;
                }

                $size = app(ImageDimensionService::class)->measure($row->{$source});

                if ($size === null) {
                    $failed++;
                    $this->missing[] = (string) $row->{$source};

                    continue;
                }

                $done++;

                if ($apply) {
                    // Quietly: the observers on these models fan out to IndexNow,
                    // Discord and the homepage, and none of that belongs to a
                    // measuring pass over content that has not changed.
                    $row->forceFill([$widthCol => $size[0], $heightCol => $size[1]])->saveQuietly();
                }
            }

            return true;
        });

        return ['done' => $done, 'failed' => $failed];
    }
}
