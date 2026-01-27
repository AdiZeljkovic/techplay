
import ImpressumClient from "./ImpressumClient";

async function getStaffData() {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    // Ensure we don't double the prefix if it's already there
    const url = baseUrl.endsWith('/api/v1')
        ? `${baseUrl}/staff`
        : `${baseUrl}/api/v1/staff`;

    console.log('[Impressum] Fetching staff from:', url);

    try {
        const res = await fetch(url, { cache: 'no-store' });
        console.log('[Impressum] Staff API response status:', res.status);
        if (!res.ok) {
            console.error('[Impressum] Staff API error - status:', res.status);
            return null;
        }
        const data = await res.json();
        console.log('[Impressum] Staff data received:', JSON.stringify(data).substring(0, 200));
        return data;
    } catch (error) {
        console.error("[Impressum] Failed to fetch staff:", error);
        return null;
    }
}

export const dynamic = 'force-dynamic';

export default async function ImpressumPage() {
    const staff = await getStaffData();

    return <ImpressumClient staff={staff} />;
}
