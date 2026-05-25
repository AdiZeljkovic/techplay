/**
 * Returns the API base URL, replacing 'localhost' with '127.0.0.1'
 * to avoid IPv6 resolution issues in Node.js server-side requests.
 */
export function getApiUrl(): string {
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
