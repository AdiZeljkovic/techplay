import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import RatingSystemClient from "./RatingSystemClient";

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/rating-system', {
        title: "Rating System",
        description: "How TechPlay rates games and hardware — our scoring criteria explained.",
    });
}

export default function RatingSystemPage() {
    return <RatingSystemClient />;
}
