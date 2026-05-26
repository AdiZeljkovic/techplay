import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import GuidesClientPage from "@/components/guides/GuidesClientPage";
import { getServerApiUrl } from "@/lib/api";

// Revalidate every 15 minutes
export const revalidate = 900;

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/guides', {
        title: "Gaming Guides & Tutorials",
        description: "Master your favorite games with our in-depth guides, tips, and strategy walkthroughs.",
    });
}

async function getInitialGuides() {
    try {
        const res = await fetch(`${getServerApiUrl()}/guides?page=1`, {
            next: { revalidate: 900, tags: ['guides'] },
            headers: { 'Accept': 'application/json' },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export default async function GuidesPage() {
    const initialData = await getInitialGuides();

    return <GuidesClientPage initialData={initialData} />;
}
