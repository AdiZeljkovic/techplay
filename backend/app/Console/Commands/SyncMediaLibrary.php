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
            if (! $disk->exists($directory)) {
                $this->line("  📁 Directory '{$directory}' not found, skipping...");

                continue;
            }

            $this->info("📁 Scanning: {$directory}");

            $files = $disk->allFiles($directory);
            $progressBar = $this->output->createProgressBar(count($files));

            foreach ($files as $file) {
                // Check if it's an image
                $mimeType = $this->getMimeType($disk->path($file));

                if (! str_starts_with($mimeType, 'image/')) {
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

                /*
                 * A .webp beside its original is a conversion, not a picture.
                 *
                 * `ImageOptimizationService` writes `x.webp` next to `x.jpg`,
                 * and a walk of the disk sees two files — which is how the
                 * library came to hold 36 rows for 18 pictures, each one listed
                 * twice under two unreadable names. It belongs on the original
                 * row, in the column that exists for it.
                 */
                if (preg_match('/\.webp$/i', $file)) {
                    $base = preg_replace('/\.webp$/i', '', $file);

                    $original = Media::where('path', $base.'.jpg')
                        ->orWhere('path', $base.'.jpeg')
                        ->orWhere('path', $base.'.png')
                        ->first();

                    if ($original) {
                        $original->forceFill(['webp_path' => $file])->save();
                        $totalSkipped++;
                        $progressBar->advance();

                        continue;
                    }
                }

                // Create media record
                $fullPath = $disk->path($file);

                $media = new Media([
                    /*
                     * No title. The file name here is a generated ULID, and a
                     * row titled `01KEQ5KW66WJGTKV4KBRH7WEH4` reads as though
                     * somebody named it that. Left null, the library says
                     * "Untitled", which is true and invites a real one.
                     */
                    'title' => null,
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
        $this->info('✅ Sync complete!');
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
        if (! file_exists($path)) {
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
