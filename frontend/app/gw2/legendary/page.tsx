import type { Metadata } from "next";
import Link from "next/link";
import { Gem } from "lucide-react";
import Container from "@/components/ui/Container";
import PageHero from "@/components/ui/PageHero";
import LegendaryClient from "@/components/gw2/LegendaryClient";

export const metadata: Metadata = {
    title: "Guild Wars 2 legendary planner",
    description:
        "Every Guild Wars 2 legendary, what your armory already holds, and a plan for the ones whose recipe we have checked — counted against your bank and wallet.",
    // Somebody's own account. Nothing here renders for a signed-out crawler.
    robots: { index: false, follow: true },
    alternates: { canonical: "/gw2/legendary" },
};

export default function Gw2LegendaryPage() {
    return (
        <div className="tp-page min-h-screen bg-[var(--surface-0)]">
            <PageHero
                title="Legendaries"
                description="What your armory holds, and a plan for each legendary whose recipe we have checked — against your bank and your wallet."
                iconNode={<Gem size={22} aria-hidden />}
            />

            <Container className="py-8">
                <nav className="mb-6 text-sm">
                    <Link href="/gw2" className="text-[var(--accent-ink)] hover:underline">
                        ← Back to the advisor
                    </Link>
                </nav>

                <LegendaryClient />
            </Container>
        </div>
    );
}
