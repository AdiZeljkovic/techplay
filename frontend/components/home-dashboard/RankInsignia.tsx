"use client";

import { useCountUp } from "@/hooks/useCountUp";

const HEX = "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";

/**
 * Hex level crest — the shape gamers read as "rank" on sight. Double hex:
 * a bright accent shell, a dark core, the numeral in Command Numerals.
 */
export function LevelCrest({ level, size = 62 }: { level: number; size?: number }) {
    const shown = useCountUp(level, 900);

    return (
        <span className="relative shrink-0 block" style={{ width: size, height: size }} title={`Level ${level}`}>
            {/* outer shell — the accent metal */}
            <span
                aria-hidden
                className="absolute inset-0"
                style={{
                    clipPath: HEX,
                    background: "linear-gradient(160deg, var(--accent-bright) 0%, var(--accent) 55%, var(--accent-hover) 100%)",
                    filter: "drop-shadow(0 0 10px color-mix(in srgb, var(--accent) 55%, transparent))",
                }}
            />
            {/* dark core */}
            <span
                aria-hidden
                className="absolute"
                style={{ inset: 3, clipPath: HEX, background: "var(--surface-0)" }}
            />
            {/* inner sheen */}
            <span
                aria-hidden
                className="absolute"
                style={{
                    inset: 3,
                    clipPath: HEX,
                    background: "linear-gradient(155deg, color-mix(in srgb, var(--accent) 30%, transparent) 0%, transparent 55%)",
                }}
            />
            <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                <span
                    className="font-display font-black tabular-nums text-[var(--ink-hi)]"
                    style={{ fontSize: size * 0.36 }}
                >
                    {shown}
                </span>
                <span
                    className="font-display font-bold uppercase tracking-[0.14em] text-[var(--accent)]"
                    style={{ fontSize: Math.max(7, size * 0.13), marginTop: size * 0.03 }}
                >
                    LVL
                </span>
            </span>
        </span>
    );
}

/**
 * Rank emblem painted in that tier's own metal — Bronze burns copper,
 * Silver goes cold, Diamond glows cyan. The ladder already stores the
 * colour; this is what makes it mean something.
 */
export function RankEmblem({ name, color }: { name: string; color: string | null }) {
    const c = color || "var(--ink-mid)";

    return (
        <span
            className="inline-flex items-center gap-2 h-[30px] pl-2.5 pr-3.5 rounded-full border"
            style={{
                borderColor: `color-mix(in srgb, ${c} 45%, transparent)`,
                background: `linear-gradient(120deg, color-mix(in srgb, ${c} 18%, transparent) 0%, color-mix(in srgb, ${c} 6%, transparent) 100%)`,
                boxShadow: `0 0 16px color-mix(in srgb, ${c} 22%, transparent), inset 0 1px 0 color-mix(in srgb, ${c} 25%, transparent)`,
            }}
            title={`${name} rank`}
        >
            {/* the tier gem */}
            <span
                aria-hidden
                className="w-[14px] h-[14px] shrink-0"
                style={{
                    clipPath: HEX,
                    background: `linear-gradient(150deg, ${c} 0%, color-mix(in srgb, ${c} 55%, black) 100%)`,
                    boxShadow: `0 0 8px color-mix(in srgb, ${c} 60%, transparent)`,
                }}
            />
            <span
                className="font-display text-[11px] font-bold uppercase tracking-[0.12em] whitespace-nowrap"
                style={{ color: c }}
            >
                {name}
            </span>
        </span>
    );
}

/**
 * Segmented XP rail. Notches read as a HUD gauge rather than a web
 * progress bar; the leading edge carries a moving shine.
 */
export function XpRail({
    percent,
    segments = 18,
    className = "",
}: {
    percent: number;
    segments?: number;
    className?: string;
}) {
    const filled = (percent / 100) * segments;

    return (
        <span className={`flex items-center gap-[3px] ${className}`} aria-hidden>
            {Array.from({ length: segments }, (_, i) => {
                const fill = Math.max(0, Math.min(1, filled - i));
                const leading = fill > 0 && fill < 1;
                return (
                    <span
                        key={i}
                        className="relative flex-1 h-[9px] rounded-[2px] overflow-hidden bg-[var(--track)]"
                    >
                        {fill > 0 && (
                            <span
                                className="absolute inset-y-0 left-0 rounded-[2px]"
                                style={{
                                    width: `${fill * 100}%`,
                                    background: leading
                                        ? "var(--accent-bright)"
                                        : "linear-gradient(180deg, var(--accent-bright) 0%, var(--accent) 100%)",
                                    boxShadow: `0 0 ${leading ? 10 : 6}px color-mix(in srgb, var(--accent) ${leading ? 75 : 45}%, transparent)`,
                                }}
                            />
                        )}
                    </span>
                );
            })}
        </span>
    );
}
