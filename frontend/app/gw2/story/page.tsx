import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import Container from "@/components/ui/Container";
import PageHero from "@/components/ui/PageHero";
import StoryClient from "@/components/gw2/StoryClient";

export const metadata: Metadata = {
    title: "Guild Wars 2 Story Progress",
    description:
        "Which story chapters we can detect on each of your Guild Wars 2 characters — per character, because that is how the game records it.",
    keywords: ["gw2 story progress", "guild wars 2 personal story tracker", "gw2 living world progress"],
    // Somebody's own account. Nothing here renders for a signed-out crawler.
    robots: { index: false, follow: true },
    alternates: { canonical: "/gw2/story" },
};

export default function Gw2StoryPage() {
    return (
        <div className="tp-page min-h-screen bg-[var(--surface-0)]">
            <PageHero
                title="Story"
                description="What we can detect on one character at a time. The game records story per character, so this is never a verdict on your account."
                iconNode={<BookOpen size={22} aria-hidden />}
            />

            <Container className="py-8">
                <nav className="mb-6 text-sm">
                    <Link href="/gw2" className="text-[var(--accent-ink)] hover:underline">
                        ← Back to the advisor
                    </Link>
                </nav>

                <StoryClient />
            </Container>
        </div>
    );
}
