import { cn } from "@/lib/utils";

/** The one loading placeholder: fill-2 pulse, radius by role. */
export default function SkeletonBlock({
    rounded = "card",
    className,
}: {
    rounded?: "panel" | "card" | "full";
    className?: string;
}) {
    const radius =
        rounded === "panel" ? "rounded-[var(--radius-panel)]" : rounded === "full" ? "rounded-full" : "rounded-[var(--radius-card)]";

    return <div className={cn("bg-[var(--fill-2)] animate-pulse", radius, className)} aria-hidden />;
}
