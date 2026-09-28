import type { Metadata } from "next";
import Link from "next/link";
import { Target } from "lucide-react";
import Container from "@/components/ui/Container";
import PageHero from "@/components/ui/PageHero";
import GoalsClient from "@/components/gw2/GoalsClient";

export const metadata: Metadata = {
    title: "Guild Wars 2 Crafting Planner — What You Still Need",
    description:
        "Pick anything craftable in Guild Wars 2 and see what it actually takes, with everything already in your bank, your material storage and your characters' bags subtracted once.",
    keywords: [
        "gw2 crafting calculator",
        "guild wars 2 crafting planner",
        "gw2 ascended armor materials",
        "gw2 what do i need to craft",
        "gw2 material checklist",
    ],
    // Somebody's own inventory. Nothing here renders for a signed-out crawler.
    robots: { index: false, follow: true },
    alternates: { canonical: "/gw2/goals" },
};

export default function Gw2GoalsPage() {
    return (
        <div className="tp-page min-h-screen bg-[var(--surface-0)]">
            <PageHero
                title="Crafting planner"
                description="Name the thing you want. We count what you already own — bank, material storage, every character's bags — and tell you what is left."
                iconNode={<Target size={22} aria-hidden />}
            />

            <Container className="py-8">
                <nav className="mb-6 text-sm">
                    <Link href="/gw2" className="text-[var(--accent-ink)] hover:underline">
                        ← Back to the advisor
                    </Link>
                </nav>

                <GoalsClient />
            </Container>
        </div>
    );
}
