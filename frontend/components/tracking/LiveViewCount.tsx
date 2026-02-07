'use client';

import { useState, useEffect, useRef } from 'react';
import { Eye } from 'lucide-react';

type Props = {
    slug: string;
    initialViews: number;
};

export default function LiveViewCount({ slug, initialViews }: Props) {
    const [views, setViews] = useState(initialViews);
    const [hasUpdated, setHasUpdated] = useState(false);
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        // Small delay to avoid counting bots/crawlers that bounce immediately
        const timer = setTimeout(async () => {
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
                        setHasUpdated(true);
                    }
                }
            } catch (error) {
                // Silent fail - view count stays at initial
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [slug]);

    return (
        <span className="flex items-center gap-2 text-sm font-medium">
            <Eye className="w-4 h-4 text-[var(--accent)]" />
            <span
                className={`transition-all duration-500 ${hasUpdated ? 'opacity-100' : 'opacity-80'}`}
            >
                {views.toLocaleString()}
            </span>
        </span>
    );
}
