import { Metadata } from "next";
import { Suspense } from "react";
import { generatePageMetadata } from "@/lib/seo";
import GamesClientPage from "@/components/games/GamesClientPage";

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/games', {
        title: "All Games",
        description: "Discover the latest games, reviews, and release dates on TechPlay.",
    });
}

// Force dynamic rendering — filters live in URL search params
export const dynamic = 'force-dynamic';

export default function GamesPage() {
    return (
        <Suspense>
            <GamesClientPage />
        </Suspense>
    );
}
