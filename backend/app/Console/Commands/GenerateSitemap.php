<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use App\Http\Controllers\SitemapController;

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

        $this->newLine();
        $this->info('✓ All sitemaps generated successfully!');
        return Command::SUCCESS;
    }
}
