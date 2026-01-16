"use client";

import { useEffect, useState, useCallback } from 'react';
import { getEcho } from '@/lib/echo';

interface Article {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    featured_image_url: string | null;
    category: string | null;
    category_slug: string | null;
    author: {
        name: string;
        avatar: string | null;
    };
    published_at: string;
}

/**
 * Hook for real-time news updates.
 * New articles will automatically appear at the top of the list.
 */
export function useRealTimeNews(initialArticles: Article[] = []) {
    const [articles, setArticles] = useState<Article[]>(initialArticles);
    const [newArticleCount, setNewArticleCount] = useState(0);

    useEffect(() => {
        const echo = getEcho();
        if (!echo) return;

        const channel = echo.channel('news');

        channel.listen('.article.published', (data: Article) => {
            console.log('🆕 New article published:', data.title);

            setArticles(prev => {
                // Avoid duplicates
                if (prev.some(a => a.id === data.id)) return prev;
                return [data, ...prev];
            });

            setNewArticleCount(prev => prev + 1);
        });

        return () => {
            echo.leaveChannel('news');
        };
    }, []);

    const clearNewCount = useCallback(() => {
        setNewArticleCount(0);
    }, []);

    return { articles, newArticleCount, clearNewCount, setArticles };
}
