import SectionHub from "@/components/editorial/SectionHub";
import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import { getServerApiUrl, serverHeaders } from "@/lib/api";

// Revalidate every 10 minutes
export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/hardware', {
        title: "Hardware Lab",
        description: "Benchmark-driven reviews. Thermals. Raw performance numbers.",
    });
}

async function getInitialHardware() {
    try {
        const res = await fetch(`${getServerApiUrl()}/tech?page=1`, {
            next: { revalidate: 600, tags: ['hardware'] },
            headers: serverHeaders(),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export default async function HardwarePage() {
    const initialData = await getInitialHardware();

    return <SectionHub section="tech" initialData={initialData} />;
}
