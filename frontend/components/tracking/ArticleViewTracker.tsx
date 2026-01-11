'use client';

import { useEffect, useRef } from 'react';

type Props = {
    slug: string;
};

export default function ArticleViewTracker({ slug }: Props) {
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const trackView = async () => {
            try {
                let apiUrl = process.env.NEXT_PUBLIC_API_URL;
                if (apiUrl && apiUrl.includes('localhost')) {
                    apiUrl = apiUrl.replace('localhost', '127.0.0.1');
                }

                await fetch(`${apiUrl}/articles/${slug}/view`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            } catch (error) {
                console.error('Failed to track view', error);
            }
        };

        // Small delay to ensure it's a real view? optional.
        const timer = setTimeout(trackView, 2000);

        return () => clearTimeout(timer);
    }, [slug]);

    return null;
}
