import { ROADMAP_2026, QUARTERS } from "@/lib/roadmapData";
import FeatureCard from "./FeatureCard";

/** The roadmap itself, grouped by quarter. */
export default function RoadmapFeatures() {
    return (
        <section className="container-page space-y-10 md:space-y-14">
            {QUARTERS.map((quarter, i) => {
                const features = ROADMAP_2026.filter((f) => f.quarter === quarter.id);

                if (features.length === 0) return null;

                return (
                    <div key={quarter.id} className={`tp-fade-up tp-d${Math.min(i + 1, 6)}`}>
                        <div className="mb-5 pb-4 border-b border-[var(--line)]">
                            <h2 className="flex items-center gap-2.5 font-display text-[15px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                                <span aria-hidden className="w-[3px] h-[14px] rounded-full bg-[var(--accent)]" />
                                {quarter.label}
                                <span className="text-[11px] font-bold tracking-wider text-[var(--ink-faint)]">{quarter.months}</span>
                            </h2>
                            <p className="mt-2 ml-[13px] text-[13px] text-[var(--ink-low)]">{quarter.description}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {features.map((feature) => (
                                <FeatureCard key={feature.id} feature={feature} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </section>
    );
}
