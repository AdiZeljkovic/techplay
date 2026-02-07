import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import RoadmapClient from "./RoadmapClient";

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/roadmap', {
        title: "Roadmap",
        description: "See what's coming next for TechPlay — planned features, improvements, and milestones.",
    });
}

export default function RoadmapPage() {
    return <RoadmapClient />;
}
