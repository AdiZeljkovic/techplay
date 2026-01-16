"use client";

import { useEffect, useState, useCallback } from 'react';
import { getEcho } from '@/lib/echo';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

interface Notification {
    type: string;
    message: string;
    link: string | null;
    data: Record<string, any> | null;
    timestamp: string;
}

/**
 * Hook for real-time user notifications.
 * Listens to the user's private channel for personal notifications.
 */
export function useRealTimeNotifications() {
    const { user, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const echo = getEcho();
        if (!echo || !isAuthenticated || !user?.id) return;

        const channel = echo.private(`user.${user.id}`);

        channel.listen('.notification.received', (data: Notification) => {
            console.log('🔔 Notification:', data.message);

            // Add to notifications list
            setNotifications(prev => [data, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Show toast notification
            toast(data.message, {
                icon: getNotificationIcon(data.type),
                duration: 5000,
            });
        });

        return () => {
            echo.leaveChannel(`private-user.${user.id}`);
        };
    }, [isAuthenticated, user?.id]);

    const markAllRead = useCallback(() => {
        setUnreadCount(0);
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    return { notifications, unreadCount, markAllRead, clearNotifications };
}

function getNotificationIcon(type: string): string {
    switch (type) {
        case 'comment': return '💬';
        case 'like': return '❤️';
        case 'friend': return '👋';
        case 'order': return '📦';
        case 'mention': return '@';
        default: return '🔔';
    }
}
