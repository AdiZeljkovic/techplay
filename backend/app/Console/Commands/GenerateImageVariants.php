<?php

namespace App\Console\Commands;

use App\Services\ImageOptimizer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class GenerateImageVariants extends Command
{
    protected $signature = 'images:generate-variants 
                            {--directory=all : Directory to process (articles, reviews, ads, or all)}
                            {--dry-run : Show what would be generated without making changes}';

    protected $description = 'Generate responsive image variants (thumb, medium, large) for existing images';

    protected array $imageDirectories = [
        'articles',
        'reviews',
        'giveaways',
        'ads',
    ];

    public function handle(): int
    {
        $directory = $this->option('directory');
        $dryRun = $this->option('dry-run');

        $this->info('🖼️  Generate Image Variants');
        $this->info('============================');

        if ($dryRun) {
            $this->warn('🔍 DRY RUN - No changes will be made');
        }

        $directories = $directory === 'all'
            ? $this->imageDirectories
            : [$directory];

        $optimizer = new ImageOptimizer();
        $stats = [
            'processed' => 0,
            'skipped' => 0,
            'errors' => 0,
        ];

        foreach ($directories as $dir) {
            if (!Storage::disk('public')->exists($dir)) {
                $this->warn("⚠️  Directory '{$dir}' does not exist, skipping...");
                continue;
            }

            $this->info("\n📁 Processing: {$dir}");
            $files = Storage::disk('public')->files($dir);

            // Filter to only process original webp files (not variants)
            $originalFiles = array_filter($files, function ($file) {
                $filename = pathinfo($file, PATHINFO_FILENAME);
                $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));

                // Only process .webp files that don't have variant suffixes
                return $extension === 'webp'
                    && !preg_match('/_(thumb|medium|large)$/', $filename);
            });

            $this->info("  Found " . count($originalFiles) . " original images");

            $progressBar = $this->output->createProgressBar(count($originalFiles));
            $progressBar->start();

            foreach ($originalFiles as $file) {
                if ($dryRun) {
                    $this->newLine();
                    $basename = basename($file);
                    $this->line("  Would generate variants for: {$basename}");
                    $stats['processed']++;
                    $progressBar->advance();
                    continue;
                }

                try {
                    $result = $optimizer->generateVariantsForExisting($file, 'public');

                    if ($result) {
                        $stats['processed']++;
                    } else {
                        $stats['skipped']++;
                    }
                } catch (\Exception $e) {
                    $stats['errors']++;
                    $this->newLine();
                    $this->error("  ❌ Error: " . basename($file) . " - " . $e->getMessage());
                }

                $progressBar->advance();
            }

            $progressBar->finish();
            $this->newLine();
        }

        // Summary
        $this->newLine();
        $this->info('📊 Summary');
        $this->info('==========');
        $this->table(
            ['Metric', 'Value'],
            [
                ['Processed', $stats['processed']],
                ['Skipped', $stats['skipped']],
                ['Errors', $stats['errors']],
            ]
        );

        if ($dryRun) {
            $this->newLine();
            $this->warn('💡 Run without --dry-run to generate variants');
        } else {
            $this->newLine();
            $this->info('✅ Done! Variants generated: _thumb.webp, _medium.webp, _large.webp');
        }

        return Command::SUCCESS;
    }
}
