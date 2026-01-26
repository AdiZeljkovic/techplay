<?php

namespace App\Console\Commands;

use App\Services\ImageOptimizer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class OptimizeExistingImages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'images:optimize 
                            {--directory=articles : Directory to optimize (articles, reviews, or all)}
                            {--dry-run : Show what would be optimized without actually doing it}
                            {--force : Process even if already WebP}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Optimize existing images by converting to WebP and compressing';

    /**
     * Directories containing images to optimize
     */
    protected array $imageDirectories = [
        'articles',
        'reviews',
        'guides',
        'giveaways',
        'ads',
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $directory = $this->option('directory');
        $dryRun = $this->option('dry-run');
        $force = $this->option('force');

        $this->info('🖼️  Image Optimization Script');
        $this->info('===========================');

        if ($dryRun) {
            $this->warn('🔍 DRY RUN MODE - No changes will be made');
        }

        $directories = $directory === 'all'
            ? $this->imageDirectories
            : [$directory];

        $optimizer = new ImageOptimizer();
        $stats = [
            'processed' => 0,
            'skipped' => 0,
            'errors' => 0,
            'saved_bytes' => 0,
        ];

        foreach ($directories as $dir) {
            if (!Storage::disk('public')->exists($dir)) {
                $this->warn("⚠️  Directory '{$dir}' does not exist, skipping...");
                continue;
            }

            $this->info("\n📁 Processing: {$dir}");
            $files = Storage::disk('public')->files($dir);

            $progressBar = $this->output->createProgressBar(count($files));
            $progressBar->start();

            foreach ($files as $file) {
                $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));

                // Skip non-image files
                if (!in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                    $progressBar->advance();
                    continue;
                }

                // Skip WebP if not forcing
                if ($extension === 'webp' && !$force) {
                    $stats['skipped']++;
                    $progressBar->advance();
                    continue;
                }

                // Get original file size
                $originalSize = Storage::disk('public')->size($file);
                $originalSizeKb = round($originalSize / 1024, 1);

                if ($dryRun) {
                    $this->newLine();
                    $this->line("  Would optimize: {$file} ({$originalSizeKb} KB)");
                    $stats['processed']++;
                    $progressBar->advance();
                    continue;
                }

                try {
                    $newPath = $optimizer->optimize($file, 'public');
                    $newSize = Storage::disk('public')->size($newPath);
                    $savedBytes = $originalSize - $newSize;
                    $savedKb = round($savedBytes / 1024, 1);
                    $newSizeKb = round($newSize / 1024, 1);

                    $stats['processed']++;
                    $stats['saved_bytes'] += max(0, $savedBytes);

                    // Update database reference if path changed
                    if ($file !== $newPath) {
                        $this->updateDatabaseReferences($file, $newPath);
                    }

                } catch (\Exception $e) {
                    $stats['errors']++;
                    $this->newLine();
                    $this->error("  ❌ Error processing {$file}: {$e->getMessage()}");
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
                ['Skipped (already WebP)', $stats['skipped']],
                ['Errors', $stats['errors']],
                ['Space Saved', round($stats['saved_bytes'] / 1024 / 1024, 2) . ' MB'],
            ]
        );

        if ($dryRun) {
            $this->newLine();
            $this->warn('💡 Run without --dry-run to actually optimize images');
        }

        return Command::SUCCESS;
    }

    /**
     * Update database references from old path to new path
     */
    protected function updateDatabaseReferences(string $oldPath, string $newPath): void
    {
        // Update articles
        \App\Models\Article::where('featured_image_url', $oldPath)
            ->update(['featured_image_url' => $newPath]);

        // Update reviews (if using cover_image field)
        if (class_exists(\App\Models\Review::class)) {
            \App\Models\Review::where('cover_image', $oldPath)
                ->update(['cover_image' => $newPath]);
        }

        // Update guides
        if (class_exists(\App\Models\Guide::class)) {
            \App\Models\Guide::where('featured_image', $oldPath)
                ->update(['featured_image' => $newPath]);
        }

        // Update giveaways
        if (class_exists(\App\Models\Giveaway::class)) {
            \App\Models\Giveaway::where('featured_image', $oldPath)
                ->update(['featured_image' => $newPath]);
            \App\Models\Giveaway::where('prize_image', $oldPath)
                ->update(['prize_image' => $newPath]);
        }
    }
}
