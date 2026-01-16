<?php

namespace App\Services;

use Illuminate\Support\Str;

class AltTextService
{
    /**
     * Generate smart ALT text for an image
     * Uses filename parsing and context without AI
     */
    public static function generate(
        string $filename,
        ?string $caption = null,
        ?string $articleTitle = null
    ): string {
        // Priority 1: Use caption if available
        if ($caption && strlen(trim($caption)) > 3) {
            return trim($caption);
        }

        // Priority 2: Parse filename
        $altFromFilename = self::parseFilename($filename);
        if ($altFromFilename) {
            return $altFromFilename;
        }

        // Priority 3: Use article title + generic suffix
        if ($articleTitle) {
            return $articleTitle . ' - image';
        }

        // Fallback
        return 'Image';
    }

    /**
     * Parse filename to human-readable ALT text
     */
    private static function parseFilename(string $filename): ?string
    {
        // Remove extension
        $name = pathinfo($filename, PATHINFO_FILENAME);

        // Remove common prefixes (timestamps, IDs)
        $name = preg_replace('/^[\d_-]+/', '', $name);
        $name = preg_replace('/^(img|image|photo|pic|screenshot|ss|cover)[-_]*/i', '', $name);

        // Replace separators with spaces
        $name = str_replace(['-', '_', '.'], ' ', $name);

        // Remove extra spaces
        $name = preg_replace('/\s+/', ' ', trim($name));

        // Title case
        $name = Str::title($name);

        // Min length check
        if (strlen($name) < 3) {
            return null;
        }

        return $name;
    }

    /**
     * Generate ALT text for common gaming/tech patterns
     */
    public static function generateFromContext(string $filename, string $category): string
    {
        $baseName = pathinfo($filename, PATHINFO_FILENAME);

        $patterns = [
            // Gaming
            '/gameplay/i' => 'Gameplay screenshot',
            '/screenshot/i' => 'Screenshot',
            '/trailer/i' => 'Trailer thumbnail',
            '/cover/i' => 'Game cover art',
            '/logo/i' => 'Logo',

            // Hardware
            '/benchmark/i' => 'Benchmark results',
            '/specs/i' => 'Specifications',
            '/unboxing/i' => 'Unboxing photo',
            '/teardown/i' => 'Teardown photo',

            // Reviews
            '/rating/i' => 'Rating',
            '/comparison/i' => 'Comparison',
            '/vs/i' => 'Versus comparison',
        ];

        foreach ($patterns as $pattern => $description) {
            if (preg_match($pattern, $baseName)) {
                return ucfirst($category) . ' - ' . $description;
            }
        }

        // Fallback to filename parsing
        return self::parseFilename($filename) ?? "{$category} image";
    }

    /**
     * Bulk generate ALT text for images without ALT
     */
    public static function bulkGenerate(array $images, ?string $articleTitle = null): array
    {
        return array_map(function ($image) use ($articleTitle) {
            return [
                'id' => $image['id'] ?? null,
                'filename' => $image['filename'],
                'original_alt' => $image['alt'] ?? null,
                'suggested_alt' => self::generate(
                    $image['filename'],
                    $image['caption'] ?? null,
                    $articleTitle
                ),
            ];
        }, $images);
    }
}
