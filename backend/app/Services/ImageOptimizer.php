<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageOptimizer
{
    /**
     * Maximum width for article images (maintains aspect ratio)
     */
    protected int $maxWidth = 1920;

    /**
     * Maximum height for article images
     */
    protected int $maxHeight = 1080;

    /**
     * WebP quality (0-100)
     */
    protected int $quality = 82;

    /**
     * Maximum file size target in KB (200KB)
     */
    protected int $targetSizeKb = 200;

    /**
     * Optimize an uploaded image file
     * Resizes if needed, converts to WebP, and compresses
     *
     * @param string $path Path to the image on the storage disk
     * @param string $disk Storage disk name
     * @return string New optimized image path
     */
    public function optimize(string $path, string $disk = 'public'): string
    {
        $fullPath = Storage::disk($disk)->path($path);

        if (!file_exists($fullPath)) {
            return $path;
        }

        $imageInfo = @getimagesize($fullPath);
        if (!$imageInfo) {
            return $path;
        }

        $mimeType = $imageInfo['mime'];
        $originalWidth = $imageInfo[0];
        $originalHeight = $imageInfo[1];

        // Create image resource from original
        $sourceImage = $this->createImageFromFile($fullPath, $mimeType);
        if (!$sourceImage) {
            return $path;
        }

        // Calculate new dimensions (maintain aspect ratio)
        [$newWidth, $newHeight] = $this->calculateDimensions(
            $originalWidth,
            $originalHeight,
            $this->maxWidth,
            $this->maxHeight
        );

        // Create resized image
        $resizedImage = imagecreatetruecolor($newWidth, $newHeight);

        // Preserve transparency for PNG
        if ($mimeType === 'image/png') {
            imagealphablending($resizedImage, false);
            imagesavealpha($resizedImage, true);
            $transparent = imagecolorallocatealpha($resizedImage, 0, 0, 0, 127);
            imagefilledrectangle($resizedImage, 0, 0, $newWidth, $newHeight, $transparent);
        }

        // Resize
        imagecopyresampled(
            $resizedImage,
            $sourceImage,
            0, 0, 0, 0,
            $newWidth, $newHeight,
            $originalWidth, $originalHeight
        );

        // Generate new filename with .webp extension
        $directory = dirname($path);
        $filename = pathinfo($path, PATHINFO_FILENAME);
        $newPath = $directory . '/' . $filename . '.webp';
        $newFullPath = Storage::disk($disk)->path($newPath);

        // Save as WebP with quality optimization
        $quality = $this->quality;
        imagewebp($resizedImage, $newFullPath, $quality);

        // If file is still too large, reduce quality iteratively
        $attempts = 0;
        while (filesize($newFullPath) > ($this->targetSizeKb * 1024) && $quality > 50 && $attempts < 5) {
            $quality -= 10;
            imagewebp($resizedImage, $newFullPath, $quality);
            $attempts++;
        }

        // Cleanup
        imagedestroy($sourceImage);
        imagedestroy($resizedImage);

        // Delete original if different format
        if ($path !== $newPath) {
            Storage::disk($disk)->delete($path);
        }

        return $newPath;
    }

    /**
     * Process image after Filament upload
     * Called by Filament's afterStateUpdated callback
     */
    public function processFilamentUpload(?string $path, string $disk = 'public'): ?string
    {
        if (!$path) {
            return null;
        }

        return $this->optimize($path, $disk);
    }

    /**
     * Create image resource from file based on mime type
     */
    protected function createImageFromFile(string $path, string $mimeType): ?\GdImage
    {
        return match ($mimeType) {
            'image/jpeg', 'image/jpg' => @imagecreatefromjpeg($path),
            'image/png' => @imagecreatefrompng($path),
            'image/gif' => @imagecreatefromgif($path),
            'image/webp' => @imagecreatefromwebp($path),
            default => null,
        };
    }

    /**
     * Calculate new dimensions maintaining aspect ratio
     */
    protected function calculateDimensions(
        int $originalWidth,
        int $originalHeight,
        int $maxWidth,
        int $maxHeight
    ): array {
        // If image is smaller than max, keep original size
        if ($originalWidth <= $maxWidth && $originalHeight <= $maxHeight) {
            return [$originalWidth, $originalHeight];
        }

        $ratio = $originalWidth / $originalHeight;

        if ($originalWidth > $originalHeight) {
            // Landscape
            $newWidth = min($originalWidth, $maxWidth);
            $newHeight = (int) ($newWidth / $ratio);

            if ($newHeight > $maxHeight) {
                $newHeight = $maxHeight;
                $newWidth = (int) ($newHeight * $ratio);
            }
        } else {
            // Portrait or square
            $newHeight = min($originalHeight, $maxHeight);
            $newWidth = (int) ($newHeight * $ratio);

            if ($newWidth > $maxWidth) {
                $newWidth = $maxWidth;
                $newHeight = (int) ($newWidth / $ratio);
            }
        }

        return [$newWidth, $newHeight];
    }

    /**
     * Set custom max dimensions
     */
    public function setMaxDimensions(int $width, int $height): self
    {
        $this->maxWidth = $width;
        $this->maxHeight = $height;
        return $this;
    }

    /**
     * Set custom quality
     */
    public function setQuality(int $quality): self
    {
        $this->quality = max(1, min(100, $quality));
        return $this;
    }

    /**
     * Set target file size in KB
     */
    public function setTargetSize(int $sizeKb): self
    {
        $this->targetSizeKb = $sizeKb;
        return $this;
    }
}
