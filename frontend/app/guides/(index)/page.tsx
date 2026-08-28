import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import SectionHub from "@/components/editorial/SectionHub";
import { getServerApiUrl, serverHeaders } from "@/lib/api";

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
            headers: serverHeaders(),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export default async function GuidesPage() {
    const initialData = await getInitialGuides();

    return <SectionHub section="guides" initialData={initialData} />;
}
