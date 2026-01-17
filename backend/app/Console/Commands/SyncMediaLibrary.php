<?php

namespace App\Console\Commands;

use App\Models\Media;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class SyncMediaLibrary extends Command
{
    protected $signature = 'media:sync {--directory=*}';
    protected $description = 'Scan storage and sync existing images to Media Library';

    public function handle(): int
    {
        $this->info('🔍 Scanning storage for existing images...');

        $directories = $this->option('directory');

        if (empty($directories)) {
            // Default directories to scan
            $directories = ['articles', 'reviews', 'guides', 'media', 'avatars', 'banners'];
        }

        $disk = Storage::disk('public');
        $totalImported = 0;
        $totalSkipped = 0;

        foreach ($directories as $directory) {
            if (!$disk->exists($directory)) {
                $this->line("  📁 Directory '{$directory}' not found, skipping...");
                continue;
            }

            $this->info("📁 Scanning: {$directory}");

            $files = $disk->allFiles($directory);
            $progressBar = $this->output->createProgressBar(count($files));

            foreach ($files as $file) {
                // Check if it's an image
                $mimeType = $this->getMimeType($disk->path($file));

                if (!str_starts_with($mimeType, 'image/')) {
                    $progressBar->advance();
                    continue;
                }

                // Check if already exists in database
                $exists = Media::where('path', $file)->exists();

                if ($exists) {
                    $totalSkipped++;
                    $progressBar->advance();
                    continue;
                }

                // Create media record
                $fullPath = $disk->path($file);
                $fileName = basename($file);

                $media = new Media([
                    'title' => pathinfo($fileName, PATHINFO_FILENAME),
                    'path' => $file,
                    'mime_type' => $mimeType,
                    'size' => $disk->size($file),
                    'collection' => $this->getCollectionFromPath($directory),
                ]);

                // Get image dimensions
                if (function_exists('getimagesize') && file_exists($fullPath)) {
                    $imageInfo = @getimagesize($fullPath);
                    if ($imageInfo) {
                        $media->width = $imageInfo[0];
                        $media->height = $imageInfo[1];
                    }
                }

                $media->save();
                $totalImported++;
                $progressBar->advance();
            }

            $progressBar->finish();
            $this->newLine();
        }

        $this->newLine();
        $this->info("✅ Sync complete!");
        $this->table(
            ['Metric', 'Count'],
            [
                ['Images Imported', $totalImported],
                ['Already Existed', $totalSkipped],
                ['Total in Library', Media::count()],
            ]
        );

        return Command::SUCCESS;
    }

    private function getMimeType(string $path): string
    {
        if (!file_exists($path)) {
            return '';
        }

        return mime_content_type($path) ?: '';
    }

    private function getCollectionFromPath(string $directory): string
    {
        return match (true) {
            str_contains($directory, 'article') => 'articles',
            str_contains($directory, 'review') => 'reviews',
            str_contains($directory, 'guide') => 'guides',
            str_contains($directory, 'avatar') => 'avatars',
            str_contains($directory, 'banner') => 'banners',
            default => 'default',
        };
    }
}
