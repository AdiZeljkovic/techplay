import type { Metadata } from "next";
import Gw2Hero from "@/components/gw2/Gw2Hero";
import AccountClient from "@/components/gw2/AccountClient";
import { HERO_ART } from "@/lib/gw2domain";

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
        <div className="tp-page">
            <Gw2Hero
                title="Your account"
                description="What you own and what came with it, your legendaries, your collections and the trading post counter — from your last read."
                art={HERO_ART.account}
            />

            <AccountClient />
        </div>
    );
}
