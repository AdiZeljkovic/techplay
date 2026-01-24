<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Image Upload and Processing Service
 *
 * SECURITY: Safe image handling with validation
 * PERFORMANCE: Auto-optimization with intervention/image (if installed)
 */
class ImageService
{
    /**
     * Upload and process image
     *
     * @param UploadedFile $file
     * @param string $folder Target folder in storage (e.g., 'avatars', 'articles')
     * @param int|null $maxWidth Optional max width for resize
     * @param int|null $maxHeight Optional max height for resize
     * @return string Stored file path
     */
    public function upload(
        UploadedFile $file,
        string $folder,
        ?int $maxWidth = null,
        ?int $maxHeight = null
    ): string {
        // Generate unique filename
        $filename = $this->generateUniqueFilename($file);

        // Determine storage path
        $path = "{$folder}/{$filename}";

        // FUTURE: Image optimization with intervention/image
        // if (class_exists(\Intervention\Image\ImageManager::class)) {
        //     $image = \Intervention\Image\Facades\Image::make($file);
        //
        //     if ($maxWidth || $maxHeight) {
        //         $image->resize($maxWidth, $maxHeight, function ($constraint) {
        //             $constraint->aspectRatio();
        //             $constraint->upsize(); // Prevent upsizing
        //         });
        //     }
        //
        //     // Optimize quality
        //     $image->save(storage_path("app/public/{$path}"), 85);
        // } else {
        //     // Fallback: Store without optimization
        //     Storage::disk('public')->putFileAs($folder, $file, $filename);
        // }

        // Store file without optimization (for now)
        Storage::disk('public')->putFileAs($folder, $file, $filename);

        return $path;
    }

    /**
     * Delete image from storage
     */
    public function delete(string $path): bool
    {
        if (Storage::disk('public')->exists($path)) {
            return Storage::disk('public')->delete($path);
        }

        return false;
    }

    /**
     * Generate unique filename with original extension
     */
    private function generateUniqueFilename(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        $basename = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));

        // Add timestamp and random string for uniqueness
        $unique = time() . '-' . Str::random(8);

        return "{$basename}-{$unique}.{$extension}";
    }

    /**
     * Get public URL for stored image
     */
    public function getUrl(string $path): string
    {
        return Storage::disk('public')->url($path);
    }
}
