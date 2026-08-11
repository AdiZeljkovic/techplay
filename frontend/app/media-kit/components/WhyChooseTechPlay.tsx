import { Check, X, Minus, Zap, Target, TrendingUp, Shield, Clock, Award } from "lucide-react";

/**
 * TechPlay against the field.
 *
 * TODO(numbers): every figure here is a placeholder — ours and the "others"
 * column alike. Nothing in this project measured 62% desktop or 77% aged
 * 18-34, and nobody surveyed other publishers to arrive at their 45%. The
 * page is read by people deciding where to spend a budget, so these are first
 * in line once there is real analytics data.
 *
 * Visually: the comparison used a traffic light — green tick, red cross,
 * yellow dot — plus four stat cards each on its own gradient. A table that
 * exists to say "us versus them" only needs two weights, so accent marks ours
 * and the muted ink marks theirs.
 */

const HIGHLIGHTS = [
    { icon: Zap, value: "20K+", label: "Monthly users" },
    { icon: Target, value: "62%", label: "Desktop traffic" },
    { icon: Shield, value: "12.4%", label: "Monthly growth" },
    { icon: Clock, value: "171+", label: "In-depth reviews" },
];

const SECTIONS = [
    {
        category: "Audience quality",
        icon: Target,
        items: [
            { feature: "Tech-savvy audience", techplay: true, others: "partial", description: "Gaming & tech enthusiasts" },
            { feature: "Global reach", techplay: true, others: false, description: "US (32%), UK (18%), EU (26%)" },
            { feature: "Desktop users", techplay: "62%", others: "45%", description: "High-value traffic" },
            { feature: "Age 18-34", techplay: "77%", others: "45%", description: "Prime demographic" },
        ],
    },
    {
        category: "Performance metrics",
        icon: TrendingUp,
        items: [
            { feature: "Monthly growth", techplay: "12.4%", others: "3-5%", description: "Rapid organic growth" },
            { feature: "Page views / user", techplay: "1.8", others: "1.2", description: "High engagement" },
            { feature: "Quality content", techplay: "171+", others: "50-100", description: "In-depth reviews" },
            { feature: "Social following", techplay: "2K+", others: "500-1K", description: "Engaged community" },
        ],
    },
    {
        category: "Service & support",
        icon: Award,
        items: [
            { feature: "Direct communication", techplay: true, others: false, description: "Personal support" },
            { feature: "Custom packages", techplay: true, others: "partial", description: "Flexible solutions" },
            { feature: "Fast response", techplay: "< 2h", others: "24-48h", description: "Quick turnaround" },
            { feature: "Performance reports", techplay: true, others: "partial", description: "Detailed analytics" },
        ],
    },
];

function Mark({ value, ours }: { value: boolean | string; ours: boolean }) {
    const tone = ours ? "text-[var(--accent)]" : "text-[var(--ink-faint)]";

    if (value === true) return <Check className={`w-4 h-4 ${tone}`} strokeWidth={2.5} />;
    if (value === false) return <X className="w-4 h-4 text-[var(--ink-faint)]" strokeWidth={2.5} />;
    if (value === "partial") return <Minus className="w-4 h-4 text-[var(--ink-faint)]" strokeWidth={2.5} />;

    return (
        <span className={`font-display text-[13px] font-black tabular-nums ${ours ? "text-[var(--accent)]" : "text-[var(--ink-low)]"}`}>
            {value}
        </span>
    );
}

export default function WhyChooseTechPlay() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {HIGHLIGHTS.map((stat) => (
                    <div key={stat.label} className="rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] p-5">
                        <span className="inline-flex w-10 h-10 rounded-[var(--radius-inner)] bg-[var(--fill-2)] text-[var(--accent)] items-center justify-center mb-3.5">
                            <stat.icon className="w-[18px] h-[18px]" />
                        </span>
                        <p className="font-display text-[24px] font-black tabular-nums leading-none text-[var(--ink-hi)]">{stat.value}</p>
                        <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">{stat.label}</p>
                    </div>
                ))}
            </div>

            {SECTIONS.map((section) => (
                <div key={section.category} className="rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] overflow-hidden">
                    <div className="flex items-center gap-2.5 border-b border-[var(--line)] px-5 py-3.5">
                        <section.icon className="w-4 h-4 text-[var(--accent)]" />
                        <h3 className="font-display text-[13px] font-bold uppercase tracking-wider text-[var(--ink-hi)]">
                            {section.category}
                        </h3>
                    </div>

                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[var(--line)]">
                                <th className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">Feature</th>
                                <th className="w-24 px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">TechPlay</th>
                                <th className="w-24 px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">Others</th>
                            </tr>
                        </thead>
                        <tbody>
                            {section.items.map((item) => (
                                <tr key={item.feature} className="border-b border-[var(--line)] last:border-0">
                                    <td className="px-5 py-3">
                                        <span className="block text-[13px] font-semibold text-[var(--ink-hi)]">{item.feature}</span>
                                        <span className="block text-[11.5px] text-[var(--ink-faint)]">{item.description}</span>
                                    </td>
                                    <td className="px-2 py-3">
                                        <span className="flex justify-center"><Mark value={item.techplay} ours /></span>
                                    </td>
                                    <td className="px-2 py-3">
                                        <span className="flex justify-center"><Mark value={item.others} ours={false} /></span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
}
