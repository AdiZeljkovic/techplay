import Link from "next/link";
import PageHero from "@/components/ui/PageHero";
import Panel from "@/components/ui/Panel";
import { Target, Zap, Heart, Globe, Shield, Users, ArrowRight } from "lucide-react";

/**
 * About — the first of the static pages brought onto the current language.
 *
 * It used to hand-roll every card, drive its own framer-motion choreography
 * per section, and fill a 400px block with floating icons over a gradient.
 * Panel's own note rules that out: gradients and corner blooms read as
 * decoration, and the approved tone is a matte instrument panel where the
 * content is the only thing that glows.
 *
 * Not a client component any more. Nothing here reacts to anything, so the
 * entrance is the shared `tp-fade-up` choreography in CSS and framer-motion
 * leaves this route's bundle entirely.
 */

/**
 * Principles, not slogans.
 *
 * What stood here was written in the voice of a message board: "No Sponsored
 * Bullshit", "our writers grind ranked", "we get it". It read as an attempt to
 * sound like the audience rather than as anything the audience could hold us
 * to — and none of it described what the site actually does.
 *
 * Each of these is a rule the code already follows, which is the only kind
 * worth printing.
 */
const VALUES = [
    { icon: Target, title: "Every number shows its working", desc: "Taste matching publishes its weights. Recommendations list the components behind each score. If a figure cannot be explained, it does not go on the page." },
    { icon: Shield, title: "Derived, not guessed", desc: "What the profile says about you is read from your collection and your playtime. Nothing is inferred from a model you cannot inspect." },
    { icon: Users, title: "Nothing is logged without you", desc: "Playtime read from Steam becomes a proposed session, never a recorded one. A diary you did not write is not a diary." },
    { icon: Heart, title: "Reviews are independent", desc: "Hardware and games are covered on their merits. Advertising and coverage are handled by different people and never traded against each other." },
    { icon: Zap, title: "Corrections are visible", desc: "When we get something wrong we change it and say so, rather than editing quietly and hoping." },
    { icon: Globe, title: "The catalogue is the floor, not the pitch", desc: "141,000 games exist here so the rest can work. A large database is table stakes; what you do with yours is not." },
];

const COVERAGE = [
    { title: "Your library", items: ["Steam, PlayStation and Xbox in one place", "Anything else added by hand", "Playing, backlog, completed, wishlist, dropped", "Hours counted, sessions proposed not invented"] },
    { title: "What it tells you", items: ["Taste across genres and eras", "Median hours and completion rate", "How your taste compares to another player", "Your year, counted and compared"] },
    { title: "What to play next", items: ["Backlog Advisor, filtered by mood", "Release calendar for what is coming", "Reviews and ratings with a stated scale", "Guides when a game gets in the way"] },
    { title: "The catalogue", items: ["141,000 games with release detail", "Browse by genre, platform, year or tag", "Hardware and tech coverage", "News, when it matters"] },
];

const STORY = [
    "TechPlay began in 2020 as a small publication covering gaming and hardware from the Balkans, for readers who wanted a straight answer about whether something was worth buying.",
    "The publishing side still runs. But the longer we did it, the clearer a second problem became: everyone writes about games, and nobody keeps a usable record of the games you have actually played. Your hours sit in one launcher, your finished titles in another, and your own taste is something you would have to work out by hand.",
    "So we built the part that was missing. A library that fills itself from what you play, and a profile that reads it back — what you reach for, how you finish, how close your taste sits to somebody else's. The catalogue, the calendar and the coverage are the ground it stands on.",
];

/** Section heading, same treatment the homepage rails use. */
function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
    return (
        <div className="mb-6">
            <h2 className="flex items-center gap-2.5 font-display text-[15px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                <span aria-hidden className="w-[3px] h-[14px] rounded-full bg-[var(--accent)]" />
                {children}
            </h2>
            {sub && <p className="mt-2.5 text-[13px] text-[var(--ink-low)] leading-relaxed">{sub}</p>}
        </div>
    );
}

export default function AboutClient() {
    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            <PageHero
                title="About TechPlay"
                description="One library across every platform you play on, and a publication around it."
            />

            <div className="container-page py-10 md:py-14 space-y-10 md:space-y-14">
                <section className="tp-fade-up tp-d1 max-w-3xl">
                    <SectionTitle>What TechPlay is</SectionTitle>
                    <div className="space-y-4 text-[14.5px] text-[var(--ink-mid)] leading-relaxed">
                        <p>
                            Every gaming site tells you about games. TechPlay also tells you about your
                            gaming.
                        </p>
                        <p>
                            Nowhere else shows you what you own across platforms. Steam shows Steam;
                            PlayStation shows PlayStation. Connect all three and your library assembles
                            itself in one place — the games, the hours, the ones you finished — and
                            anything they miss you can add by hand from the catalogue.
                        </p>
                        <p>
                            From that the site can describe your taste in figures you can check, tell you
                            how close it sits to another player&apos;s, and suggest something to play tonight
                            with the reasoning attached.
                        </p>
                        <p>
                            Around it sits the rest of a publication — a catalogue of 141,000 games, a
                            release calendar, reviews, hardware coverage and guides. Those are why people
                            arrive. The record is why they come back.
                        </p>
                    </div>
                </section>

                <section className="tp-fade-up tp-d2">
                    <SectionTitle>Core Values</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {VALUES.map((item) => (
                            <div
                                key={item.title}
                                className="group rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] p-5 hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300"
                            >
                                <span className="inline-flex w-9 h-9 rounded-[var(--radius-inner)] bg-[var(--fill-2)] text-[var(--accent)] items-center justify-center mb-4">
                                    <item.icon className="w-[18px] h-[18px]" />
                                </span>
                                <h3 className="font-display text-[13px] font-bold uppercase tracking-wider text-[var(--ink-hi)] mb-2 group-hover:text-[var(--accent)] transition-colors duration-300">
                                    {item.title}
                                </h3>
                                <p className="text-[13px] text-[var(--ink-low)] leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="tp-fade-up tp-d3 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
                    <div>
                        <SectionTitle>Our Story</SectionTitle>
                        <div className="space-y-4 text-[14px] text-[var(--ink-mid)] leading-relaxed">
                            {STORY.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
                            <p className="text-[var(--ink-hi)] font-semibold">
                                We are not the biggest gaming site, and that is not the ambition. The
                                ambition is to be the one that knows what you play.
                            </p>
                        </div>
                    </div>

                    <Panel title="By the numbers" variant="console" className="lg:sticky lg:top-24">
                        <dl className="divide-y divide-[var(--line)]">
                            {/* An "∞" here would contradict the first principle
                                on this very page. Every figure below is one
                                somebody could check. */}
                            {[
                                ["2020", "Founded"],
                                ["141,000", "Games catalogued"],
                                ["0", "Sponsored reviews"],
                            ].map(([value, label]) => (
                                <div key={label} className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">
                                    <dt className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">{label}</dt>
                                    <dd className="font-display text-[22px] font-black tabular-nums text-[var(--ink-hi)]">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </Panel>
                </section>

                <section className="tp-fade-up tp-d4">
                    <SectionTitle sub="Four things, and the order matters — the first two are the reason the others are here.">
                        What you get
                    </SectionTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {COVERAGE.map((category) => (
                            <Panel key={category.title} title={category.title}>
                                <ul className="space-y-2.5">
                                    {category.items.map((item) => (
                                        <li key={item} className="flex items-start gap-2 text-[13px] text-[var(--ink-low)] leading-snug">
                                            <span aria-hidden className="mt-[6px] w-1 h-1 rounded-full bg-[var(--accent)] shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Panel>
                        ))}
                    </div>
                </section>

                <section className="tp-fade-up tp-d5 flex flex-col items-center gap-4 py-4 text-center">
                    <p className="text-[13px] text-[var(--ink-low)]">
                        Something wrong, missing, or worth covering? We would rather hear it.
                    </p>
                    <Link
                        href="/contact"
                        className="btn-command inline-flex items-center gap-2 h-11 px-6 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-display text-[13px] font-bold uppercase tracking-wider transition-colors duration-300"
                    >
                        Contact us
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </section>
            </div>
        </main>
    );
}
