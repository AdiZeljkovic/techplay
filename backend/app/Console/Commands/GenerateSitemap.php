<?php

namespace App\Console\Commands;

use App\Http\Controllers\SitemapController;
use App\Models\Game;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

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
            'sitemap.xml'            => fn () => $sitemap->index(),
            'sitemap-pages.xml'      => fn () => $sitemap->pages(),
            'sitemap-articles.xml'   => fn () => $sitemap->articles(),
            'sitemap-categories.xml' => fn () => $sitemap->categories(),
            'sitemap-hub.xml'        => fn () => $sitemap->hub(),
            'sitemap-guides.xml'     => fn () => $sitemap->guides(),
            'sitemap-videos.xml'     => fn () => $sitemap->videos(),
            'sitemap-products.xml'   => fn () => $sitemap->products(),
            'sitemap-news.xml'       => fn () => $sitemap->news(),
            'sitemap-images.xml'     => fn () => $sitemap->images(),
        ];

        foreach ($sitemaps as $filename => $generator) {
            File::put("{$outputPath}/{$filename}", $generator()->getContent());
            $this->line("  ✓ {$filename}");
        }

        // Game sitemaps — dynamic count based on crawled games
        $gamesCount = Game::whereNotNull('details_crawled_at')->count();
        if ($gamesCount > 0) {
            $gamePages = (int) ceil($gamesCount / 50000);
            for ($p = 1; $p <= $gamePages; $p++) {
                $filename = "sitemap-games-{$p}.xml";
                File::put("{$outputPath}/{$filename}", $sitemap->games($p)->getContent());
                $this->line("  ✓ {$filename}");
            }
            $this->line("  ({$gamesCount} games across {$gamePages} file(s))");
        }

        $this->newLine();
        $this->info('✓ All sitemaps generated successfully!');
        return Command::SUCCESS;
    }
}
