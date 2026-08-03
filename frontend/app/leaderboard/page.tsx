import type { Metadata } from "next";
import LeaderboardClient from "./LeaderboardClient";

export const metadata: Metadata = {
    title: "Leaderboard — TechPlay",
    description:
        "Compete. Climb. Be the legend. The TechPlay leaderboards rank players by XP, reputation, collection size, completions, reviews and achievements.",
    openGraph: {
        title: "TechPlay Leaderboard",
        description: "Compete. Climb. Be the legend.",
    },
};

export default function LeaderboardPage() {
    return <LeaderboardClient />;
}
