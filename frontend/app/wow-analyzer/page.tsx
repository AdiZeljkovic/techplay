import { Metadata } from "next";
import WowAnalyzerClient from "@/components/wow/WowAnalyzerClient";

export const metadata: Metadata = {
    title: "WoW Character Analyzer - Midnight Expansion Readiness | TechPlay",
    description: "Analyze your World of Warcraft character for The War Within: Midnight expansion. Get AI-powered recommendations and readiness score from Profesor Buffy.",
    keywords: ["World of Warcraft", "WoW", "Midnight", "Character Analyzer", "Achievement Hunter", "Blizzard"],
    openGraph: {
        title: "WoW Character Analyzer - Midnight Readiness",
        description: "Discover your readiness for The War Within: Midnight expansion with AI-powered analysis",
        type: "website",
    },
};

export default function WowAnalyzerPage() {
    return <WowAnalyzerClient />;
}
