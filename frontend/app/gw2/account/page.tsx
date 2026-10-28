import type { Metadata } from "next";
import Link from "next/link";
import { UserRound } from "lucide-react";
import Container from "@/components/ui/Container";
import PageHero from "@/components/ui/PageHero";
import AccountClient from "@/components/gw2/AccountClient";

export const metadata: Metadata = {
    title: "Your Guild Wars 2 account — ownership, armory, collections",
    description:
        "What your Guild Wars 2 account owns and what came with it, your legendary armory, collections and what is waiting at the trading post.",
    // Somebody's own account. Nothing here renders for a signed-out crawler.
    robots: { index: false, follow: true },
    alternates: { canonical: "/gw2/account" },
};

export default function Gw2AccountPage() {
    return (
        <div className="tp-page min-h-screen bg-[var(--surface-0)]">
            <PageHero
                title="Your account"
                description="What you own and what came with it, your legendaries, your collections and the trading post counter — from your last read."
                iconNode={<UserRound size={22} aria-hidden />}
            />

            <Container className="py-8">
                <nav className="mb-6 text-sm">
                    <Link href="/gw2" className="text-[var(--accent-ink)] hover:underline">
                        ← Back to the advisor
                    </Link>
                </nav>

                <AccountClient />
            </Container>
        </div>
    );
}
