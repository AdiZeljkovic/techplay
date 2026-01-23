/**
 * Inject in-text ad placeholders into HTML content
 *
 * This function parses HTML content and injects ad markers after specified paragraphs.
 * The markers are then replaced with actual AdUnit components in the React component.
 */

export interface InTextAdConfig {
    /** After which paragraph to inject (e.g., [3, 6] means after 3rd and 6th paragraph) */
    afterParagraphs: number[];
    /** Position identifier for the ad */
    position: string;
}

const DEFAULT_CONFIG: InTextAdConfig = {
    afterParagraphs: [3, 6],
    position: 'article_in_text',
};

/**
 * Injects ad markers into HTML content after specified paragraphs
 */
export function injectInTextAds(
    htmlContent: string,
    config: Partial<InTextAdConfig> = {}
): string {
    const { afterParagraphs, position } = { ...DEFAULT_CONFIG, ...config };

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Find all top-level paragraph elements
    const paragraphs = Array.from(tempDiv.children).filter(
        (el) => el.tagName === 'P' && el.textContent && el.textContent.trim().length > 50
    );

    // Inject ad markers after specified paragraphs
    afterParagraphs.forEach((paragraphIndex) => {
        const paragraph = paragraphs[paragraphIndex - 1]; // 0-indexed
        if (paragraph && paragraph.parentNode) {
            const adMarker = document.createElement('div');
            adMarker.setAttribute('data-ad-position', position);
            adMarker.setAttribute('data-ad-index', paragraphIndex.toString());
            adMarker.className = 'in-text-ad-placeholder';

            // Insert after the paragraph
            paragraph.parentNode.insertBefore(adMarker, paragraph.nextSibling);
        }
    });

    return tempDiv.innerHTML;
}

/**
 * Check if content has enough paragraphs to show in-text ads
 */
export function shouldShowInTextAds(htmlContent: string, minParagraphs = 5): boolean {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    const paragraphs = Array.from(tempDiv.children).filter(
        (el) => el.tagName === 'P' && el.textContent && el.textContent.trim().length > 50
    );

    return paragraphs.length >= minParagraphs;
}
