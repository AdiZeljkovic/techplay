import type { Metadata } from "next";
import AdvisorClient from "./AdvisorClient";

export const metadata: Metadata = {
    title: "Backlog Advisor",
    description:
        "Personalised game recommendations scored against your own collection — the genres you finish, the players who share your shelf, and how good the game actually is.",
};

export default function BacklogAdvisorPage() {
    return <AdvisorClient />;
}
