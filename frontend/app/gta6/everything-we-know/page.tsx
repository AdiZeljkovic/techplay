import { Metadata } from "next";
import Link from "next/link";
import { generatePageMetadata } from "@/lib/seo";
import Gta6Countdown from "@/components/gta6/Gta6Countdown";
import Gta6SectionHero from "@/components/gta6/Gta6SectionHero";
import {
    Calendar, MapPin, Users, Gamepad2, Clapperboard, Tag,
    BookOpen, Map as MapIcon, ChevronRight,
} from "lucide-react";

export const revalidate = 86400;

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg";

export async function generateMetadata(): Promise<Metadata> {
    const base = await generatePageMetadata("/gta6/everything-we-know", {
        title: "GTA 6: Everything We Know (Updated 2026) — Release Date, Map, Story & Cast",
        description:
            "Complete GTA 6 guide with every confirmed detail: November 19 2026 release date, Vice City & Leonida setting, protagonists Jason & Lucia, platforms, trailers, story, map and vehicle reveals. Updated weekly.",
        keywords: ["GTA 6 everything we know", "GTA 6 confirmed details", "GTA 6", "Grand Theft Auto VI", "GTA 6 release date", "Vice City", "Leonida", "Jason Duval", "Lucia Caminos"],
    });
    return {
        ...base,
        openGraph: {
            title: "GTA 6: Everything We Know (Updated 2026)",
            description: "Complete GTA 6 guide: release date, Vice City & Leonida setting, protagonists Jason & Lucia, platforms, story and every confirmed detail.",
            url: `${SITE_URL}/gta6/everything-we-know`,
            siteName: "TechPlay",
            type: "article",
            images: [{ url: `${SITE_URL}/gta6/og-everything-we-know.png`, width: 1200, height: 630 }],
        },
        alternates: { canonical: `${SITE_URL}/gta6/everything-we-know` },
    };
}

// Curated, editorial facts (original wording). UNKNOWN where not officially confirmed.
const FACTS: { icon: typeof Calendar; label: string; value: string }[] = [
    { icon: Calendar,    label: "Release date", value: "November 19, 2026 (officially confirmed by Rockstar)" },
    { icon: Gamepad2,    label: "Platforms",    value: "PlayStation 5 and Xbox Series X|S at launch. PC version not yet confirmed." },
    { icon: MapPin,      label: "Setting",      value: "The state of Leonida — a modern-day reimagining of Florida, centered on Vice City." },
    { icon: Users,       label: "Protagonists", value: "Jason Duval and Lucia Caminos — the series' first playable female lead, in a Bonnie-and-Clyde-style story." },
    { icon: Clapperboard,label: "Trailers",     value: "Two official trailers released so far, revealing Vice City, the Keys and a large cast." },
    { icon: Tag,         label: "Price",        value: "Not yet announced. Editions and pricing expected closer to launch." },
];

const FAQ: { q: string; a: string }[] = [
    {
        q: "When is GTA 6 coming out?",
        a: "Grand Theft Auto VI is confirmed for release on November 19, 2026 on PlayStation 5 and Xbox Series X|S.",
    },
    {
        q: "Where is GTA 6 set?",
        a: "GTA 6 is set in the fictional state of Leonida, based on Florida. The main city is Vice City, a reimagining of Miami, alongside surrounding keys, swamps and rural areas.",
    },
    {
        q: "Who are the GTA 6 protagonists?",
        a: "The game features two playable protagonists: Jason Duval and Lucia Caminos. Lucia is the first female lead in the series' history, and the two share a criminal partnership at the heart of the story.",
    },
    {
        q: "Will GTA 6 come to PC?",
        a: "Rockstar has only confirmed PlayStation 5 and Xbox Series X|S so far. A PC release has historically followed console launches for previous GTA titles, but nothing official has been announced for GTA 6.",
    },
    {
        q: "How big is the GTA 6 map?",
        a: "Rockstar has not released official map measurements. Based on trailers and community analysis, Leonida is expected to be the largest GTA world yet, spanning Vice City and multiple surrounding regions. Explore known locations on our interactive map.",
    },
    {
        q: "How much will GTA 6 cost?",
        a: "Pricing and special editions have not been announced. We'll update this guide as soon as Rockstar confirms details.",
    },
];

export default function Gta6EverythingWeKnowPage() {
    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": FAQ.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": { "@type": "Answer", "text": f.a },
        })),
    };

    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
            { "@type": "ListItem", "position": 2, "name": "GTA 6 Hub", "item": `${SITE_URL}/gta6` },
            { "@type": "ListItem", "position": 3, "name": "Everything We Know", "item": `${SITE_URL}/gta6/everything-we-know` },
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

            <div className="min-h-screen bg-[var(--surface-0)]">
                <Gta6SectionHero
                    icon={BookOpen}
                    title="GTA 6: Everything We Know"
                    subtitle="Every officially confirmed detail about Grand Theft Auto VI — gathered, verified and updated as Rockstar reveals more."
                    breadcrumb="Everything We Know"
                    badge="The Complete Guide"
                    image="/gta6/card-everything.webp"
                >
                    <Gta6Countdown />
                </Gta6SectionHero>

                <div className="max-w-[920px] mx-auto px-4 xl:px-8 py-12">
                    {/* Quick facts */}
                    <h2 className="font-display text-[24px] font-black text-white mb-5">The essentials</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
                        {FACTS.map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-start gap-3 bg-[var(--surface-1)] border border-white/[0.07] rounded-[var(--radius-card)] p-4">
                                <div className="w-9 h-9 rounded-[var(--radius-card)] bg-[var(--gta-pink)]/10 border border-[var(--gta-pink)]/25 flex items-center justify-center shrink-0">
                                    <Icon className="w-4.5 h-4.5 text-[var(--gta-pink)]" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-1">{label}</p>
                                    <p className="text-[13px] text-[#D4D4D8] leading-relaxed">{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Narrative sections */}
                    <div className="space-y-10">
                        <section>
                            <h2 className="font-display text-[22px] font-black text-white mb-3">The setting: Vice City & Leonida</h2>
                            <p className="text-white/45 text-[15px] leading-relaxed">
                                GTA 6 returns to Vice City, Rockstar&apos;s take on Miami, for the first time since 2002. This time the city
                                sits within the wider state of Leonida — a sun-soaked, neon-lit reimagining of Florida packed with beaches,
                                swamps, keys and sprawling suburbs. Explore every known landmark on our{" "}
                                <Link href="/gta6/map" className="text-[var(--gta-pink)] hover:underline">interactive map</Link>.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-display text-[22px] font-black text-white mb-3">The protagonists: Jason & Lucia</h2>
                            <p className="text-white/45 text-[15px] leading-relaxed">
                                For the first time in the series, GTA 6 stars a dual protagonist duo where one is a woman. Jason Duval and
                                Lucia Caminos are bound together in a relationship and a life of crime, in what Rockstar frames as a modern
                                Bonnie-and-Clyde story. Meet the wider cast on our{" "}
                                <Link href="/gta6/characters" className="text-[var(--gta-pink)] hover:underline">characters page</Link>.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-display text-[22px] font-black text-white mb-3">Story & what to expect</h2>
                            <p className="text-white/45 text-[15px] leading-relaxed">
                                The trailers tease a story driven by ambition, money and the bond between Jason and Lucia. Expect Rockstar&apos;s
                                signature open world packed with vehicles, weapons, activities and a living world that reacts to you.
                                Browse confirmed{" "}
                                <Link href="/gta6/vehicles" className="text-[var(--gta-pink)] hover:underline">vehicles</Link> and{" "}
                                <Link href="/gta6/weapons" className="text-[var(--gta-pink)] hover:underline">weapons</Link> as they&apos;re revealed.
                            </p>
                        </section>
                    </div>

                    {/* FAQ */}
                    <div className="mt-14">
                        <h2 className="font-display text-[24px] font-black text-white mb-5">Frequently asked questions</h2>
                        <div className="space-y-2.5">
                            {FAQ.map((f, i) => (
                                <details key={i} className="group bg-[var(--surface-1)] border border-white/[0.07] rounded-[var(--radius-card)] overflow-hidden">
                                    <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none text-[15px] font-bold text-white hover:text-[var(--gta-pink)] transition-colors">
                                        {f.q}
                                        <ChevronRight className="w-4 h-4 shrink-0 text-white/35 group-open:rotate-90 transition-transform" />
                                    </summary>
                                    <div className="px-5 pb-4 -mt-1 text-[14px] text-white/45 leading-relaxed">
                                        {f.a}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-14 flex flex-wrap gap-3">
                        <Link href="/gta6/map" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-card)] bg-[var(--gta-pink)] text-white text-[14px] font-bold hover:bg-[#ff1a7a] transition-colors">
                            <MapIcon className="w-4 h-4" /> Explore the Map
                        </Link>
                        <Link href="/gta6" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-white/[0.07] text-white text-[14px] font-bold hover:border-[var(--gta-pink)]/40 transition-colors">
                            Back to GTA 6 Hub
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
