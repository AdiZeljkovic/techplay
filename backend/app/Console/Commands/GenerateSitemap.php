<?php

namespace App\Console\Commands;

use App\Http\Controllers\SitemapController;
use App\Models\Game;
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
    protected $signature = 'sitemap:generate';

    protected $description = 'Generate static sitemap XML files from SitemapController';

    public function handle(): int
    {
        $sitemap = app(SitemapController::class);
        $outputPath = public_path();

        $this->info('Generating sitemaps...');

        $sitemaps = [
            'sitemap.xml' => fn () => $sitemap->index(),
            'sitemap-pages.xml' => fn () => $sitemap->pages(),
            'sitemap-articles.xml' => fn () => $sitemap->articles(),
            'sitemap-categories.xml' => fn () => $sitemap->categories(),
            'sitemap-hub.xml' => fn () => $sitemap->hub(),
            'sitemap-guides.xml' => fn () => $sitemap->guides(),
            'sitemap-products.xml' => fn () => $sitemap->products(),
            'sitemap-news.xml' => fn () => $sitemap->news(),
            'sitemap-images.xml' => fn () => $sitemap->images(),
        ];

        /* Only when there are studios to list. index() applies the same test,
           and the two have to agree or the index names a file this never
           writes — which is how sitemap-videos.xml outlived its section. */
        if (Studio::where('indexable', true)->exists()) {
            $sitemaps['sitemap-studios.xml'] = fn () => $sitemap->studios();
        }

        foreach ($sitemaps as $filename => $generator) {
            File::put("{$outputPath}/{$filename}", $generator()->getContent());
            $this->line("  ✓ {$filename}");
        }

        // Game sitemaps — dynamic count over the browseable catalogue
        $gamesCount = Game::whereNotNull('description')->count();
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

        $this->pruneStaleFiles($outputPath, array_keys($sitemaps), $gamePages);

        $this->newLine();
        $this->info('✓ All sitemaps generated successfully!');

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
