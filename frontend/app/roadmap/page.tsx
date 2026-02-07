import { Metadata } from "next";
import RoadmapClient from "./RoadmapClient";

export const metadata: Metadata = {
    title: "Roadmap",
    description: "See what's coming next for TechPlay — planned features, improvements, and milestones.",
};

export default function RoadmapPage() {
    return <RoadmapClient />;
}
