
import ReviewsClient from "./ReviewsClient";
import SeoContent from "@/components/seo/SeoContent";
import { generateDynamicMetadata } from "@/lib/seo";
import { Metadata } from "next";

// Revalidate every 10 minutes
export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
    return generateDynamicMetadata('/reviews');
}

async function getInitialReviews() {
    let apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl && apiUrl.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '127.0.0.1');
    }

    try {
        const res = await fetch(`${apiUrl}/reviews?page=1`, {
            next: { revalidate: 600 },
            headers: { 'Accept': 'application/json' },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export default async function ReviewsPage() {
    const initialData = await getInitialReviews();

    return (
        <>
            <ReviewsClient initialData={initialData} />
            <SeoContent path="/reviews" />
        </>
    );
}
