import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import AboutClient from "./AboutClient";

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/about', {
        title: "About Us",
        description: "TechPlay keeps a record of your gaming — a library that fills itself from what you play — with a 141,000-game catalogue, reviews and hardware coverage around it. Publishing since 2020.",
    });
}

export default function AboutPage() {
    return <AboutClient />;
}
