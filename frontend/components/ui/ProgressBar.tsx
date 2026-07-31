import { cn } from "@/lib/utils";

/** The one linear meter: --track rail, accent→accent-bright fill. */
export default function ProgressBar({
    value,
    max = 100,
    className,
}: {
    value: number;
    max?: number;
    className?: string;
}) {
    const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

    return (
        <div className={cn("h-1.5 rounded-full bg-[var(--track)] overflow-hidden", className)} role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}>
            <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-bright)]"
                style={{ width: `${percent}%` }}
            />
        </div>
    );
}
