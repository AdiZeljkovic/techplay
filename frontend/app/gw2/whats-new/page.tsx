import type { Metadata } from "next";
import Gw2Hero from "@/components/gw2/Gw2Hero";
import WhatsNewClient from "@/components/gw2/WhatsNewClient";
import { gw2Breadcrumb, jsonLd } from "@/lib/gw2jsonld";
import { HERO_ART } from "@/lib/gw2domain";
import { getPublicChanges } from "@/lib/gw2public";

/**
 * What changed in Guild Wars 2, for somebody coming back.
 *
 * Public and server-rendered — a returning player reads this before they
 * connect anything, and it is the kind of page people search for. Every entry is
 * dated, written in our words, and links the page it came from.
 */

// An hour: the list is editorial and a correction should not wait a day.
export const revalidate = 3600;

export const metadata: Metadata = {
    title: "What changed in Guild Wars 2 — for returning players",
    description:
        "Every change since 2023 that a returning Guild Wars 2 player needs to know, dated and sourced: expansions, the Wizard's Vault, relics, raids, the October 2026 Living World bundling.",
    alternates: { canonical: "/gw2/whats-new" },
};

export default async function WhatsNewPage() {
    const changes = (await getPublicChanges()) ?? [];

    return (
        <div className="tp-page">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: jsonLd(gw2Breadcrumb([{ name: "What changed in Guild Wars 2", path: "/gw2/whats-new" }])),
                }}
            />
            <Gw2Hero
                title="What changed while you were away"
                description="Dated, in plain words, each with the page it came from."
                back={{ href: "/gw2/database", label: "Guild Wars 2 database" }}
                art={HERO_ART.whatsNew}
            />

            <WhatsNewClient initial={changes} />
        </div>
    );
}
