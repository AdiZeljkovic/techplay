
import ImpressumClient from "./ImpressumClient";

async function getStaffData() {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    // Ensure we don't double the prefix if it's already there
    const url = baseUrl.endsWith('/api/v1')
        ? `${baseUrl}/staff`
        : `${baseUrl}/api/v1/staff`;

    try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error("Failed to fetch staff:", error);
        return null;
    }
}

export const dynamic = 'force-dynamic';

export default async function ImpressumPage() {
    const staff = await getStaffData();

    return <ImpressumClient staff={staff} />;
}
