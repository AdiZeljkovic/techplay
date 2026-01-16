"use client";

import { useEffect, useState, useCallback } from 'react';
import { getEcho } from '@/lib/echo';

interface Review {
    id: number;
    title: string;
    slug: string;
    item_name: string;
    category: string;
    summary: string;
    cover_image: string | null;
    rating: number;
    author: {
        name: string;
        avatar: string | null;
    };
    published_at: string;
}

export function useRealTimeReviews(initialReviews: Review[] = []) {
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [newCount, setNewCount] = useState(0);

    useEffect(() => {
        const echo = getEcho();
        if (!echo) return;

        const channel = echo.channel('reviews');

        channel.listen('.review.published', (data: Review) => {
            console.log('⭐ New review published:', data.title);

            setReviews(prev => {
                if (prev.some(r => r.id === data.id)) return prev;
                return [data, ...prev];
            });

            setNewCount(prev => prev + 1);
        });

        return () => echo.leaveChannel('reviews');
    }, []);

    return { reviews, newCount, setReviews };
}
