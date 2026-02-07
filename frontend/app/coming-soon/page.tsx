import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import ComingSoonClient from "./ComingSoonClient";

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/coming-soon', {
        title: "Coming Soon",
        description: "This feature is coming soon to TechPlay. Stay tuned!",
    });
}

export default function ComingSoonPage() {
    return <ComingSoonClient />;
}
