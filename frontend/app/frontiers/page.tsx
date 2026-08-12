import type { Metadata } from "next";
import { Castle, Users, Globe, Swords } from "lucide-react";
import FrontiersClient from "./FrontiersClient";

export const metadata: Metadata = {
    title: "Frontiers",
    description:
        "Nova MMO strategija za klanove, teritorije i resurse. Izgradi bazu, ujedini klan i osvoji svijet — TechPlay Frontiers.",
    alternates: { canonical: "https://techplay.gg/frontiers" },
    openGraph: {
        title: "TechPlay Frontiers — Izgradi. Ujedini. Osvoji.",
        description: "Nova MMO strategija za klanove, teritorije i resurse. Tvoja priča. Tvoj klan. Tvoja dominacija.",
        url: "https://techplay.gg/frontiers",
        type: "website",
        siteName: "TechPlay",
    },
    twitter: {
        card: "summary_large_image",
        title: "TechPlay Frontiers — Izgradi. Ujedini. Osvoji.",
        description: "Nova MMO strategija za klanove, teritorije i resurse.",
    },
};

/**
 * The four promises, in the order the pitch makes them: you build, you gather
 * people, you take ground, and then you have something worth fighting over.
 */
const PILLARS = [
    {
        icon: Castle,
        title: "Izgradi bazu",
        body: "Razvijaj svoju bazu, istražuj tehnologije i jačaj odbranu.",
    },
    {
        icon: Users,
        title: "Ujedini klan",
        body: "Regrutuj igrače, planiraj zajedno i kontroliši teritorije.",
    },
    {
        icon: Globe,
        title: "Osvoji svijet",
        body: "Bori se za resurse, napadaj neprijatelje i širi utjecaj.",
    },
    {
        icon: Swords,
        title: "Klan ratovi",
        body: "Veliki ratovi između klanova. Samo najbolji ostaju.",
    },
];

/**
 * The war-room ground.
 *
 * The art carries the right half — the map, the compass, the dog tags — and
 * leaves the left dark on purpose, which is where the type goes. Two scrims on
 * top of it: one across the left so the headline holds its contrast at any
 * width, and one at the foot so the section meets the page rather than
 * stopping at a hard edge.
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
            <section className="relative overflow-hidden border-b border-white/[0.07] min-h-[560px] lg:min-h-[86vh] flex items-center" style={GROUND}>
                {/* the section meets the page instead of stopping at an edge */}
                <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--surface-0)] to-transparent" />

                <div className="relative z-10 w-full container-page py-16 lg:py-20">
                    <div className="lg:max-w-[540px]">
                        {/* ── the mark ── */}
                        <p className="flex items-center gap-3 font-display text-[11px] font-black uppercase tracking-[0.42em] text-[var(--accent)]">
                            <span aria-hidden className="h-px w-8 bg-gradient-to-r from-transparent to-[var(--accent)]" />
                            TechPlay
                            <span aria-hidden className="h-px w-8 bg-gradient-to-l from-transparent to-[var(--accent)]" />
                        </p>

                        <h1 className="mt-3 font-display font-black uppercase text-white leading-[0.84] tracking-[-0.01em] text-[64px] sm:text-[86px] lg:text-[104px]">
                            Frontiers
                        </h1>

                        {/* the star, drawn small — a rank insignia, not a decoration */}
                        <span aria-hidden className="mt-4 flex items-center gap-3">
                            <span className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent" />
                            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 fill-[var(--accent)]" aria-hidden>
                                <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z" />
                            </svg>
                            <span className="h-px flex-1 max-w-[120px] bg-gradient-to-l from-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent" />
                        </span>

                        {/* ── the promise ── */}
                        <p className="mt-6 inline-flex items-center gap-3 font-display text-[13px] sm:text-[15px] font-black uppercase tracking-[0.26em] text-white">
                            <span aria-hidden className="text-[var(--accent)]">&#91;</span>
                            Izgradi. Ujedini. Osvoji.
                            <span aria-hidden className="text-[var(--accent)]">&#93;</span>
                        </p>

                        <p className="mt-5 max-w-[420px] text-[13.5px] leading-relaxed text-white/55">
                            Nova MMO strategija za klanove, teritorije i resurse.
                            <br />
                            Tvoja priča. Tvoj klan. Tvoja dominacija.
                        </p>

                        {/* countdown, CTA and the notify form all live client-side */}
                        <FrontiersClient />

                        <p className="mt-8 max-w-[420px] text-[11.5px] leading-relaxed text-white/25">
                            Frontiers je u izradi. Ova stranica je najava — datum i detalji se mogu promijeniti
                            dok se sistem gradi.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── the four pillars ── */}
            <section className="container-page py-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {PILLARS.map(({ icon: Icon, title, body }) => (
                        <div
                            key={title}
                            className="group flex items-start gap-3.5 rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-1)] p-4 hover:border-[color-mix(in_srgb,var(--accent)_38%,transparent)] transition-colors"
                        >
                            <span className="w-11 h-11 shrink-0 rounded-[var(--radius-card)] bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_22%,transparent)] flex items-center justify-center">
                                <Icon className="w-5 h-5 text-[var(--accent)]" strokeWidth={1.75} />
                            </span>
                            <span className="min-w-0">
                                <span className="block font-display text-[13px] font-black uppercase tracking-[0.08em] text-white">
                                    {title}
                                </span>
                                <span className="mt-1 block text-[12px] leading-snug text-white/40">{body}</span>
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
