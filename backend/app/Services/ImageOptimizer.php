<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;

class ImageOptimizer
{
    /**
     * Image size variants configuration
     */
    protected array $variants = [
        'thumb' => ['width' => 256, 'height' => 256, 'quality' => 80],
        'medium' => ['width' => 640, 'height' => 480, 'quality' => 82],
        'large' => ['width' => 1280, 'height' => 720, 'quality' => 85],
        'original' => ['width' => 1920, 'height' => 1080, 'quality' => 85],
    ];

    /**
     * Default quality for WebP
     */
    protected int $quality = 82;

    /**
     * Optimize an uploaded image and generate all size variants
     * Returns the base path (without suffix) - variants are accessed by appending _thumb, _medium, etc.
     *
     * @param string $path Path to the image on the storage disk
     * @param string $disk Storage disk name
     * @return string Base path of optimized image (e.g., "articles/filename.webp")
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

        // Generate base path for WebP
        $directory = dirname($path);
        $filename = pathinfo($path, PATHINFO_FILENAME);
        $basePath = $directory . '/' . $filename;

        // Generate all variants
        foreach ($this->variants as $variantName => $config) {
            $this->generateVariant(
                $sourceImage,
                $originalWidth,
                $originalHeight,
                $basePath,
                $variantName,
                $config,
                $disk
            );
        }

        // Cleanup source
        imagedestroy($sourceImage);

        // Delete original file if it's not already WebP
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        if ($extension !== 'webp') {
            Storage::disk($disk)->delete($path);
        }

        // Return the base path with .webp extension (original variant)
        return $basePath . '.webp';
    }

    /**
     * Generate a single variant of the image
     */
    protected function generateVariant(
        \GdImage $sourceImage,
        int $originalWidth,
        int $originalHeight,
        string $basePath,
        string $variantName,
        array $config,
        string $disk
    ): void {
        // Calculate new dimensions
        [$newWidth, $newHeight] = $this->calculateDimensions(
            $originalWidth,
            $originalHeight,
            $config['width'],
            $config['height']
        );

        // Create resized image
        $resizedImage = imagecreatetruecolor($newWidth, $newHeight);

        // Preserve transparency
        imagealphablending($resizedImage, false);
        imagesavealpha($resizedImage, true);

        // Resize
        imagecopyresampled(
            $resizedImage,
            $sourceImage,
            0,
            0,
            0,
            0,
            $newWidth,
            $newHeight,
            $originalWidth,
            $originalHeight
        );

        // Generate filename with suffix for variants (except 'original')
        $suffix = $variantName === 'original' ? '' : '_' . $variantName;
        $variantPath = $basePath . $suffix . '.webp';
        $fullPath = Storage::disk($disk)->path($variantPath);

        // Save as WebP
        imagewebp($resizedImage, $fullPath, $config['quality']);

        // Cleanup
        imagedestroy($resizedImage);
    }

    /**
     * Generate variants for an existing WebP image (for migration)
     */
    public function generateVariantsForExisting(string $path, string $disk = 'public'): bool
    {
        $fullPath = Storage::disk($disk)->path($path);

        if (!file_exists($fullPath)) {
            return false;
        }

        $imageInfo = @getimagesize($fullPath);
        if (!$imageInfo) {
            return false;
        }

        $mimeType = $imageInfo['mime'];
        $originalWidth = $imageInfo[0];
        $originalHeight = $imageInfo[1];

        // Create image resource
        $sourceImage = $this->createImageFromFile($fullPath, $mimeType);
        if (!$sourceImage) {
            return false;
        }

        // Get base path (remove extension and any existing suffix)
        $directory = dirname($path);
        $filename = pathinfo($path, PATHINFO_FILENAME);

        // Remove any existing suffix (_thumb, _medium, _large)
        $filename = preg_replace('/_(thumb|medium|large)$/', '', $filename);
        $basePath = $directory . '/' . $filename;

        // Generate only the smaller variants (thumb, medium, large)
        // Skip 'original' as it already exists
        $variantsToGenerate = ['thumb', 'medium', 'large'];

        foreach ($variantsToGenerate as $variantName) {
            $config = $this->variants[$variantName];
            $variantFilePath = $basePath . '_' . $variantName . '.webp';

            // Skip if variant already exists
            if (Storage::disk($disk)->exists($variantFilePath)) {
                continue;
            }

            $this->generateVariant(
                $sourceImage,
                $originalWidth,
                $originalHeight,
                $basePath,
                $variantName,
                $config,
                $disk
            );
        }

        imagedestroy($sourceImage);
        return true;
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
     * Get URL helper for frontend to determine image variant URL
     */
    public static function getVariantUrl(string $baseUrl, string $variant = 'original'): string
    {
        if ($variant === 'original') {
            return $baseUrl;
        }

        // Insert variant suffix before .webp extension
        return preg_replace('/\.webp$/', '_' . $variant . '.webp', $baseUrl);
    }
}
