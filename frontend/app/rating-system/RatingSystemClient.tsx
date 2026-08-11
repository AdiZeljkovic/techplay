import { Star, Gamepad2, Monitor, Volume2, History, RotateCcw, AlertTriangle } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import Panel from "@/components/ui/Panel";

/**
 * How we score — rebuilt on the current language.
 *
 * The old page ran on framer-motion with 6xl headings, a rotating icon tile
 * per card and per-pillar accent colours (emerald, orange) picked outside the
 * palette. The score is the only thing on this page that should carry colour,
 * so it is the only thing that does.
 */

const SCORES = [
    { score: "10", title: "Masterpiece", bar: 100, description: "Defining moments in gaming history. Essential for everyone. While not technically 'perfect', it represents the absolute peak of the medium." },
    { score: "9", title: "Amazing", bar: 90, description: "An exceptional experience with only minor flaws that don't hinder overall enjoyment. A must-play title." },
    { score: "8", title: "Great", bar: 80, description: "A very good game worth your time and money. Accomplishes its goals with style but may lack that final spark of genius." },
    { score: "7", title: "Good", bar: 70, description: "A solid experience. Fans of the genre will essentially enjoy it, despite a lack of polish or innovation." },
    { score: "5–6", title: "Average", bar: 55, description: "It works, but fails to leave a lasting impression. Functionally competent but creatively stagnant." },
    { score: "1–4", title: "Poor / Broken", bar: 30, description: "Ranges from 'needs major work' to 'fundamentally broken'. Avoid unless you have a specific morbid curiosity." },
];

const PILLARS = [
    { icon: Gamepad2, title: "Gameplay", desc: "Mechanics, controls, and game feel." },
    { icon: Monitor, title: "Visuals", desc: "Art direction, fidelity, and polish." },
    { icon: Volume2, title: "Audio", desc: "Sound design, music score, acting." },
    { icon: History, title: "Narrative", desc: "Story, pacing, and characters." },
    { icon: RotateCcw, title: "Replayability", desc: "Value, longevity, and endgame." },
];

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
    return (
        <div className="mb-6">
            <h2 className="flex items-center gap-2.5 font-display text-[15px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                <span aria-hidden className="w-[3px] h-[14px] rounded-full bg-[var(--accent)]" />
                {children}
            </h2>
            {sub && <p className="mt-2.5 text-[13px] text-[var(--ink-low)] leading-relaxed max-w-2xl">{sub}</p>}
        </div>
    );
}

export default function RatingSystemClient() {
    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            <PageHero
                title="Our Rating System"
                description="Transparency in how we play, test, and score the games you love."
                iconNode={<Star className="w-6 h-6 text-[var(--accent)]" strokeWidth={1.75} />}
            />

            <div className="container-page py-10 md:py-14 space-y-10 md:space-y-14">
                <section className="tp-fade-up tp-d1 max-w-3xl">
                    <SectionTitle>More than just a number</SectionTitle>
                    <p className="text-[14.5px] text-[var(--ink-mid)] leading-relaxed">
                        We don&apos;t use complicated algorithms. Our 1–10 scale represents a gut check backed by
                        rigorous analysis. It&apos;s about the{" "}
                        <strong className="text-[var(--ink-hi)]">experience</strong>, not just the technicalities.
                    </p>
                </section>

                <section className="tp-fade-up tp-d2">
                    <SectionTitle>What each score means</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {SCORES.map((s) => (
                            <div
                                key={s.score}
                                className="rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] p-5 hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300"
                            >
                                <div className="flex items-baseline gap-3">
                                    <span className="font-display text-[28px] font-black tabular-nums leading-none text-[var(--accent)]">
                                        {s.score}
                                    </span>
                                    <span className="font-display text-[13px] font-bold uppercase tracking-wider text-[var(--ink-hi)]">
                                        {s.title}
                                    </span>
                                </div>

                                <div aria-hidden className="mt-3.5 h-1 rounded-full bg-[var(--fill-2)] overflow-hidden">
                                    <span className="block h-full bg-[var(--accent)]" style={{ width: `${s.bar}%` }} />
                                </div>

                                <p className="mt-3.5 text-[13px] text-[var(--ink-low)] leading-relaxed">{s.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="tp-fade-up tp-d3">
                    <SectionTitle sub="Every game is deconstructed into five core components that inform our final verdict.">
                        The five pillars
                    </SectionTitle>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {PILLARS.map((p) => (
                            <Panel key={p.title} className="h-full">
                                <span className="inline-flex w-10 h-10 rounded-[var(--radius-inner)] bg-[var(--fill-2)] text-[var(--accent)] items-center justify-center mb-3.5">
                                    <p.icon className="w-5 h-5" />
                                </span>
                                <h3 className="font-display text-[13px] font-bold uppercase tracking-wider text-[var(--ink-hi)] mb-1.5">
                                    {p.title}
                                </h3>
                                <p className="text-[12.5px] text-[var(--ink-low)] leading-snug">{p.desc}</p>
                            </Panel>
                        ))}
                    </div>
                </section>

                <p className="tp-fade-up tp-d4 flex items-center justify-center gap-2.5 rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] px-5 py-3.5 text-center text-[12.5px] text-[var(--ink-low)]">
                    <AlertTriangle className="w-4 h-4 text-[var(--accent)] shrink-0" />
                    <span>
                        <strong className="text-[var(--ink-hi)]">Note:</strong> reviews reflect the subjective
                        experience of the reviewer.
                    </span>
                </p>
            </div>
        </main>
    );
}
