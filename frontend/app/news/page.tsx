
import NewsClient from "./NewsClient";
import SeoContent from "@/components/seo/SeoContent";
import { generateDynamicMetadata } from "@/lib/seo";
import { Metadata } from "next";

// Revalidate every 5 minutes
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
    return generateDynamicMetadata('/news');
}

async function getInitialNews() {
    let apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl && apiUrl.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '127.0.0.1');
    }

    try {
        const res = await fetch(`${apiUrl}/news?page=1`, {
            next: { revalidate: 300, tags: ['news'] },
            headers: { 'Accept': 'application/json' },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export default async function NewsPage() {
    const initialData = await getInitialNews();

    return (
        <>
            <NewsClient initialData={initialData} />
            <SeoContent path="/news" />
        </>
    );
}
