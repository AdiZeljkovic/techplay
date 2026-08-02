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
 * The level, drawn as an outlined hex rather than a filled one. Hollow reads
 * as a rating shield; filled reads as a button. Paired with its own caption so
 * the numeral never has to explain itself.
 */
export function LevelHex({ level, size = 92 }: { level: number; size?: number }) {
    const shown = useCountUp(level, 900);

    return (
        <span className="relative block shrink-0" style={{ width: size, height: size }} title={`Level ${level}`}>
            {/* accent edge */}
            <span
                aria-hidden
                className="absolute inset-0"
                style={{
                    clipPath: HEX,
                    background: "var(--accent)",
                    filter: "drop-shadow(0 0 14px color-mix(in srgb, var(--accent) 45%, transparent))",
                }}
            />
            {/* hollow it out */}
            <span
                aria-hidden
                className="absolute"
                style={{
                    inset: 2.5,
                    clipPath: HEX,
                    background: "linear-gradient(165deg, #14110f 0%, #0a0908 100%)",
                }}
            />
            <span
                className="absolute inset-0 flex items-center justify-center font-display font-black tabular-nums text-white leading-none"
                style={{ fontSize: size * 0.42 }}
            >
                {shown}
            </span>
        </span>
    );
}

/**
 * The rank's medal, struck in that tier's own metal. A hex plate with a
 * bevelled face and a cold highlight — the object the name refers to.
 */
export function RankMedal({ color, size = 46 }: { color: string | null; size?: number }) {
    const c = color || "#9ca3af";

    return (
        <span className="relative block shrink-0" style={{ width: size, height: size }} aria-hidden>
            <span
                className="absolute inset-0"
                style={{
                    clipPath: HEX,
                    background: `linear-gradient(150deg, color-mix(in srgb, ${c} 70%, white) 0%, ${c} 42%, color-mix(in srgb, ${c} 45%, black) 100%)`,
                    filter: `drop-shadow(0 0 12px color-mix(in srgb, ${c} 45%, transparent))`,
                }}
            />
            {/* bevelled face */}
            <span
                className="absolute"
                style={{
                    inset: size * 0.14,
                    clipPath: HEX,
                    background: `linear-gradient(150deg, color-mix(in srgb, ${c} 88%, white) 0%, color-mix(in srgb, ${c} 60%, black) 100%)`,
                }}
            />
            {/* cold highlight across the top-left facet */}
            <span
                className="absolute"
                style={{
                    inset: size * 0.14,
                    clipPath: "polygon(50% 0%, 93% 25%, 50% 50%, 7% 25%)",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.05) 100%)",
                }}
            />
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
 * The XP gauge, built the way a game builds one: a machined channel milled
 * into the panel, a charge that fills it with hazard stripes crawling inside,
 * a hot leading edge where the charge ends, and quarter marks cut across the
 * whole channel so you can read progress without reading the number.
 *
 * Squared rather than pill-shaped — round ends read as a web progress bar,
 * hard ends read as instrumentation.
 */
export function XpRail({ percent, className = "" }: { percent: number; className?: string }) {
    const p = Math.max(0, Math.min(100, percent));

    return (
        <span
            className={`relative block h-[13px] rounded-[3px] overflow-hidden ${className}`}
            style={{
                background: "linear-gradient(180deg, #070605 0%, #100d0b 100%)",
                boxShadow: "inset 0 2px 6px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(255,255,255,0.05)",
            }}
            aria-hidden
        >
            {p > 0 && (
                <span
                    className="absolute inset-y-[1px] left-[1px] rounded-[2px] overflow-hidden"
                    style={{
                        width: `calc(${p}% - 2px)`,
                        background:
                            "linear-gradient(180deg, var(--accent-bright) 0%, var(--accent) 50%, var(--accent-hover) 100%)",
                        boxShadow: "0 0 14px color-mix(in srgb, var(--accent) 55%, transparent)",
                    }}
                >
                    {/* the charge is moving */}
                    <span
                        className="tp-xp-stripes absolute inset-0"
                        style={{
                            backgroundImage:
                                "repeating-linear-gradient(115deg, rgba(255,255,255,0.17) 0px, rgba(255,255,255,0.17) 6px, transparent 6px, transparent 13px)",
                            backgroundSize: "26px 100%",
                        }}
                    />
                    {/* gloss crown along the top third */}
                    <span className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/40 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/25 to-transparent" />
                </span>
            )}

            {/* quarter marks milled across the channel */}
            <span
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        "repeating-linear-gradient(90deg, transparent 0, transparent calc(25% - 1px), rgba(0,0,0,0.55) calc(25% - 1px), rgba(0,0,0,0.55) 25%)",
                }}
            />

            {/* the hot edge where the charge ends */}
            {p > 1 && p < 100 && (
                <span
                    className="absolute top-0 bottom-0 w-[2px] bg-white"
                    style={{
                        left: `calc(${p}% - 1px)`,
                        boxShadow: "0 0 8px rgba(255,255,255,0.95), 0 0 18px color-mix(in srgb, var(--accent) 85%, transparent)",
                    }}
                />
            )}
        </span>
    );
}
