
import ReviewsClient from "./ReviewsClient";
import SeoContent from "@/components/seo/SeoContent";
import { generateDynamicMetadata } from "@/lib/seo";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    return generateDynamicMetadata('/reviews');
}

export default function ReviewsPage() {
    return (
        <>
            <ReviewsClient />
            {/* @ts-expect-error Async Server Component */}
            <SeoContent path="/reviews" />
        </>
    );
}
