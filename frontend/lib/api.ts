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
export function getServerApiUrl(): string {
    if (process.env.NEXT_PRIVATE_API_URL) {
        return process.env.NEXT_PRIVATE_API_URL;
    }
    return getApiUrl();
}
