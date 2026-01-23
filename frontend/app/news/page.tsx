
import NewsClient from "./NewsClient";
import SeoContent from "@/components/seo/SeoContent";
import { generateDynamicMetadata } from "@/lib/seo";
import { Metadata } from "next";

// Revalidate every 5 minutes
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
    return generateDynamicMetadata('/news');
}

export default function NewsPage() {
    return (
        <>
            <NewsClient />
            <SeoContent path="/news" />
        </>
    );
}
