import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import FeedClient from "@/components/editorial/FeedClient";

/**
 * The feed lives at /latest rather than /feed: /feed is rewritten to the RSS
 * feed, and a page here would win over that rewrite and quietly serve HTML to
 * anything subscribed to it.
 */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/latest', {
        title: "The Feed",
        description: "Everything TechPlay publishes in one stream — news, reviews, hardware and guides as they land.",
    });
}

export default function LatestPage() {
    return <FeedClient />;
}
