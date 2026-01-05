"use client";

import { useEffect, useState } from "react";
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

export default function AdUnit({ position, className = "" }: AdUnitProps) {
    const [ad, setAd] = useState<AdData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAd() {
            try {
                const res = await axios.get(`/ads/${position}`);
                if (res.data) {
                    setAd(res.data);
                }
            } catch (error) {
                console.error("Failed to load ad:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchAd();
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
        return (
            <div className={`animate-pulse bg-[var(--bg-card)] rounded-lg ${className}`} style={{ minHeight: '90px' }} />
        );
    }

    if (!ad) {
        return null; // No ad for this position
    }

    // Custom code ad (HTML/JS)
    if (ad.type === 'code' && ad.code_block) {
        return (
            <div
                className={`ad-unit ad-${position} ${className}`}
                dangerouslySetInnerHTML={{ __html: ad.code_block }}
            />
        );
    }

    // Image banner ad
    if (ad.type === 'image' && ad.image_url) {
        const content = (
            <div className={`relative overflow-hidden rounded-lg ${className}`}>
                <Image
                    src={ad.image_url}
                    alt="Advertisement"
                    width={728}
                    height={90}
                    className="w-full h-auto object-cover"
                    unoptimized
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
}
