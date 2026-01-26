<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class FixImagePaths extends Command
{
    protected $signature = 'images:fix-paths {--dry-run : Show what would be updated without making changes}';
    protected $description = 'Update database image paths from .jpg/.png to .webp if the webp file exists';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->warn('🔍 DRY RUN - No changes will be made');
        }

        $this->info('🔄 Fixing image paths in database...');

        $totalUpdated = 0;

        // Fix articles
        $articles = DB::table('articles')
            ->where(function ($q) {
                $q->where('featured_image_url', 'like', '%.jpg')
                    ->orWhere('featured_image_url', 'like', '%.jpeg')
                    ->orWhere('featured_image_url', 'like', '%.png');
            })
            ->get();

        $this->info("\n📁 Articles: {$articles->count()} to check");

        foreach ($articles as $article) {
            $oldPath = $article->featured_image_url;
            $newPath = preg_replace('/\.(jpg|jpeg|png)$/i', '.webp', $oldPath);

            if (Storage::disk('public')->exists($newPath)) {
                if (!$dryRun) {
                    DB::table('articles')
                        ->where('id', $article->id)
                        ->update(['featured_image_url' => $newPath]);
                }
                $this->line("  ✅ {$oldPath} → {$newPath}");
                $totalUpdated++;
            } else {
                $this->line("  ⏭️  {$oldPath} (no webp found)");
            }
        }

        // Fix reviews
        $reviews = DB::table('reviews')
            ->where(function ($q) {
                $q->where('cover_image', 'like', '%.jpg')
                    ->orWhere('cover_image', 'like', '%.jpeg')
                    ->orWhere('cover_image', 'like', '%.png');
            })
            ->get();

        $this->info("\n📁 Reviews: {$reviews->count()} to check");

        foreach ($reviews as $review) {
            $oldPath = $review->cover_image;
            $newPath = preg_replace('/\.(jpg|jpeg|png)$/i', '.webp', $oldPath);

            if (Storage::disk('public')->exists($newPath)) {
                if (!$dryRun) {
                    DB::table('reviews')
                        ->where('id', $review->id)
                        ->update(['cover_image' => $newPath]);
                }
                $this->line("  ✅ {$oldPath} → {$newPath}");
                $totalUpdated++;
            } else {
                $this->line("  ⏭️  {$oldPath} (no webp found)");
            }
        }

        $this->newLine();
        $this->info("📊 Total updated: {$totalUpdated}");

        if ($dryRun) {
            $this->warn('💡 Run without --dry-run to apply changes');
        } else {
            $this->info('✅ Done! Run: php artisan cache:clear');
        }

        return Command::SUCCESS;
    }
}
