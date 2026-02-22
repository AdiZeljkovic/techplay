'use client';

import { useState, useEffect, useRef } from 'react';
import { Eye } from 'lucide-react';

type Props = {
    slug: string;
    initialViews?: number; // Optional now, only used as fallback
};

export default function LiveViewCount({ slug }: Props) {
    const [views, setViews] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        let apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (apiUrl && apiUrl.includes('localhost')) {
            apiUrl = apiUrl.replace('localhost', '127.0.0.1');
        }

        // 1. Immediately fetch current view count (no increment)
        const fetchViews = async () => {
            try {
                const res = await fetch(`${apiUrl}/articles/${slug}/views`, {
                    method: 'GET',
                    cache: 'no-store', // Always get fresh data
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.data && typeof data.data.views === 'number') {
                        setViews(data.data.views);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch view count:', error);
                setViews(0); // Fallback to 0 on error
            } finally {
                setIsLoading(false);
            }
        };

        fetchViews();

        // 2. After 1.5s delay, increment view count (avoid bots)
        const incrementTimer = setTimeout(async () => {
            try {
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
                // Silent fail - view count tracking failed but display continues
            }
        }, 1500);

        return () => clearTimeout(incrementTimer);
    }, [slug]);

    return (
        <span className="flex items-center gap-2 text-sm font-medium">
            <Eye className="w-4 h-4 text-[var(--accent)]" />
            <span className="transition-all duration-300">
                {isLoading ? (
                    <span className="inline-block w-12 h-4 bg-[var(--bg-elevated)] animate-pulse rounded" />
                ) : (
                    (views ?? 0).toLocaleString()
                )}
            </span>
        </span>
    );
}
