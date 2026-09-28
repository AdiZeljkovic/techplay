import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import Container from "@/components/ui/Container";
import PageHero from "@/components/ui/PageHero";
import TonightClient from "@/components/gw2/TonightClient";

export const metadata: Metadata = {
    title: "Tonight in Guild Wars 2 — A Session Plan for the Time You Have",
    description:
        "Say how long you have and get an ordered session built from what your own account still has outstanding: vault objectives, mastery tiers you can afford, achievements a step from done.",
    keywords: [
        "gw2 what to do tonight",
        "guild wars 2 session plan",
        "gw2 daily routine",
        "gw2 one hour gameplay",
    ],
    // Somebody's own account. Nothing here renders for a signed-out crawler.
    robots: { index: false, follow: true },
    alternates: { canonical: "/gw2/tonight" },
};

export default function Gw2TonightPage() {
    return (
        <div className="tp-page min-h-screen bg-[var(--surface-0)]">
            <PageHero
                title="Tonight in Guild Wars 2"
                description="Nothing new is invented here — this is the advice that already holds, ordered to fit the evening you actually have."
                iconNode={<CalendarClock size={22} aria-hidden />}
            />

            <Container className="py-8">
                <nav className="mb-6 text-sm">
                    <Link href="/gw2" className="text-[var(--accent-ink)] hover:underline">
                        ← Back to the advisor
                    </Link>
                </nav>

                <TonightClient />
            </Container>
        </div>
    );
}
