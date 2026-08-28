
import SectionHub from "@/components/editorial/SectionHub";
import { generatePageMetadata } from "@/lib/seo";
import { getServerApiUrl, serverHeaders } from "@/lib/api";
import { Metadata } from "next";

// Revalidate every 10 minutes
export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
    // As with /news: no page_seo row and no defaults meant this went out as
    // "TechPlay | TechPlay".
    return generatePageMetadata('/reviews', {
        title: "Game Reviews",
        description: "Scored reviews of new games — what works, what does not, and whether it is worth your evening.",
        keywords: ["game reviews", "video game reviews", "review scores"],
    });
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
