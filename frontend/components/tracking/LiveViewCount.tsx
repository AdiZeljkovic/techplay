'use client';

import { useState, useEffect, useRef } from 'react';
import { Eye } from 'lucide-react';

type Props = {
    slug: string;
    initialViews: number;
};

export default function LiveViewCount({ slug, initialViews }: Props) {
    const [views, setViews] = useState(initialViews);
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

                const res = await fetch(`${apiUrl}/articles/${slug}/view`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.data && typeof data.data.views === 'number') {
                        setViews(data.data.views);
                    }
                }
            } catch (error) {
                console.error('Failed to track view', error);
            }
        };

        // Small delay to ensure hydration match isn't jarring? No, instant is better.
        trackView();
    }, [slug]);

    return (
        <span className="flex items-center gap-2 text-sm font-medium animate-fade-in">
            <Eye className="w-4 h-4 text-[var(--accent)]" />
            {views}
        </span>
    );
}
