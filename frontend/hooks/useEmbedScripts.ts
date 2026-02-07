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
 * Handles Twitter/X blockquote embeds with polling to ensure script is ready.
 * Instagram and Facebook use iframe embeds that don't need external scripts.
 */
export function useEmbedScripts() {
    useEffect(() => {
        const hasTweets = document.querySelectorAll('blockquote.twitter-tweet').length > 0;
        if (!hasTweets) return;

        // Try to process tweets immediately if twttr is already loaded
        if (window.twttr?.widgets) {
            window.twttr.widgets.load();
            return;
        }

        // Load the script if not already in the DOM
        if (!document.querySelector('script[src*="platform.twitter.com/widgets.js"]')) {
            const script = document.createElement('script');
            script.src = 'https://platform.twitter.com/widgets.js';
            script.async = true;
            document.head.appendChild(script);
        }

        // Poll until twttr becomes available, then process
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (window.twttr?.widgets) {
                window.twttr.widgets.load();
                clearInterval(interval);
            } else if (attempts >= 30) {
                // Give up after ~9 seconds
                clearInterval(interval);
            }
        }, 300);

        return () => clearInterval(interval);
    }, []);
}
