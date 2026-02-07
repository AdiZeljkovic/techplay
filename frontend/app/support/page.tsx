import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import SupportClient from "./SupportClient";

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/support', {
        title: "Support TechPlay",
        description: "Help keep TechPlay independent. Support us and get exclusive perks.",
    });
}

export default function SupportPage() {
    return <SupportClient />;
}
