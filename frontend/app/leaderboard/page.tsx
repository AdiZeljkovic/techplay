import type { Metadata } from "next";
import LeaderboardClient from "./LeaderboardClient";
import { generatePageMetadata } from "@/lib/seo";

/*
 * Through the shared builder for the canonical (see /calendar), but the share
 * card keeps its own wording — the builder would otherwise reuse the page
 * title, and "Leaderboard" alone says nothing on a card.
 */
export async function generateMetadata(): Promise<Metadata> {
    const base = await generatePageMetadata("/leaderboard", {
        title: "Leaderboard",
        description:
            "Compete. Climb. Be the legend. The TechPlay leaderboards rank players by XP, reputation, collection size, completions, reviews and achievements.",
    });

    return {
        ...base,
        openGraph: {
            ...base.openGraph,
            title: "TechPlay Leaderboard",
            description: "Compete. Climb. Be the legend.",
        },
    };
}

export default function LeaderboardPage() {
    return <LeaderboardClient />;
}
