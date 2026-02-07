import HardwareClient from "./HardwareClient";
import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";

// Revalidate every 10 minutes
export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/hardware', {
        title: "Hardware Lab",
        description: "Benchmark-driven reviews. Thermals. Raw performance numbers.",
    });
}

async function getInitialHardware() {
    let apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl && apiUrl.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '127.0.0.1');
    }

    try {
        const res = await fetch(`${apiUrl}/tech?page=1`, {
            next: { revalidate: 600 },
            headers: { 'Accept': 'application/json' },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export default async function HardwarePage() {
    const initialData = await getInitialHardware();

    return <HardwareClient initialData={initialData} />;
}
