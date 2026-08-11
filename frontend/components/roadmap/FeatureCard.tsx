import * as LucideIcons from "lucide-react";
import { CheckCircle2, Clock, Circle } from "lucide-react";
import type { RoadmapFeature } from "@/lib/roadmapData";

/**
 * One roadmap item.
 *
 * The old card tilted in 3D under the cursor, driven by two springs and a
 * getBoundingClientRect on every mousemove — which is the exact shape of the
 * forced reflow PageSpeed keeps reporting, spent on a decoration. It also gave
 * every feature its own hex colour from the data file, so a roadmap of twelve
 * items rendered in twelve unrelated hues.
 *
 * Status is the only thing that varies now, because status is the only thing a
 * reader is scanning for.
 */

const STATUS = {
    completed: { icon: CheckCircle2, label: "Completed", className: "text-[var(--accent)] border-[color-mix(in_srgb,var(--accent)_45%,transparent)] bg-[var(--fill-2)]" },
    in_progress: { icon: Clock, label: "In progress", className: "text-[var(--ink-hi)] border-[var(--line-strong)] bg-[var(--fill-2)]" },
    planned: { icon: Circle, label: "Planned", className: "text-[var(--ink-faint)] border-[var(--line)] bg-[var(--fill-1)]" },
} as const;

export default function FeatureCard({ feature }: { feature: RoadmapFeature; index?: number }) {
    const icons = LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>;
    const Icon = icons[feature.icon] ?? LucideIcons.Box;
    const status = STATUS[feature.status];
    const StatusIcon = status.icon;

    return (
        <article className="flex h-full flex-col rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] p-5 hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300">
            <div className="flex items-start justify-between gap-3 mb-4">
                <span className="inline-flex w-10 h-10 shrink-0 rounded-[var(--radius-inner)] bg-[var(--fill-2)] text-[var(--accent)] items-center justify-center">
                    <Icon className="w-[18px] h-[18px]" />
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${status.className}`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                </span>
            </div>

            <h3 className="font-display text-[14px] font-bold uppercase tracking-wider text-[var(--ink-hi)] mb-2">
                {feature.title}
            </h3>
            <p className="text-[13px] text-[var(--ink-low)] leading-relaxed mb-4">{feature.description}</p>

            <ul className="mt-auto space-y-2 border-t border-[var(--line)] pt-4">
                {feature.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2 text-[12.5px] text-[var(--ink-low)] leading-snug">
                        <span aria-hidden className="mt-[6px] w-1 h-1 shrink-0 rounded-full bg-[var(--accent)]" />
                        <span>{detail}</span>
                    </li>
                ))}
            </ul>
        </article>
    );
}
