'use client';

import { useEffect } from 'react';

/**
 * Hook to handle social media embed iframes.
 * Listens for postMessage events from Twitter embed iframes to auto-resize their height.
 * All embeds (Twitter, Instagram, Facebook) now use iframes - no external scripts needed.
 */
export function useEmbedScripts() {
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Twitter iframe auto-resize via postMessage
            if (event.origin === 'https://platform.twitter.com' || event.origin === 'https://twitframe.com') {
                try {
                    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

                    // Twitter sends resize messages with the tweet height
                    if (data['twttr.embed']) {
                        const iframes = document.querySelectorAll<HTMLIFrameElement>('iframe.twitter-embed-iframe');
                        iframes.forEach((iframe) => {
                            if (iframe.contentWindow === event.source && data['twttr.embed'].params?.[0]?.height) {
                                iframe.style.height = `${data['twttr.embed'].params[0].height}px`;
                            }
                        });
                    }
                } catch {
                    // Ignore parse errors from unrelated messages
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);
}
