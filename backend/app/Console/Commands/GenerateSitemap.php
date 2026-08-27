<?php

namespace App\Console\Commands;

use App\Http\Controllers\SitemapController;
use App\Models\Game;
use App\Models\Product;
use App\Models\Studio;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

/**
 * The sitemaps as files on disk, which is what actually gets served.
 *
 * Static generation is deliberate: the catalogue files are about 8 MB each and
 * the whole set is 166,000 URLs. Building that per request would mean a
 * 50,000-row query and 8 MB of XML assembly every time a crawler asks, which is
 * exactly the load a sitemap is supposed to save.
 *
 * The trap, and it cost an hour on 17 Aug 2026: FrankenPHP serves any real file
 * in public/ before PHP is reached, so these files win over the routes in
 * web.php — silently. The routes looked live, the code was correct, the process
 * had been restarted and every cache cleared, and the site kept serving a
 * sitemap pointing at /tech/ paths that had been dead for months. Nothing
 * anywhere said the files existed.
 *
 * Hence the pruning below. A file this command no longer writes is a file
 * nothing will ever correct, and it keeps being served until somebody notices.
 */
class GenerateSitemap extends Command
{
    protected $signature = 'sitemap:generate
        {--content : Only the files that change when something is published}
        {--catalogue : Only the games, studios and images files}';

    protected $description = 'Generate static sitemap XML files from SitemapController';

    public function handle(): int
    {
        $sitemap = app(SitemapController::class);
        $outputPath = public_path();

        /*
         * Two speeds, because the two halves are nothing alike.
         *
         * The catalogue files take about half an hour — roughly four minutes
         * per 50,000 games, seven of those, plus 31,970 studios. Everything
         * else is a few kilobytes and finishes in under a second.
         *
         * Running them together every six hours meant walking 294,000 games to
         * add one article: two hours of the box's day spent rewriting a
         * catalogue that the aggregator touches once. Split, an article reaches
         * sitemap-articles.xml in fifteen minutes instead of six hours, and the
         * heavy pass runs once at night.
         *
         * Nothing here is the fast path for a news story — the observer writes
         * sitemap-news.xml on publish and IndexNow is pinged in the same
         * breath. This is for everything that is not breaking.
         */
        $onlyContent = (bool) $this->option('content');
        $onlyCatalogue = (bool) $this->option('catalogue');
        $full = ! $onlyContent && ! $onlyCatalogue;

        if ($onlyContent && $onlyCatalogue) {
            $this->error('Pick one of --content or --catalogue, or neither for both.');

            return Command::INVALID;
        }

        $this->info('Generating sitemaps...');

        $sitemaps = [];

        if ($full || $onlyContent) {
            // The index is here rather than in the catalogue half because it
            // names every file, and a run that adds or drops one has to say so.
            $sitemaps += [
                'sitemap.xml' => fn () => $sitemap->index(),
                'sitemap-pages.xml' => fn () => $sitemap->pages(),
                'sitemap-articles.xml' => fn () => $sitemap->articles(),
                'sitemap-categories.xml' => fn () => $sitemap->categories(),
                'sitemap-hub.xml' => fn () => $sitemap->hub(),
                'sitemap-guides.xml' => fn () => $sitemap->guides(),
                'sitemap-news.xml' => fn () => $sitemap->news(),
            ];

            /*
             * Products only when there are any, which is the test index()
             * applies. This command wrote the file unconditionally, so with
             * zero active products it produced a sitemap containing nothing
             * but /shop — a URL already in sitemap-pages.xml — and the index
             * never mentioned it. Served, unreferenced, and maintained by
             * nobody: the same shape as sitemap-videos.xml.
             */
            if (Product::where('is_active', true)->exists()) {
                $sitemaps['sitemap-products.xml'] = fn () => $sitemap->products();
            }

            // Same test the index applies, called through the same method so
            // the two cannot drift apart.
            if (SitemapController::hasPublishedLists()) {
                $sitemaps['sitemap-lists.xml'] = fn () => $sitemap->lists();
            }
        }

        if ($full || $onlyCatalogue) {
            // Images are article covers, but the file is 222 KB and rebuilding
            // it belongs with the slow half rather than every fifteen minutes.
            $sitemaps['sitemap-images.xml'] = fn () => $sitemap->images();

            /* Only when there are studios to list. index() applies the same
               test, and the two have to agree or the index names a file this
               never writes — which is how sitemap-videos.xml outlived its
               section. */
            if (Studio::where('indexable', true)->exists()) {
                $sitemaps['sitemap-studios.xml'] = fn () => $sitemap->studios();
            }
        }

        foreach ($sitemaps as $filename => $generator) {
            File::put("{$outputPath}/{$filename}", $generator()->getContent());
            $this->line("  ✓ {$filename}");
        }

        /*
         * Game sitemaps — the count has to be the one games() paginates.
         *
         * This read whereNotNull('description') while the controller had moved
         * to Game::indexable(), which also requires 50 characters of text once
         * the markup is stripped. The two disagree by 11,331 rows, which is one
         * whole extra file: this command would write sitemap-games-7.xml and
         * the index, built from the other count, would never mention it.
         */
        $gamesCount = ($full || $onlyCatalogue) ? Game::indexable()->count() : 0;
        $gamePages = 0;

        if ($gamesCount > 0) {
            $gamePages = (int) ceil($gamesCount / 50000);
            for ($p = 1; $p <= $gamePages; $p++) {
                $filename = "sitemap-games-{$p}.xml";
                File::put("{$outputPath}/{$filename}", $sitemap->games($p)->getContent());
                $this->line("  ✓ {$filename}");
            }
            $this->line("  ({$gamesCount} games across {$gamePages} file(s))");
        }

        /*
         * Only a full run may delete.
         *
         * The prune removes any sitemap file the run did not write, which is
         * what keeps a retired file from being served forever. On a split run
         * that same rule would wipe the other half: --content would delete
         * every games file, and fifteen minutes later --catalogue would delete
         * every article file. The two halves would take turns erasing each
         * other and the site would always be missing one of them.
         */
        if ($full) {
            $this->pruneStaleFiles($outputPath, array_keys($sitemaps), $gamePages);
        } else {
            $this->line('  <fg=gray>(partial run — stale files left for the nightly full pass)</>');
        }

        $this->newLine();
        $this->info($full
            ? '✓ All sitemaps generated successfully!'
            : sprintf('✓ %s sitemaps generated.', $onlyContent ? 'Content' : 'Catalogue'));

        return Command::SUCCESS;
    }

    /**
     * Remove sitemap files this run did not write.
     *
     * Found doing exactly this: sitemap-videos.xml, left from before the videos
     * section was removed, and sitemap-games-4.xml and -5.xml sitting at 109
     * bytes since the catalogue shrank from five files to three. All three were
     * still being served and none was referenced by the index — so a crawler
     * that had them bookmarked kept fetching pages nobody maintained.
     */
    private function pruneStaleFiles(string $outputPath, array $written, int $gamePages): void
    {
        $keep = array_flip($written);

        for ($p = 1; $p <= $gamePages; $p++) {
            $keep["sitemap-games-{$p}.xml"] = true;
        }

        foreach (glob("{$outputPath}/sitemap*.xml") ?: [] as $path) {
            $name = basename($path);

            if (isset($keep[$name])) {
                continue;
            }

            File::delete($path);
            $this->line("  <fg=yellow>-</> {$name} (no longer generated)");
        }
    }
}
