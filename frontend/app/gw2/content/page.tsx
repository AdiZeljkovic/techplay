import type { Metadata } from "next";
import Link from "next/link";
import { Swords } from "lucide-react";
import Container from "@/components/ui/Container";
import PageHero from "@/components/ui/PageHero";
import ContentClient from "@/components/gw2/ContentClient";

export const metadata: Metadata = {
    title: "Guild Wars 2 Raid, Dungeon and World Boss Tracker",
    description:
        "Which raid encounters you have cleared this week, which world bosses and dungeon paths you have done today, and — from the day you connected — what you have done since.",
    keywords: [
        "gw2 raid tracker",
        "guild wars 2 weekly raid clears",
        "gw2 world boss tracker",
        "gw2 dungeon paths today",
    ],
    // Somebody's own account. Nothing here renders for a signed-out crawler.
    robots: { index: false, follow: true },
    alternates: { canonical: "/gw2/content" },
};

export default function Gw2ContentPage() {
    return (
        <div className="tp-page min-h-screen bg-[var(--surface-0)]">
            <PageHero
                title="Raids, bosses and dungeons"
                description="The game remembers this week and today. Everything longer than that, we remember for you — from the day you connected."
                iconNode={<Swords size={22} aria-hidden />}
            />

            <Container className="py-8">
                <nav className="mb-6 text-sm">
                    <Link href="/gw2" className="text-[var(--accent-ink)] hover:underline">
                        ← Back to the advisor
                    </Link>
                </nav>

                <ContentClient />
            </Container>
        </div>
    );
}
