<?php

namespace App\Observers;

use App\Models\Media;
use App\Services\ImageOptimizationService;
use Illuminate\Support\Facades\Storage;

class MediaObserver
{
    /**
     * Handle the Media "created" event.
     * Auto-generate WebP version after upload
     */
    public function created(Media $media): void
    {
        // Only process images
        if (!str_starts_with($media->mime_type ?? '', 'image/')) {
            return;
        }

        // Skip if already WebP
        if ($media->mime_type === 'image/webp') {
            return;
        }

        try {
            $optimizer = new ImageOptimizationService();
            $webpUrl = $optimizer->convertToWebp($media->path);

            if ($webpUrl) {
                $media->update([
                    'webp_path' => str_replace(Storage::disk('public')->url(''), '', $webpUrl),
                ]);
            }
        } catch (\Exception $e) {
            // Log error but don't fail the upload
            \Log::warning("WebP conversion failed for media {$media->id}: " . $e->getMessage());
        }
    }
}
