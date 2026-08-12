import type { Metadata } from "next";
import Image from "next/image";
import { Castle, Users, Globe, Swords } from "lucide-react";
import FrontiersClient from "./FrontiersClient";

export const metadata: Metadata = {
    title: "Frontiers",
    description:
        "A new MMO strategy of clans, territory and resources. Build your base, unite your clan, take the map — TechPlay Frontiers.",
    alternates: { canonical: "https://techplay.gg/frontiers" },
    openGraph: {
        title: "TechPlay Frontiers — Build. Unite. Conquer.",
        description: "A new MMO strategy of clans, territory and resources. Your story. Your clan. Your map.",
        url: "https://techplay.gg/frontiers",
        type: "website",
        siteName: "TechPlay",
        images: [{ url: "https://techplay.gg/images/frontiers/frontiers-hero.webp", width: 1672, height: 941, alt: "TechPlay Frontiers" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "TechPlay Frontiers — Build. Unite. Conquer.",
        description: "A new MMO strategy of clans, territory and resources.",
        images: ["https://techplay.gg/images/frontiers/frontiers-hero.webp"],
    },
};

/**
 * The four promises, in the order the pitch makes them: you build, you gather
 * people, you take ground, and then you have something worth fighting over.
 */
const PILLARS = [
    {
        icon: Castle,
        title: "Build your base",
        body: "Grow your base, research technology and harden your defences.",
    },
    {
        icon: Users,
        title: "Unite your clan",
        body: "Recruit players, plan together and hold territory.",
    },
    {
        icon: Globe,
        title: "Take the map",
        body: "Fight over resources, raid your rivals and widen your reach.",
    },
    {
        icon: Swords,
        title: "Clan wars",
        body: "Full wars between clans. Only the best are left standing.",
    },
];

/**
 * The war-room ground.
 *
 * The art carries the right half — the map, the compass, the dog tags — and
 * leaves the left dark on purpose, which is where the type goes. Two scrims on
 * top of it: one across the left so the lockup holds its contrast at any width,
 * and one at the foot, which is what the pillar strip sits on.
 *
 * A background layer rather than an <img>: the photo is the section's ground,
 * not its content, and nothing here should be announced to a screen reader.
 */
const GROUND: React.CSSProperties = {
    backgroundImage: [
        "linear-gradient(96deg, #05070A 0%, rgba(5,7,10,0.94) 26%, rgba(5,7,10,0.72) 42%, rgba(5,7,10,0.18) 62%, transparent 78%)",
        "url('/images/frontiers/frontiers-hero.webp')",
    ].join(", "),
    backgroundSize: "cover, cover",
    backgroundPosition: "center, center right",
    backgroundRepeat: "no-repeat, no-repeat",
    backgroundColor: "#05070A",
};

export default function FrontiersPage() {
    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            <section
                className="relative overflow-hidden border-b border-white/[0.07] min-h-[680px] lg:min-h-[92vh] flex flex-col justify-center"
                style={GROUND}
            >
                <div className="relative z-10 w-full container-page pt-14 pb-[210px] lg:pt-16 lg:pb-[190px]">
                    <div className="lg:max-w-[560px]">
                        {/* ── the lockup ──
                            The mark is drawn art, not type: the distressed cut,
                            the flourishes and the winged star are the identity,
                            and nothing set in Archivo would be that. It carries
                            the h1 so the page still has one heading. */}
                        <h1 className="m-0">
                            <Image
                                src="/images/frontiers/frontiers-logo.webp"
                                alt="TechPlay Frontiers"
                                width={1040}
                                height={544}
                                priority
                                sizes="(max-width: 640px) 92vw, 520px"
                                className="w-full max-w-[460px] lg:max-w-[520px] h-auto"
                            />
                        </h1>

                        {/* ── the promise, inside drawn corner ticks ── */}
                        <p className="relative mt-5 inline-block px-5 py-2.5 font-display text-[13px] sm:text-[15px] font-black uppercase tracking-[0.26em] text-white">
                            {([
                                "top-0 left-0 border-t-2 border-l-2",
                                "top-0 right-0 border-t-2 border-r-2",
                                "bottom-0 left-0 border-b-2 border-l-2",
                                "bottom-0 right-0 border-b-2 border-r-2",
                            ] as const).map((corner) => (
                                <span key={corner} aria-hidden className={`absolute w-2.5 h-2.5 border-[var(--accent)] ${corner}`} />
                            ))}
                            Build. Unite. Conquer.
                        </p>

                        <p className="mt-5 max-w-[430px] text-[13.5px] leading-relaxed text-white/55">
                            A new MMO strategy of clans, territory and resources.
                            <br />
                            Your story. Your clan. Your map.
                        </p>

                        {/* countdown, CTA and the notify form all live client-side */}
                        <FrontiersClient />

                        <p className="mt-7 max-w-[430px] text-[11.5px] leading-relaxed text-white/25">
                            Frontiers is in development. This page is the announcement — the date and the details
                            can still move while it is being built.
                        </p>
                    </div>
                </div>

                {/* ── the four pillars, on the art rather than under it ──
                    They belong to the pitch, so they sit inside the same frame
                    the map does, on a scrim dark enough to read against it. */}
                <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#05070A] via-[#05070A]/94 to-transparent pt-16 pb-6">
                    <div className="container-page">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5 border-t border-white/[0.09] pt-5">
                            {PILLARS.map(({ icon: Icon, title, body }, i) => (
                                <div
                                    key={title}
                                    className={`flex items-start gap-3 ${i > 0 ? "lg:pl-6 lg:border-l lg:border-white/[0.07]" : ""}`}
                                >
                                    <Icon className="w-6 h-6 shrink-0 mt-0.5 text-[var(--accent)]" strokeWidth={1.5} />
                                    <span className="min-w-0">
                                        <span className="block font-display text-[12.5px] font-black uppercase tracking-[0.1em] text-white">
                                            {title}
                                        </span>
                                        <span className="mt-1 block text-[11.5px] leading-snug text-white/45">{body}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
