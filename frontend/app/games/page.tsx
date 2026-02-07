import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import GamesClientPage from "@/components/games/GamesClientPage";

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/games', {
        title: "All Games",
        description: "Discover the latest games, reviews, and release dates on TechPlay.",
    });
}

// Force dynamic rendering if we use search params later
export const dynamic = 'force-dynamic';

export default function GamesPage() {
    return <GamesClientPage />;
}
