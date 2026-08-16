/**
 * Returns the API base URL.
 * On server-side (SSR/ISR), uses NEXT_PRIVATE_API_URL (direct Octane connection)
 * to bypass Cloudflare and avoid Bot Fight Mode blocking Node.js requests.
 * On client-side, uses NEXT_PUBLIC_API_URL as normal.
 */
export function getApiUrl(): string {
    if (typeof window === 'undefined' && process.env.NEXT_PRIVATE_API_URL) {
        return process.env.NEXT_PRIVATE_API_URL;
    }
    let url = process.env.NEXT_PUBLIC_API_URL ?? '';
    if (url.includes('localhost')) {
        url = url.replace('localhost', '127.0.0.1');
    }
    return url;
}

/**
 * Returns the API URL for server-side (SSR/ISR) requests.
 * Uses NEXT_PRIVATE_API_URL when set to bypass Cloudflare and call Octane directly,
 * preventing Bot Fight Mode from blocking Node.js server requests.
 */
/**
 * Headers every server-side call to our own API should carry.
 *
 * The backend meters `api` at 60 requests a minute keyed on the caller's IP —
 * verified against production: sixty 200s, then ten 429s. Every server render
 * leaves this process from one address, so without the shared secret the whole
 * site renders out of a single visitor's budget, and a crawler walking the
 * game catalogue would exhaust it in seconds.
 *
 * fetchContent() has carried this since it was written, and its comment says
 * exactly why. It was the only caller that did: 61 of the 63 server-side fetch
 * sites went without.
 *
 * Server only. INTERNAL_API_TOKEN has no NEXT_PUBLIC_ prefix, so it is
 * undefined in the browser and this quietly degrades to a plain Accept header.
 */
export function serverHeaders(extra?: HeadersInit): HeadersInit {
    return {
        Accept: "application/json",
        ...(process.env.INTERNAL_API_TOKEN
            ? { "X-Internal-Token": process.env.INTERNAL_API_TOKEN }
            : {}),
        ...extra,
    };
}

export function getServerApiUrl(): string {
    if (process.env.NEXT_PRIVATE_API_URL) {
        return process.env.NEXT_PRIVATE_API_URL;
    }
    return getApiUrl();
}
