"use client";

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Pusher available globally for Echo
if (typeof window !== 'undefined') {
    (window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;
}

let echoInstance: Echo<'reverb'> | null = null;
let echoToken: string | null = null;

/**
 * `broadcasting/auth` lives at the application root, not under the API
 * version prefix — Broadcast::routes() registers it there.
 */
function authEndpoint(): string {
    const api = process.env.NEXT_PUBLIC_API_URL || '';
    return `${api.replace(/\/api\/v1\/?$/, '')}/broadcasting/auth`;
}

export function getEcho(): Echo<'reverb'> | null {
    if (typeof window === 'undefined') {
        return null; // SSR guard
    }

    const token = localStorage.getItem('token');

    // The bearer used to be captured once, at first construction. A visitor
    // who browsed signed-out and then logged in kept an empty token forever,
    // and every private subscription was refused. Rebuild when it changes.
    if (echoInstance && echoToken !== token) {
        disconnectEcho();
    }

    if (!echoInstance) {
        const key = process.env.NEXT_PUBLIC_REVERB_APP_KEY;
        const host = process.env.NEXT_PUBLIC_REVERB_HOST;
        const port = process.env.NEXT_PUBLIC_REVERB_PORT;
        const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || 'https';

        if (!key || !host) {
            return null;
        }

        echoToken = token;
        echoInstance = new Echo({
            broadcaster: 'reverb',
            key: key,
            wsHost: host,
            wsPort: port ? parseInt(port, 10) : 443,
            wssPort: port ? parseInt(port, 10) : 443,
            forceTLS: scheme === 'https',
            enabledTransports: ['ws', 'wss'],
            authEndpoint: authEndpoint(),
            auth: {
                headers: {
                    Authorization: `Bearer ${token || ''}`,
                },
            },
        });
    }

    return echoInstance;
}

/** Called on logout, so the socket does not keep the old identity. */
export function disconnectEcho(): void {
    try {
        echoInstance?.disconnect();
    } catch {
        // a socket that is already gone is not a problem
    }
    echoInstance = null;
    echoToken = null;
}

// Convenience hook for components
export function useEcho() {
    return getEcho();
}
