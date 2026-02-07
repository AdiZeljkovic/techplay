'use client';

import { useEffect } from 'react';

declare global {
    interface Window {
        twttr?: {
            widgets: {
                load: (el?: HTMLElement) => void;
            };
        };
    }
}

/**
 * Hook to load and initialize social media embed scripts after React renders content.
 * Currently handles Twitter/X blockquote embeds.
 * Instagram and Facebook use iframe embeds that don't need external scripts.
 */
export function useEmbedScripts() {
    useEffect(() => {
        // Twitter/X: Process tweet blockquotes
        const tweetBlockquotes = document.querySelectorAll('blockquote.twitter-tweet');
        if (tweetBlockquotes.length > 0) {
            if (window.twttr) {
                // Script already loaded - just re-process the DOM
                window.twttr.widgets.load();
            } else {
                // Load the script - it auto-processes blockquotes on load
                const existing = document.querySelector('script[src*="platform.twitter.com/widgets.js"]');
                if (!existing) {
                    const script = document.createElement('script');
                    script.src = 'https://platform.twitter.com/widgets.js';
                    script.async = true;
                    script.charset = 'utf-8';
                    document.body.appendChild(script);
                }
            }
        }
    }, []);
}
