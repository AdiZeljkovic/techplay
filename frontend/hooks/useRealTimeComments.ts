"use client";

import { useEffect, useState, useCallback } from 'react';
import { getEcho } from '@/lib/echo';

interface CommentUser {
    id: number;
    name: string;
    username: string;
    avatar_url: string | null;
}

interface Comment {
    id: number;
    content: string;
    parent_id: number | null;
    created_at: string;
    user: CommentUser;
}

/**
 * Hook for real-time comments on a specific content.
 * @param contentType - 'articles', 'reviews', 'videos', etc.
 * @param contentId - The ID of the content
 */
export function useRealTimeComments(
    contentType: string,
    contentId: number,
    initialComments: Comment[] = []
) {
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [newCommentCount, setNewCommentCount] = useState(0);

    useEffect(() => {
        const echo = getEcho();
        if (!echo || !contentId) return;

        const channelName = `comments.${contentType}.${contentId}`;
        const channel = echo.channel(channelName);

        channel.listen('.comment.posted', (data: Comment) => {
            console.log('💬 New comment:', data.content.substring(0, 50));

            setComments(prev => {
                // Avoid duplicates
                if (prev.some(c => c.id === data.id)) return prev;

                // If it's a reply, we might want to handle it differently
                // For now, just add to the end
                return [...prev, data];
            });

            setNewCommentCount(prev => prev + 1);
        });

        return () => {
            echo.leaveChannel(channelName);
        };
    }, [contentType, contentId]);

    const addOptimisticComment = useCallback((comment: Comment) => {
        setComments(prev => [...prev, comment]);
    }, []);

    const clearNewCount = useCallback(() => {
        setNewCommentCount(0);
    }, []);

    return { comments, newCommentCount, clearNewCount, addOptimisticComment, setComments };
}
