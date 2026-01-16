"use client";

import { useEffect, useState } from 'react';
import { getEcho } from '@/lib/echo';

interface Guide {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    featured_image_url: string | null;
    difficulty: string;
    author: {
        name: string;
        avatar: string | null;
    };
    published_at: string;
}

export function useRealTimeGuides(initialGuides: Guide[] = []) {
    const [guides, setGuides] = useState<Guide[]>(initialGuides);
    const [newCount, setNewCount] = useState(0);

    useEffect(() => {
        const echo = getEcho();
        if (!echo) return;

        const channel = echo.channel('guides');

        channel.listen('.guide.published', (data: Guide) => {
            console.log('📚 New guide published:', data.title);

            setGuides(prev => {
                if (prev.some(g => g.id === data.id)) return prev;
                return [data, ...prev];
            });

            setNewCount(prev => prev + 1);
        });

        return () => echo.leaveChannel('guides');
    }, []);

    return { guides, newCount, setGuides };
}
