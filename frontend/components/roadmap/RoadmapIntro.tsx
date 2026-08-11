import { Target, Users, Zap } from "lucide-react";

/**
 * The roadmap's opening statement.
 *
 * Dropped two blurred colour blobs — one accent, one blue-500 — sitting behind
 * the text at 5% opacity, plus a gradient that bloomed on hover. The panel
 * language calls for a matte surface; the blobs were the opposite of it.
 */

const HIGHLIGHTS = [
    { icon: Target, label: "Clear vision", description: "Strategic goals for 2026" },
    { icon: Users, label: "Community first", description: "Built for gamers, by gamers" },
    { icon: Zap, label: "Innovation", description: "Cutting-edge features" },
];

export default function RoadmapIntro() {
    return (
        <section className="container-page space-y-8">
            <div className="tp-fade-up tp-d1 max-w-3xl">
                <h2 className="flex items-center gap-2.5 mb-4 font-display text-[15px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                    <span aria-hidden className="w-[3px] h-[14px] rounded-full bg-[var(--accent)]" />
                    Building the ultimate gaming platform
                </h2>
                <p className="text-[14.5px] text-[var(--ink-mid)] leading-relaxed">
                    At TechPlay, we&apos;re constantly evolving to bring you the best gaming and tech experience.
                    Here&apos;s our roadmap for 2026 — a year of innovation, community growth, and groundbreaking
                    features.
                </p>
            </div>

            <div className="tp-fade-up tp-d2 grid grid-cols-1 md:grid-cols-3 gap-4">
                {HIGHLIGHTS.map((item) => (
                    <div key={item.label} className="rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] p-5">
                        <span className="inline-flex w-10 h-10 rounded-[var(--radius-inner)] bg-[var(--fill-2)] text-[var(--accent)] items-center justify-center mb-3.5">
                            <item.icon className="w-[18px] h-[18px]" />
                        </span>
                        <h3 className="font-display text-[13px] font-bold uppercase tracking-wider text-[var(--ink-hi)] mb-1.5">
                            {item.label}
                        </h3>
                        <p className="text-[12.5px] text-[var(--ink-low)] leading-snug">{item.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
