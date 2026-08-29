'use server';

import { getServerApiUrl, serverHeaders } from '@/lib/api';

/**
 * The one server-side call that went out through the public hostname.
 *
 * Thirty other files reach the backend through `getServerApiUrl()` and
 * `serverHeaders()`; this built its own URL from `NEXT_PUBLIC_API_URL` and sent
 * no internal token. Two things follow from that. The request leaves this
 * machine, crosses Cloudflare and can be met by the bot challenge that the
 * server's own traffic is not supposed to face — and it arrives without the
 * header that exempts server-side rendering from the 60-per-minute limiter, so
 * it competes with visitors for that budget. Either way the reader is told
 * "Failed to send message" and nothing anywhere records why.
 */
export async function submitContactForm(formData: {
    name: string;
    email: string;
    subject: string;
    message: string;
}) {
    try {
        const response = await fetch(`${getServerApiUrl()}/contact`, {
            method: 'POST',
            headers: serverHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, message: data.message || 'Failed to send message.' };
        }

        return { success: true, message: data.message || 'Message sent successfully.' };
    } catch {
        return { success: false, message: 'Failed to send message. Please try again later.' };
    }
}
