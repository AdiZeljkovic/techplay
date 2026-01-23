
import ReviewsClient from "./ReviewsClient";
import SeoContent from "@/components/seo/SeoContent";
import { generateDynamicMetadata } from "@/lib/seo";
import { Metadata } from "next";

// Revalidate every 10 minutes
export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
    return generateDynamicMetadata('/reviews');
}

export default function ReviewsPage() {
    return (
        <>
            <ReviewsClient />
            <SeoContent path="/reviews" />
        </>
    );
}
