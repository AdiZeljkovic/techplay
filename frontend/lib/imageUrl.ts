/**
 * Image URL utility functions for responsive image variants
 * 
 * Backend generates variants with suffixes:
 * - original: filename.webp
 * - large: filename_large.webp (1280px)
 * - medium: filename_medium.webp (640px)
 * - thumb: filename_thumb.webp (256px)
 */

export type ImageVariant = 'thumb' | 'medium' | 'large' | 'original';

/**
 * Get the appropriate image variant URL based on display size
 * 
 * @param url - The original image URL from API
 * @param variant - The size variant to request
 * @returns Modified URL pointing to the variant
 */
export function getImageUrl(url: string | undefined | null, variant: ImageVariant = 'original'): string {
    if (!url) {
        return '/placeholder-image.webp'; // Fallback
    }

    // If requesting original, return as-is
    if (variant === 'original') {
        return url;
    }

    // Check if it's a WebP image
    if (!url.endsWith('.webp')) {
        // For non-webp images, return original (legacy images)
        return url;
    }

    // Insert variant suffix before .webp extension
    // e.g., articles/image.webp -> articles/image_thumb.webp
    return url.replace(/\.webp$/, `_${variant}.webp`);
}

/**
 * Get recommended variant based on container size
 * 
 * Usage:
 *   getImageUrl(article.featured_image_url, getVariantForSize(192))
 */
export function getVariantForSize(displayWidth: number): ImageVariant {
    if (displayWidth <= 256) return 'thumb';
    if (displayWidth <= 640) return 'medium';
    if (displayWidth <= 1280) return 'large';
    return 'original';
}

/**
 * Helper to build full image URL from storage path
 */
export function getStorageUrl(path: string | undefined | null): string {
    if (!path) return '';

    if (path.startsWith('http')) {
        return path;
    }

    // A leading slash means the asset is served by this app, not by the
    // backend's storage disk — rank emblems, for one. Prefixing those would
    // send the browser looking for them on the API host.
    if (path.startsWith('/')) {
        return path;
    }

    return `${process.env.NEXT_PUBLIC_STORAGE_URL}/${path}`;
}

/**
 * Combined helper - gets storage URL with variant
 */
export function getOptimizedImageUrl(
    path: string | undefined | null,
    variant: ImageVariant = 'original'
): string {
    const fullUrl = getStorageUrl(path);
    return getImageUrl(fullUrl, variant);
}
