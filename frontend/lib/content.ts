export interface TOCItem {
    id: string;
    text: string;
    level: number;
}

export function processContent(html: string): { content: string; toc: TOCItem[] } {
    const toc: TOCItem[] = [];
    const idMap = new Map<string, number>();

    // Step 0: Clean up empty paragraphs from the rich text editor (TipTap/Filament).
    // These are created when pressing Enter multiple times and produce unwanted gaps.
    // Matches: <p></p>, <p> </p>, <p>&nbsp;</p>, <p><br></p>, <p><br/></p>
    let processedContent = (html || '')
        .replace(/<p[^>]*>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '');

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
    const socialDomains = 'youtube\\.com\\/watch|youtu\\.be|twitter\\.com|x\\.com|instagram\\.com\\/(?:p|reel)|facebook\\.com';
    const unwrapRegex = new RegExp(
        `<p\\b[^>]*>[\\s\\u00A0]*<a\\b[^>]*?href=["'](https?:\\/\\/(?:www\\.)?(?:${socialDomains})[^"']*?)["'][^>]*>[\\s\\S]*?<\\/a>[\\s\\u00A0]*<\\/p>`,
        'gi'
    );
    processedContent = processedContent.replace(unwrapRegex, '<p>$1</p>');

    // Step 3: YouTube - convert URLs to responsive iframe embeds
    // Matches: youtube.com/watch?v=ID, youtu.be/ID (with optional params after the 11-char ID)
    // IMPORTANT: [^\s<]* ensures we don't eat into HTML tags (unlike \S* which would)
    const youtubeRegex = /(?:<p\b[^>]*>)?[\s\u00A0]*(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})[^\s<]*[\s\u00A0]*(?:<\/p>)?/gi;
    processedContent = processedContent.replace(youtubeRegex, (_, videoId) => {
        return `<div class="embed-container my-8"><div class="relative w-full" style="padding-bottom:56.25%"><iframe class="absolute top-0 left-0 w-full h-full rounded-xl" src="https://www.youtube.com/embed/${videoId}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div></div>`;
    });

    // Step 4: Twitter/X - convert URLs to iframe embeds
    // Uses Twitter's own embed iframe URL (same URL that widgets.js creates internally).
    // Iframe approach is used instead of blockquote+script because React re-renders
    // destroy the widget DOM when dangerouslySetInnerHTML re-applies the original HTML.
    // IMPORTANT: [^\s<]* prevents eating into HTML tags
    const twitterRegex = /(?:<p\b[^>]*>)?[\s\u00A0]*(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)[^\s<]*[\s\u00A0]*(?:<\/p>)?/gi;
    processedContent = processedContent.replace(twitterRegex, (_, user, id) => {
        return `<div class="embed-container flex justify-center my-8"><iframe src="https://platform.twitter.com/embed/Tweet.html?dnt=true&id=${id}&theme=dark" style="width:550px;max-width:100%;min-height:300px;border:none;border-radius:12px;overflow:hidden;" allowfullscreen scrolling="no" class="twitter-embed-iframe"></iframe></div>`;
    });

    // Step 5: Instagram - convert URLs to iframe embeds (no external script needed)
    // Matches: instagram.com/p/CODE or instagram.com/reel/CODE
    const instagramRegex = /(?:<p\b[^>]*>)?[\s\u00A0]*(?:https?:\/\/)?(?:www\.)?instagram\.com\/(p|reel)\/([a-zA-Z0-9_-]+)[^\s<]*[\s\u00A0]*(?:<\/p>)?/gi;
    processedContent = processedContent.replace(instagramRegex, (_, type, id) => {
        return `<div class="embed-container flex justify-center my-8"><iframe src="https://www.instagram.com/${type}/${id}/embed/" style="max-width:540px;width:100%;min-height:500px;border:none;border-radius:12px;overflow:hidden;background:#000;" scrolling="no" allowtransparency="true"></iframe></div>`;
    });

    // Step 6: Facebook - convert URLs to iframe embeds
    // Supports: facebook.com/page/posts/id, permalink.php, videos, watch
    const facebookRegex = /(?:<p\b[^>]*>)?[\s\u00A0]*(https?:\/\/(?:www\.|web\.|m\.)?facebook\.com\/(?:[^/]+\/posts\/[^\s<]+|permalink\.php\?[^\s<]+|[^/]+\/videos\/[^\s<]+|watch\/\?v=\d+))[^\s<]*[\s\u00A0]*(?:<\/p>)?/gi;
    processedContent = processedContent.replace(facebookRegex, (_, url) => {
        const encodedUrl = encodeURIComponent(url);
        return `<div class="embed-container flex justify-center my-8"><iframe src="https://www.facebook.com/plugins/post.php?href=${encodedUrl}&show_text=true&width=500" width="500" height="600" style="border:none;overflow:hidden;max-width:100%;border-radius:12px;" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe></div>`;
    });

    return { content: processedContent, toc };
}
