import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import AboutClient from "./AboutClient";

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/about', {
        title: "About Us",
        description: "Built by gamers, for gamers. Learn about TechPlay — honest gaming and tech coverage since 2020.",
    });
}

export default function AboutPage() {
    return <AboutClient />;
}
