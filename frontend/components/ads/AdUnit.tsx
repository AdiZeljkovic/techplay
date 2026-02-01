"use client";

import { useEffect, useState, memo, useCallback } from "react";
import axios from "@/lib/axios";
import Image from "next/image";

interface AdData {
    id: number;
    type: 'image' | 'code';
    image_url: string | null;
    code_block: string | null;
    target_url: string | null;
    position: string;
}

interface AdUnitProps {
    position: string;
    className?: string;
}

// CLS FIX: Define expected ad sizes by position to reserve space
const AD_SIZES: Record<string, { width: number; height: number; mobileHeight?: number }> = {
    'home_hero': { width: 728, height: 90, mobileHeight: 50 },
    'home_mid_1': { width: 728, height: 90, mobileHeight: 50 },
    'home_mid_2': { width: 728, height: 90, mobileHeight: 50 },
    'sidebar': { width: 300, height: 250 },
    'article_top': { width: 728, height: 90, mobileHeight: 50 },
    'article_bottom': { width: 728, height: 90, mobileHeight: 50 },
    'in_content': { width: 336, height: 280 },
    'default': { width: 728, height: 90, mobileHeight: 50 },
};

// PERFORMANCE: Memoized to prevent re-renders when parent updates
export default memo(function AdUnit({ position, className = "" }: AdUnitProps) {
    const [ad, setAd] = useState<AdData | null>(null);
    const [loading, setLoading] = useState(true);

    // Get expected size for this position
    const adSize = AD_SIZES[position] || AD_SIZES['default'];

    // MEMORY LEAK FIX: Add AbortController for cleanup on unmount
    useEffect(() => {
        const abortController = new AbortController();

        async function fetchAd() {
            try {
                const res = await axios.get(`/ads/${position}`, {
                    signal: abortController.signal
                });
                if (res.data && !abortController.signal.aborted) {
                    setAd(res.data);
                }
            } catch (error: any) {
                // Ignore abort errors
                if (error?.name !== 'CanceledError' && !abortController.signal.aborted) {
                    console.error("Failed to load ad:", error);
                }
            } finally {
                if (!abortController.signal.aborted) {
                    setLoading(false);
                }
            }
        }
        fetchAd();

        return () => abortController.abort();
    }, [position]);

    const handleClick = async () => {
        if (ad?.id) {
            try {
                await axios.post(`/ads/${ad.id}/click`);
            } catch (error) {
                // Silent fail for tracking
            }
        }
    };

    if (loading) {
        // CLS FIX: Reserve exact space based on ad position
        return (
            <div
                className={`animate-pulse bg-[var(--bg-card)] rounded-lg ${className}`}
                style={{
                    aspectRatio: `${adSize.width} / ${adSize.height}`,
                    maxWidth: adSize.width,
                    width: '100%'
                }}
            />
        );
    }

    if (!ad) {
        return null; // No ad for this position
    }

    // Custom code ad (HTML/JS) - reserve minimum space to reduce CLS
    if (ad.type === 'code' && ad.code_block) {
        return (
            <div
                className={`ad-unit ad-${position} ${className}`}
                style={{ minHeight: adSize.height }}
                dangerouslySetInnerHTML={{ __html: ad.code_block }}
            />
        );
    }

    // Image banner ad
    if (ad.type === 'image' && ad.image_url) {
        const content = (
            <div
                className={`relative overflow-hidden rounded-lg ${className}`}
                style={{
                    aspectRatio: `${adSize.width} / ${adSize.height}`,
                    maxWidth: adSize.width,
                    width: '100%'
                }}
            >
                <Image
                    src={ad.image_url}
                    alt="Advertisement"
                    width={adSize.width}
                    height={adSize.height}
                    className="w-full h-full object-cover"
                    sizes={`(max-width: 768px) 100vw, ${adSize.width}px`}
                />
                <span className="absolute bottom-1 right-1 text-[10px] text-white/50 bg-black/30 px-1 rounded">
                    AD
                </span>
            </div>
        );

        if (ad.target_url) {
            return (
                <a
                    href={ad.target_url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    onClick={handleClick}
                    className="block hover:opacity-90 transition-opacity"
                >
                    {content}
                </a>
            );
        }

        return content;
    }

    return null;
});
