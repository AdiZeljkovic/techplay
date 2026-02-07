import { Metadata } from "next";
import GuidesClientPage from "@/components/guides/GuidesClientPage";

// Revalidate every 15 minutes
export const revalidate = 900;

export const metadata: Metadata = {
    title: "Gaming Guides & Tutorials",
    description: "Master your favorite games with our in-depth guides, tips, and strategy walkthroughs.",
};

async function getInitialGuides() {
    let apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl && apiUrl.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '127.0.0.1');
    }

    try {
        const res = await fetch(`${apiUrl}/guides?page=1`, {
            next: { revalidate: 900 },
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
