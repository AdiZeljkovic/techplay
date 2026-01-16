"use client";

import { useEffect, useState } from 'react';
import { getEcho } from '@/lib/echo';

interface Video {
    id: number;
    title: string;
    slug: string;
    youtube_url: string;
    thumbnail_url: string | null;
    youtube_id: string | null;
    published_at: string;
}

export function useRealTimeVideos(initialVideos: Video[] = []) {
    const [videos, setVideos] = useState<Video[]>(initialVideos);
    const [newCount, setNewCount] = useState(0);

    useEffect(() => {
        const echo = getEcho();
        if (!echo) return;

        const channel = echo.channel('videos');

        channel.listen('.video.published', (data: Video) => {
            console.log('🎬 New video published:', data.title);

            setVideos(prev => {
                if (prev.some(v => v.id === data.id)) return prev;
                return [data, ...prev];
            });

            setNewCount(prev => prev + 1);
        });

        return () => echo.leaveChannel('videos');
    }, []);

    return { videos, newCount, setVideos };
}
