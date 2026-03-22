export interface TOCItem {
    id: string;
    text: string;
    level: number;
}

export function processContent(html: string): { content: string; toc: TOCItem[] } {
    const toc: TOCItem[] = [];
    const idMap = new Map<string, number>();

    // Step 0: Remove empty paragraphs from TipTap/Filament rich text editor.
    // Instead of enumerating invisible characters, we check if any visible text remains
    // after stripping all HTML tags and entities. Keeps paragraphs with images/videos.
    let processedContent = (html || '')
        .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (match, inner) => {
            // Keep paragraphs containing meaningful elements (images, videos, iframes, etc.)
            if (/<(img|video|iframe|embed|object|canvas|svg)\b/i.test(inner)) return match;
            // Strip all HTML tags, then all HTML entities, then all whitespace/invisible chars
            const visible = inner
                .replace(/<[^>]*>/g, '')
                .replace(/&[a-z]+;/gi, '')
                .replace(/&#x?[\da-f]+;/gi, '')
                .replace(/[\s\u00A0\u200B\u200C\u200D\uFEFF]/g, '');
            return visible.length > 0 ? match : '';
        });

    // Step 1: Process headings for TOC (h2, h3)
    processedContent = processedContent.replace(/<(h[2-3])([^>]*)>(.*?)<\/\1>/gi, (match, tag, attrs, text) => {
        const cleanText = text.replace(/<[^>]*>/g, '').trim();

        let id = cleanText
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        if (!id) id = 'heading';

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

        if (attrs.includes('id=')) {
            return match;
        }

        return `<${tag} id="${id}"${attrs}>${text}</${tag}>`;
    });

    // --- Embed Processing ---

    // Step 2: Pre-process - unwrap social media <a> links that are the sole content of a <p> tag.
    // The rich text editor (TipTap/Filament) wraps pasted URLs in <a> tags:
    //   <p><a href="https://x.com/...">https://x.com/...</a></p>
    // We convert these back to plain URLs so the embed regexes below can match them.
    // NOTE: Only unwrap when the link text IS the URL itself (bare embed paste).
    // Links with custom text (e.g. <a href="youtube.com/...">Watch here</a>) are preserved as links.
    const socialDomains = 'youtube\\.com\\/watch|youtu\\.be|twitter\\.com|x\\.com|instagram\\.com\\/(?:p|reel)|facebook\\.com';
    // Only unwrap when the link text IS the URL itself (starts with http).
    // Links with custom text like <a href="youtube.com/...">Watch here</a> are left intact
    // so they render as clickable links instead of being converted to embeds.
    const unwrapRegex = new RegExp(
        `<p\\b[^>]*>[\\s\\u00A0]*<a\\b[^>]*?href=["'](https?:\\/\\/(?:www\\.)?(?:${socialDomains})[^"']*?)["'][^>]*>\\s*https?:\\/\\/[^<]*?<\\/a>[\\s\\u00A0]*<\\/p>`,
        'gi'
    );
    processedContent = processedContent.replace(unwrapRegex, '<p>$1</p>');

    // Step 3: YouTube - convert bare URLs to responsive iframe embeds.
    // (?<![="']) negative lookbehind prevents matching URLs inside HTML attributes (href="..."),
    // which would corrupt the HTML and break the page.
    const youtubeRegex = /(?<![="'])(?:<p\b[^>]*>)?[\s\u00A0]*(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})[^\s<"']*[\s\u00A0]*(?:<\/p>)?/gi;
    processedContent = processedContent.replace(youtubeRegex, (_, videoId) => {
        return `<div class="embed-container my-8"><div class="relative w-full" style="padding-bottom:56.25%"><iframe class="absolute top-0 left-0 w-full h-full rounded-xl" src="https://www.youtube.com/embed/${videoId}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div></div>`;
    });

    // Step 4: Twitter/X - convert bare URLs to iframe embeds.
    // (?<![="']) prevents matching inside href/src attributes.
    const twitterRegex = /(?<![="'])(?:<p\b[^>]*>)?[\s\u00A0]*(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)[^\s<"']*[\s\u00A0]*(?:<\/p>)?/gi;
    processedContent = processedContent.replace(twitterRegex, (_, user, id) => {
        return `<div class="embed-container flex justify-center my-8"><iframe src="https://platform.twitter.com/embed/Tweet.html?dnt=true&id=${id}&theme=dark" style="width:550px;max-width:100%;min-height:300px;border:none;border-radius:12px;overflow:hidden;" allowfullscreen scrolling="no" class="twitter-embed-iframe"></iframe></div>`;
    });

    // Step 5: Instagram - convert bare URLs to iframe embeds.
    // (?<![="']) prevents matching inside href/src attributes.
    const instagramRegex = /(?<![="'])(?:<p\b[^>]*>)?[\s\u00A0]*(?:https?:\/\/)?(?:www\.)?instagram\.com\/(p|reel)\/([a-zA-Z0-9_-]+)[^\s<"']*[\s\u00A0]*(?:<\/p>)?/gi;
    processedContent = processedContent.replace(instagramRegex, (_, type, id) => {
        return `<div class="embed-container flex justify-center my-8"><iframe src="https://www.instagram.com/${type}/${id}/embed/" style="max-width:540px;width:100%;min-height:500px;border:none;border-radius:12px;overflow:hidden;background:#000;" scrolling="no" allowtransparency="true"></iframe></div>`;
    });

    // Step 6: Facebook - convert bare URLs to iframe embeds.
    // (?<![="']) prevents matching inside href/src attributes.
    const facebookRegex = /(?<![="'])(https?:\/\/(?:www\.|web\.|m\.)?facebook\.com\/(?:[^/]+\/posts\/[^\s<"']+|permalink\.php\?[^\s<"']+|[^/]+\/videos\/[^\s<"']+|watch\/\?v=\d+))[^\s<"']*(?:<\/p>)?/gi;
    processedContent = processedContent.replace(facebookRegex, (_, url) => {
        const encodedUrl = encodeURIComponent(url);
        return `<div class="embed-container flex justify-center my-8"><iframe src="https://www.facebook.com/plugins/post.php?href=${encodedUrl}&show_text=true&width=500" width="500" height="600" style="border:none;overflow:hidden;max-width:100%;border-radius:12px;" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe></div>`;
    });

    // Step 7: Wrap tables in a scrollable container for mobile responsiveness
    processedContent = processedContent
        .replace(/<table\b/gi, '<div class="overflow-x-auto w-full my-6 rounded-xl"><table')
        .replace(/<\/table>/gi, '</table></div>');

    // Step 8: Open all external links in a new tab.
    // Adds target="_blank" rel="noopener noreferrer" to every <a> tag so links
    // don't navigate away from the article page.
    processedContent = processedContent.replace(
        /<a\b([^>]*?)>/gi,
        (match, attrs) => {
            if (/target=/i.test(attrs)) return match; // already has target
            return `<a${attrs} target="_blank" rel="noopener noreferrer">`;
        }
    );

    return { content: processedContent, toc };
}
