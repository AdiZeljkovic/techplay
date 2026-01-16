"use client";

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Pusher available globally for Echo
if (typeof window !== 'undefined') {
    (window as any).Pusher = Pusher;
}

let echoInstance: Echo<any> | null = null;

export function getEcho(): Echo<any> | null {
    if (typeof window === 'undefined') {
        return null; // SSR guard
    }

    if (!echoInstance) {
        const key = process.env.NEXT_PUBLIC_REVERB_APP_KEY;
        const host = process.env.NEXT_PUBLIC_REVERB_HOST;
        const port = process.env.NEXT_PUBLIC_REVERB_PORT;
        const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || 'https';

        if (!key || !host) {
            console.warn('Reverb not configured. Real-time features disabled.');
            return null;
        }

        echoInstance = new Echo({
            broadcaster: 'reverb',
            key: key,
            wsHost: host,
            wsPort: port ? parseInt(port, 10) : 443,
            wssPort: port ? parseInt(port, 10) : 443,
            forceTLS: scheme === 'https',
            enabledTransports: ['ws', 'wss'],
            authEndpoint: `${process.env.NEXT_PUBLIC_API_URL}/broadcasting/auth`,
            auth: {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
                },
            },
        });

        console.log('✅ Laravel Echo connected to Reverb');
    }

    return echoInstance;
}

// Convenience hook for components
export function useEcho() {
    return getEcho();
}
