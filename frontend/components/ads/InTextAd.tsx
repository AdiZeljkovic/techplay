"use client";

import { useMemo } from "react";
import AdUnit from "@/components/ads/AdUnit";

interface InTextAdProps {
    content: string;
    className?: string;
    /** After which paragraph indices to show ads (e.g., [3, 6] = after 3rd and 6th) */
    afterParagraphs?: number[];
    position?: string;
}

/**
 * Simpler approach: Split HTML content by paragraphs and inject AdUnit components
 */
export default function InTextAd({
    content,
    className = "",
    afterParagraphs = [3, 6],
    position = "article_in_text",
}: InTextAdProps) {
    const contentParts = useMemo(() => {
        const parts: { html: string; showAd?: boolean }[] = [];

        // Replace block elements that can contain <p> tags with same-length placeholders
        // so the regex won't match nested <p> tags. Same length preserves positions.
        const contentForMatching = content.replace(
            /<(table|blockquote|figure|ul|ol)\b[\s\S]*?<\/\1>/gi,
            (match) => "\x00".repeat(match.length)
        );

        const paragraphRegex = /<p[^>]*>[\s\S]*?<\/p>/gi;
        const paragraphPositions: number[] = [];

        // Find end-positions of each top-level paragraph
        let match;
        while ((match = paragraphRegex.exec(contentForMatching)) !== null) {
            paragraphPositions.push(match.index + match[0].length);
        }

        // If we don't have enough paragraphs, just return the content as-is
        if (paragraphPositions.length < Math.min(...afterParagraphs)) {
            return [{ html: content }];
        }

        // Only split at ad injection points (not per-paragraph).
        // This keeps all paragraphs between ads in a single prose container
        // so CSS margin collapse works correctly.
        const sortedAdPoints = [...afterParagraphs].sort((a, b) => a - b);
        let currentIndex = 0;

        for (const adAfterParagraph of sortedAdPoints) {
            if (adAfterParagraph <= paragraphPositions.length) {
                const splitPos = paragraphPositions[adAfterParagraph - 1];
                parts.push({
                    html: content.substring(currentIndex, splitPos),
                    showAd: true,
                });
                currentIndex = splitPos;
            }
        }

        // Add remaining content after the last ad point
        if (currentIndex < content.length) {
            parts.push({ html: content.substring(currentIndex) });
        }

        return parts;
    }, [content, afterParagraphs]);

    return (
        <>
            {contentParts.map((part, index) => (
                <div key={index}>
                    <div
                        className={className}
                        dangerouslySetInnerHTML={{ __html: part.html }}
                    />
                    {part.showAd && (
                        <div className="my-8 flex justify-center">
                            <AdUnit position={position} className="max-w-2xl" />
                        </div>
                    )}
                </div>
            ))}
        </>
    );
}
