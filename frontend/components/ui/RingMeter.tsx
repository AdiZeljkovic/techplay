import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RingMeterProps {
    value: number;
    max?: number;
    size?: number;
    strokeWidth?: number;
    /** CSS color; defaults to the accent token. */
    color?: string;
    /** Accent glow — reserved for the XP ring (signature S4 exception). */
    glow?: boolean;
    className?: string;
    /** Center slot */
    children?: ReactNode;
}

/** The one circular meter: --track rail, round caps, optional center content. */
export default function RingMeter({
    value,
    max = 100,
    size = 72,
    strokeWidth = 5,
    color = "var(--accent)",
    glow = false,
    className,
    children,
}: RingMeterProps) {
    const r = size / 2 - strokeWidth - 1;
    const circumference = 2 * Math.PI * r;
    const percent = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
    const dash = percent * circumference;

    return (
        <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={strokeWidth} />
                {/* a round cap paints a dot even at zero length — skip the arc entirely */}
                {percent > 0 && (
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={`${dash} ${circumference - dash}`}
                        style={glow ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined}
                    />
                )}
            </svg>
            {children && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
            )}
        </div>
    );
}
