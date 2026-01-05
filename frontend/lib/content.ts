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

    // 1. YouTube: Convert normal or short links to iframe
    // Matches: youtube.com/watch?v=ID or nocookie or youtu.be/ID. 
    // Usually Rich Editors wraps links in <a href="...">...</a> or <p>URL</p>.
    // We target plain text URLs in p tags or direct anchors if they are the only content.

    // Replace <p>https://www.youtube.com/watch?v=...</p> or just the link if it stands alone
    const youtubeRegex = /(?:<p>)?\s*(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})(?:\S*)?\s*(?:<\/p>)?/g;
    processedContent = processedContent.replace(youtubeRegex, (match, videoId) => {
        return `
            <div class="aspect-video w-full rounded-xl overflow-hidden shadow-lg my-8 border border-[var(--border)]">
                <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/${videoId}" 
                    title="YouTube video player" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            </div>
        `;
    });

    // 2. Twitter/X: Convert x.com/user/status/ID or twitter.com/...
    // Note: Twitter embeds usually require a script. For simplicity and performance, 
    // we can use a blockquote fallback or a simple stylized link card if we don't want the heavy script. 
    // OR, we can try to use standard twitter publish oembed... but that needs async fetch.
    // Instead, let's use a "smart card" styling.
    const twitterRegex = /(?:<p>)?\s*(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)(?:\S*)?\s*(?:<\/p>)?/g;
    processedContent = processedContent.replace(twitterRegex, (match, user, id) => {
        return `
            <div class="my-6 p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-card)] max-w-lg mx-auto">
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </div>
                    <div class="text-sm font-bold text-[var(--text-primary)]">@${user}</div>
                </div>
                <div class="text-[var(--text-primary)] mb-2">
                    <a href="${match.replace(/<[^>]*>/g, '').trim()}" target="_blank" class="hover:underline">View Tweet on X</a>
                </div>
            </div>
         `;
    });

    // Facebook posts are harder without an API token effectively. 
    // We just ensure they are clickable links for now.

    return { content: processedContent, toc };
}
