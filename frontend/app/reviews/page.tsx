
import SectionHub from "@/components/editorial/SectionHub";
import { generateDynamicMetadata } from "@/lib/seo";
import { getServerApiUrl, serverHeaders } from "@/lib/api";
import { Metadata } from "next";

// Revalidate every 10 minutes
export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
    return generateDynamicMetadata('/reviews');
}

async function getInitialReviews() {
    try {
        const res = await fetch(`${getServerApiUrl()}/reviews?page=1`, {
            next: { revalidate: 600, tags: ['reviews'] },
            headers: serverHeaders(),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export default async function ReviewsPage() {
    const initialData = await getInitialReviews();

    return <SectionHub section="reviews" initialData={initialData} />;
}
