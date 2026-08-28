"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Zap, Coins, Trophy, ChevronsUp, X } from "lucide-react";
import { getStorageUrl } from "@/lib/imageUrl";

/** What the API attaches to a write that paid out. */
export interface RewardPayload {
    xp?: number;
    bounty?: number;
    unlocked?: { name: string; icon: string | null }[];
    promoted?: { name: string; color: string | null; icon: string | null } | null;
}

/** The event any part of the app can fire to make this speak. */
export const REWARD_EVENT = "techplay:reward";

export function announceReward(reward: RewardPayload) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent<RewardPayload>(REWARD_EVENT, { detail: reward }));
}

interface Chip {
    id: number;
    kind: "xp" | "bounty";
    amount: number;
}

let nextId = 0;

/**
 * The site saying what just happened.
 *
 * Everything the profile pays out — XP, bounty, an unlocked achievement, a rank
 * promotion — happened on the server and showed up, if at all, on the next page
 * load. Adding a game paid ten XP and looked precisely like nothing happening.
 *
 * Two registers, because two different things happened. Small numbers rise and
 * fade in the corner: a nod, not an interruption. An unlock or a promotion is
 * rare enough to be worth stopping for, so it takes the middle of the screen
 * once and waits to be dismissed.
 */
export default function RewardFeed() {
    const [chips, setChips] = useState<Chip[]>([]);
    const [moment, setMoment] = useState<RewardPayload | null>(null);

    /*
     * A moment belongs to the page that earned it.
     *
     * This lives in the root layout, so it survives navigation — and the moment
     * is a full-screen scrim that only a click dismissed. Leave the page with
     * one open and it followed, darkening whatever came next until the reader
     * thought to click it away.
     */
    const pathname = usePathname();
    useEffect(() => { setMoment(null); }, [pathname]);

    const dismiss = useCallback((id: number) => {
        setChips((prev) => prev.filter((c) => c.id !== id));
    }, []);

    useEffect(() => {
        const onReward = (event: Event) => {
            const reward = (event as CustomEvent<RewardPayload>).detail;

            if (!reward) return;

            const fresh: Chip[] = [];
            if (reward.xp) fresh.push({ id: nextId++, kind: "xp", amount: reward.xp });
            if (reward.bounty) fresh.push({ id: nextId++, kind: "bounty", amount: reward.bounty });

            if (fresh.length > 0) {
                setChips((prev) => [...prev, ...fresh]);
                fresh.forEach((chip) => setTimeout(() => dismiss(chip.id), 2600));
            }

            // A promotion outranks an unlock: you can only be told one thing at
            // a time, and climbing a rank is the bigger one.
            if (reward.promoted || reward.unlocked?.length) {
                setMoment(reward);
            }
        };

        window.addEventListener(REWARD_EVENT, onReward);

        return () => window.removeEventListener(REWARD_EVENT, onReward);
    }, [dismiss]);

    return (
        <>
            {/* ── the nod ── */}
            <div
                aria-live="polite"
                className="fixed bottom-[calc(1.5rem+var(--tabbar-h)+var(--safe-b))] md:bottom-6 right-6 z-[70] flex flex-col-reverse items-end gap-2 pointer-events-none"
            >
                {chips.map((chip) => (
                    <span
                        key={chip.id}
                        className="tp-reward-chip inline-flex items-center gap-1.5 h-8 px-3 rounded-full border font-display text-[12px] font-black tabular-nums shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
                        style={chip.kind === "xp"
                            ? { background: "color-mix(in srgb, var(--xp, #a78bfa) 16%, #0b0d12)", borderColor: "color-mix(in srgb, var(--xp, #a78bfa) 45%, transparent)", color: "var(--xp-bright, #c4b5fd)" }
                            : { background: "rgba(245,158,11,0.14)", borderColor: "rgba(245,158,11,0.45)", color: "#fbbf24" }}
                    >
                        {chip.kind === "xp" ? <Zap className="w-3.5 h-3.5" /> : <Coins className="w-3.5 h-3.5" />}
                        +{chip.amount} {chip.kind === "xp" ? "XP" : "Bounty"}
                    </span>
                ))}
            </div>

            {/* ── the moment ── */}
            {moment && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
                    <div className="tp-reward-moment relative w-full max-w-[380px] rounded-[var(--radius-panel)] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[var(--surface-1)] p-7 text-center shadow-[0_30px_80px_rgba(0,0,0,0.7)]">
                        <button
                            onClick={() => setMoment(null)}
                            aria-label="Close"
                            className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {moment.promoted ? (
                            <>
                                <span
                                    className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
                                    style={{ background: `color-mix(in srgb, ${moment.promoted.color ?? "var(--accent)"} 18%, transparent)` }}
                                >
                                    <ChevronsUp className="w-8 h-8" style={{ color: moment.promoted.color ?? "var(--accent)" }} />
                                </span>
                                <p className="mt-4 font-display text-[10px] font-black uppercase tracking-[0.22em] text-white/55">Rank up</p>
                                <p className="mt-1.5 font-display text-[26px] font-black uppercase tracking-tight text-white leading-none">
                                    {moment.promoted.name}
                                </p>
                            </>
                        ) : (
                            <>
                                {moment.unlocked?.[0]?.icon ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={getStorageUrl(moment.unlocked[0].icon!)}
                                        alt=""
                                        aria-hidden
                                        className="mx-auto w-16 h-16 object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.6)]"
                                    />
                                ) : (
                                    <span className="mx-auto w-16 h-16 rounded-full bg-[var(--accent-soft)] flex items-center justify-center">
                                        <Trophy className="w-8 h-8 text-[var(--accent)]" />
                                    </span>
                                )}
                                <p className="mt-4 font-display text-[10px] font-black uppercase tracking-[0.22em] text-white/55">
                                    {(moment.unlocked?.length ?? 0) > 1 ? `${moment.unlocked!.length} achievements unlocked` : "Achievement unlocked"}
                                </p>
                                <p className="mt-1.5 font-display text-[22px] font-black text-white leading-tight">
                                    {moment.unlocked?.[0]?.name}
                                </p>
                                {(moment.unlocked?.length ?? 0) > 1 && (
                                    <p className="mt-1.5 text-[12px] text-white/55">
                                        and {moment.unlocked!.length - 1} more
                                    </p>
                                )}
                            </>
                        )}

                        <Link
                            href="/profile/me?tab=achievements"
                            onClick={() => setMoment(null)}
                            className="btn-command mt-6 inline-flex items-center justify-center w-full h-11 bg-[var(--accent)] hover:brightness-110 font-display text-[11px] font-black uppercase tracking-[0.14em] text-white transition-[filter]"
                        >
                            See it
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
}
