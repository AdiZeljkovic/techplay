import type { Metadata } from "next";
import AdvisorClient from "./AdvisorClient";
import { generatePageMetadata } from "@/lib/seo";

// Through the shared builder so the page gets a canonical; see /calendar.
export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata("/backlog-advisor", {
        title: "Backlog Advisor",
        description:
            "Personalised game recommendations scored against your own collection — the genres you finish, the players who share your shelf, and how good the game actually is.",
    });
}

export default function BacklogAdvisorPage() {
    return <AdvisorClient />;
}
