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
        // Split content by top-level <p> tags (not those inside tables, blockquotes, etc.)
        const parts: { html: string; showAd?: boolean }[] = [];

        // Replace block elements that can contain <p> tags with same-length placeholders
        // so the regex won't match nested <p> tags. Same length preserves positions.
        const contentForMatching = content.replace(
            /<(table|blockquote|figure|ul|ol)\b[\s\S]*?<\/\1>/gi,
            (match) => "\x00".repeat(match.length)
        );

        const paragraphRegex = /<p[^>]*>[\s\S]*?<\/p>/gi;
        const matches = contentForMatching.match(paragraphRegex) || [];

        // If we don't have enough paragraphs, just return the content as-is
        if (matches.length < Math.min(...afterParagraphs)) {
            return [{ html: content }];
        }

        let lastIndex = 0;
        let paragraphCount = 0;
        const paragraphPositions: number[] = [];

        // Find positions of each top-level paragraph
        let match;
        const regex = new RegExp(paragraphRegex);
        while ((match = regex.exec(contentForMatching)) !== null) {
            paragraphPositions.push(match.index + match[0].length);
            paragraphCount++;
        }

        // Build parts array with ad injection points
        let currentIndex = 0;
        paragraphPositions.forEach((position, idx) => {
            const paragraphNumber = idx + 1;

            // Add content up to this point
            parts.push({
                html: content.substring(currentIndex, position),
                showAd: afterParagraphs.includes(paragraphNumber),
            });

            currentIndex = position;
        });

        // Add remaining content
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
