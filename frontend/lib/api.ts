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
