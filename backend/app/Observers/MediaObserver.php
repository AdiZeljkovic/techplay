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
        if (! str_starts_with($media->mime_type ?? '', 'image/')) {
            return;
        }

        // Skip if already WebP
        if ($media->mime_type === 'image/webp') {
            return;
        }

        // Nothing to do at all if the image library is absent; asking first
        // keeps a missing optional dependency out of the logs on every upload.
        if (! ImageOptimizationService::available()) {
            return;
        }

        try {
            $optimizer = new ImageOptimizationService;
            $webpUrl = $optimizer->convertToWebp($media->path);

            if ($webpUrl) {
                $media->update([
                    'webp_path' => str_replace(Storage::disk('public')->url(''), '', $webpUrl),
                ]);
            }
        } catch (\Throwable $e) {
            // Was catch (\Exception). The service it calls builds an
            // Intervention image driver, and that package is not installed —
            // which raises an Error, not an Exception, so this block did not
            // run and every non-WebP media upload died on a fatal instead of
            // quietly skipping the conversion it was supposed to be optional.
            \Log::warning("WebP conversion failed for media {$media->id}: ".$e->getMessage());
        }
    }
}
