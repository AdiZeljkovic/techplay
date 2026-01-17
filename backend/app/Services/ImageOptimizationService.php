<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ImageOptimizationService
{
    protected ImageManager $manager;

    // Responsive sizes to generate
    protected array $sizes = [
        'thumbnail' => 320,
        'small' => 640,
        'medium' => 1024,
        'large' => 1920,
    ];

    public function __construct()
    {
        $this->manager = new ImageManager(new Driver());
    }

    /**
     * Process uploaded image: optimize and create WebP + responsive versions
     */
    public function process(UploadedFile $file, string $directory = 'images'): array
    {
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $slug = Str::slug($originalName);
        $timestamp = now()->format('YmdHis');
        $baseName = "{$slug}-{$timestamp}";

        // Read image
        $image = $this->manager->read($file->getPathname());

        $results = [
            'original' => null,
            'webp' => null,
            'sizes' => [],
        ];

        // Save original (optimized)
        $originalPath = "{$directory}/{$baseName}.jpg";
        $optimized = $image->toJpeg(85);
        Storage::disk('public')->put($originalPath, $optimized);
        $results['original'] = Storage::disk('public')->url($originalPath);

        // Save WebP version
        $webpPath = "{$directory}/{$baseName}.webp";
        $webp = $image->toWebp(85);
        Storage::disk('public')->put($webpPath, $webp);
        $results['webp'] = Storage::disk('public')->url($webpPath);

        // Generate responsive sizes
        $originalWidth = $image->width();

        foreach ($this->sizes as $sizeName => $width) {
            if ($originalWidth > $width) {
                $resized = $image->scale(width: $width);

                // WebP version
                $sizePath = "{$directory}/{$baseName}-{$sizeName}.webp";
                Storage::disk('public')->put($sizePath, $resized->toWebp(85));

                $results['sizes'][$sizeName] = [
                    'width' => $width,
                    'url' => Storage::disk('public')->url($sizePath),
                ];
            }
        }

        return $results;
    }

    /**
     * Convert existing image to WebP
     */
    public function convertToWebp(string $imagePath): ?string
    {
        if (!Storage::disk('public')->exists($imagePath)) {
            return null;
        }

        $fullPath = Storage::disk('public')->path($imagePath);
        $image = $this->manager->read($fullPath);

        $webpPath = preg_replace('/\.(jpg|jpeg|png|gif)$/i', '.webp', $imagePath);
        Storage::disk('public')->put($webpPath, $image->toWebp(85));

        return Storage::disk('public')->url($webpPath);
    }

    /**
     * Generate srcset string for responsive images
     */
    public function generateSrcset(array $sizes): string
    {
        $srcset = [];
        foreach ($sizes as $size) {
            $srcset[] = "{$size['url']} {$size['width']}w";
        }
        return implode(', ', $srcset);
    }
}
