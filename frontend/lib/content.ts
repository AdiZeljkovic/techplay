export interface TOCItem {
    id: string;
    text: string;
    level: number;
}

export function processContent(html: string): { content: string; toc: TOCItem[] } {
    const toc: TOCItem[] = [];
    const idMap = new Map<string, number>();

    let processedContent = (html || '').replace(/<(h[2-3])([^>]*)>(.*?)<\/\1>/gi, (match, tag, attrs, text) => {
        // Strip tags from text to get clean title
        const cleanText = text.replace(/<[^>]*>/g, '').trim();

        // Generate header ID
        let id = cleanText
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        if (!id) id = 'heading';

        // Handle duplicates
        if (idMap.has(id)) {
            const count = idMap.get(id)! + 1;
            idMap.set(id, count);
            id = `${id}-${count}`;
        } else {
            idMap.set(id, 0);
        }

        toc.push({
            id,
            text: cleanText,
            level: parseInt(tag.charAt(1)),
        });

        // Add ID to the tag
        if (attrs.includes('id=')) {
            return match;
        }

        return `<${tag} id="${id}"${attrs}>${text}</${tag}>`;
    });

    // --- Embed Processing ---

    // 1. YouTube: Convert links to iframe embeds
    // 1. YouTube: Convert links to iframe embeds
    // Handle anchor-wrapped YouTube links: <a href="youtube...">text</a>
    // Use non-greedy matching to properly extract video ID
    // Updated to handle <p> tags with attributes and non-breaking spaces
    const youtubeAnchorRegex = /(?:<p\b[^>]*>)?[\s\u00A0]*<a\b[^>]*?\bhref\s*=\s*["']https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})[^"']*["'][^>]*>[\s\S]*?<\/a>[\s\u00A0]*(?:<\/p>)?/gi;
    processedContent = processedContent.replace(youtubeAnchorRegex, (match, videoId) => {
        console.log('YouTube match found, videoId:', videoId); // Debug
        return `<div class="relative w-full pb-[56.25%] h-0 rounded-xl overflow-hidden shadow-lg"><iframe class="absolute top-0 left-0 w-full h-full" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
    });

    // Also handle plain text YouTube URLs (not wrapped in anchor)
    const youtubeTextRegex = /(?:<p\b[^>]*>)?[\s\u00A0]*(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})[^\s<]*)\s*(?:<\/p>)?/g;
    processedContent = processedContent.replace(youtubeTextRegex, (match, fullUrl, videoId) => {
        console.log('YouTube text match, videoId:', videoId); // Debug
        return `<div class="relative w-full pb-[56.25%] h-0 rounded-xl overflow-hidden shadow-lg"><iframe class="absolute top-0 left-0 w-full h-full" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
    });

    // 2. Twitter/X: Convert x.com/user/status/ID or twitter.com/...
    // Uses official publish widget (needs platform.js in layout/component)
    const twitterRegex = /(?:<p\b[^>]*>)?[\s\u00A0]*(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)(?:\S*)?[\s\u00A0]*(?:<\/p>)?/g;
    processedContent = processedContent.replace(twitterRegex, (match, user, id) => {
        return `<div class="flex justify-center my-6"><blockquote class="twitter-tweet" data-dnt="true" data-theme="dark"><a href="https://twitter.com/${user}/status/${id}?ref_src=twsrc%5Etfw">Loading Tweet...</a></blockquote></div>`;
    });

    // 3. Instagram: Convert instagram.com/p/ID or reel/ID
    // Uses official embed.js
    const instagramRegex = /(?:<p\b[^>]*>)?[\s\u00A0]*(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)(?:\S*)?[\s\u00A0]*(?:<\/p>)?/g;
    processedContent = processedContent.replace(instagramRegex, (match, id) => {
        return `<div class="flex justify-center my-6"><blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="https://www.instagram.com/p/${id}/?utm_source=ig_embed&amp;utm_campaign=loading" data-instgrm-version="14" style=" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"></blockquote></div>`;
    });

    // 4. Facebook: Convert facebook.com/*/posts/* and permalinks
    // Uses iframe method for simplicity (no script required mostly, or works with standard SDK)
    // Supports: facebook.com/page/posts/id, facebook.com/permalink.php?story_fbid=id&id=id
    // This is tricky because FB URLs vary wildly. We'll target standard post patterns.
    // For simplicity, we can use the "plugins/post.php" iframe which takes the full URL as href.
    const facebookRegex = /(?:<p\b[^>]*>)?[\s\u00A0]*(https?:\/\/(?:www\.|web\.|m\.)?facebook\.com\/(?:[^/]+\/posts\/[^/?]+|permalink\.php\?[^"<\s]+|[^/]+\/videos\/[^/?]+|watch\/\?v=\d+))[\s\u00A0]*(?:<\/p>)?/g;
    processedContent = processedContent.replace(facebookRegex, (match, url) => {
        const encodedUrl = encodeURIComponent(url);
        return `<div class="flex justify-center my-6"><iframe src="https://www.facebook.com/plugins/post.php?href=${encodedUrl}&show_text=true&width=500" width="500" height="600" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe></div>`;
    });

    return { content: processedContent, toc };
}
