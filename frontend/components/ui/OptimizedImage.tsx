'use client';

import Image from 'next/image';

interface OptimizedImageProps {
    src: string;
    webpSrc?: string | null;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    className?: string;
    priority?: boolean;
    sizes?: string;
}

/**
 * OptimizedImage component that automatically prefers WebP format
 * Falls back to original if WebP not available
 */
export default function OptimizedImage({
    src,
    webpSrc,
    alt,
    width,
    height,
    fill = false,
    className = '',
    priority = false,
    sizes,
}: OptimizedImageProps) {
    // Prefer WebP if available
    const imageSrc = webpSrc || src;

    // For external URLs or when WebP conversion happened
    const isExternal = imageSrc.startsWith('http');

    if (fill) {
        return (
            <Image
                src={imageSrc}
                alt={alt}
                fill
                className={className}
                priority={priority}
                sizes={sizes || '100vw'}
                unoptimized={isExternal}
            />
        );
    }

    return (
        <Image
            src={imageSrc}
            alt={alt}
            width={width || 800}
            height={height || 450}
            className={className}
            priority={priority}
            sizes={sizes}
            unoptimized={isExternal}
        />
    );
}

/**
 * Helper function to get WebP URL from original URL
 */
export function getWebpUrl(originalUrl: string): string {
    if (!originalUrl) return originalUrl;

    // Replace extension with .webp
    return originalUrl.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
}

/**
 * Picture element with WebP fallback for maximum browser support
 */
export function PictureWithWebP({
    src,
    alt,
    className = '',
}: {
    src: string;
    alt: string;
    className?: string;
}) {
    const webpSrc = getWebpUrl(src);

    return (
        <picture>
            <source srcSet={webpSrc} type="image/webp" />
            <img src={src} alt={alt} className={className} loading="lazy" />
        </picture>
    );
}
