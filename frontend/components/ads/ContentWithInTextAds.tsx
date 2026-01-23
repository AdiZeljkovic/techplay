"use client";

import { useMemo, useEffect, useState } from "react";
import AdUnit from "@/components/ads/AdUnit";
import { injectInTextAds, shouldShowInTextAds } from "@/lib/injectInTextAds";

interface ContentWithInTextAdsProps {
    content: string;
    className?: string;
    afterParagraphs?: number[];
    position?: string;
}

/**
 * Component that renders article content with in-text ads automatically injected
 * after specified paragraphs
 */
export default function ContentWithInTextAds({
    content,
    className = "",
    afterParagraphs = [3, 6],
    position = "article_in_text",
}: ContentWithInTextAdsProps) {
    const [processedContent, setProcessedContent] = useState("");

    // Check if we should show in-text ads (only if article is long enough)
    const showInTextAds = useMemo(() => shouldShowInTextAds(content), [content]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Inject ad markers into content
        const contentWithMarkers = showInTextAds
            ? injectInTextAds(content, { afterParagraphs, position })
            : content;

        setProcessedContent(contentWithMarkers);
    }, [content, showInTextAds, afterParagraphs, position]);

    // Render content with ad components
    useEffect(() => {
        if (!processedContent) return;

        // Find all ad placeholders and replace with React components
        const placeholders = document.querySelectorAll('.in-text-ad-placeholder');

        placeholders.forEach((placeholder) => {
            const adPosition = placeholder.getAttribute('data-ad-position') || position;
            const adIndex = placeholder.getAttribute('data-ad-index') || '';

            // Create a wrapper div for the ad
            const adWrapper = document.createElement('div');
            adWrapper.className = 'my-8 flex justify-center';
            adWrapper.setAttribute('data-ad-wrapper', 'true');
            adWrapper.setAttribute('data-ad-position', adPosition);
            adWrapper.setAttribute('data-ad-index', adIndex);

            // Replace placeholder with wrapper
            placeholder.replaceWith(adWrapper);
        });
    }, [processedContent, position]);

    if (!processedContent) {
        return <div className={className} dangerouslySetInnerHTML={{ __html: content }} />;
    }

    return (
        <>
            <div className={className} dangerouslySetInnerHTML={{ __html: processedContent }} />

            {/* Render ads for each placeholder */}
            {showInTextAds && (
                <>
                    {afterParagraphs.map((index) => (
                        <InTextAdPortal key={index} position={position} index={index} />
                    ))}
                </>
            )}
        </>
    );
}

/**
 * Portal component that renders an ad into a specific placeholder
 */
function InTextAdPortal({ position, index }: { position: string; index: number }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Find the wrapper and inject the ad
        const wrapper = document.querySelector(
            `[data-ad-wrapper][data-ad-position="${position}"][data-ad-index="${index}"]`
        );

        if (wrapper) {
            // Create a container for the ad
            const adContainer = document.createElement('div');
            adContainer.id = `in-text-ad-${position}-${index}`;
            wrapper.appendChild(adContainer);
        }

        return () => {
            setMounted(false);
        };
    }, [position, index]);

    if (!mounted) return null;

    const containerId = `in-text-ad-${position}-${index}`;
    const container = document.getElementById(containerId);

    if (!container) return null;

    // Render AdUnit into the portal
    return (
        <div style={{ display: 'none' }}>
            <AdUnit position={position} className="max-w-2xl" />
        </div>
    );
}
