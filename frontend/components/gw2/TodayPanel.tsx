"use client";

import { useEffect, useState } from "react";
import { Check, Info } from "lucide-react";
import Panel from "@/components/ui/Panel";
import Meter from "@/components/ui/Meter";
import type { Gw2DailyList, Gw2Today } from "@/lib/gw2";

/**
 * What resets, how much of it is done, and how long is left.
 *
 * The counts are from the last read; the countdown is live. When a reset has
 * passed since that read, the counts belong to the day that just ended, and the
 * panel says so instead of presenting yesterday's ticks as today's.
 */
export default function TodayPanel({ today }: { today: Gw2Today }) {
    const now = useNow(30_000);

    const dailyAt = new Date(today.daily_reset_at).getTime();
    const weeklyAt = new Date(today.weekly_reset_at).getTime();
    const dailyPassed = now !== null && now >= dailyAt;
    const weeklyPassed = now !== null && now >= weeklyAt;

    const { world_bosses: bosses, heros_choice_chests: chests, time_gated_crafts: crafts } = today.daily;

    return (
        <Panel
            material="matte"
            title="Today"
            meta={
                <span className="font-numeric text-xs text-[var(--ink-faint)]">
                    {now === null ? "" : dailyPassed ? "reset passed" : `resets in ${until(dailyAt, now)}`}
                </span>
            }
        >
            <div className="space-y-4">
                {dailyPassed && (
                    <p className="text-xs text-[var(--accent-ink)]">
                        The daily reset has passed since we last read your account. These counts are from the day
                        that just ended.
                    </p>
                )}

                <Row label="World bosses" done={bosses.done} total={bosses.total} />
                {chests && <Row label="Hero's Choice chests" done={chests.done} total={chests.total} list={chests} />}
                {crafts && <Row label="Time-gated crafts" done={crafts.done} total={crafts.total} list={crafts} />}

                <div className="flex justify-between text-sm">
                    <span className="text-[var(--ink-mid)]">Dungeon paths</span>
                    <span className="font-numeric text-xs text-[var(--ink-low)]">{today.daily.dungeon_paths} today</span>
                </div>

                <div className="border-t pt-3" style={{ borderColor: "var(--line)" }}>
                    <div className="flex justify-between text-sm">
                        <span className="text-[var(--ink-mid)]">Raid encounters this week</span>
                        <span className="font-numeric text-xs text-[var(--ink-low)]">
                            {today.weekly.raid_encounters}
                        </span>
                    </div>
                    <p className="mt-1 font-numeric text-[11px] text-[var(--ink-faint)]">
                        {now === null
                            ? ""
                            : weeklyPassed
                              ? "Weekly reset passed since the last read."
                              : `Weekly reset in ${until(weeklyAt, now)} (Monday 07:30 UTC)`}
                    </p>
                </div>

                {/* Where the game's own lists are short — said, not hidden. */}
                <ul className="space-y-1">
                    {today.notes.map((note) => (
                        <li key={note.source} className="flex gap-1.5 text-[11px] text-[var(--ink-faint)]">
                            <Info size={11} className="mt-0.5 shrink-0" aria-hidden />
                            <span>
                                {note.text}{" "}
                                <a
                                    href={note.source}
                                    target="_blank"
                                    rel="nofollow noopener noreferrer"
                                    className="underline hover:text-[var(--accent-ink)]"
                                >
                                    Source
                                </a>
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </Panel>
    );
}

function Row({ label, done, total, list }: { label: string; done: number; total: number; list?: Gw2DailyList }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2 text-sm">
                {list ? (
                    <button
                        type="button"
                        onClick={() => setOpen((v) => !v)}
                        aria-expanded={open}
                        className="text-left text-[var(--ink-mid)] hover:text-[var(--accent-ink)]"
                    >
                        {label}
                    </button>
                ) : (
                    <span className="text-[var(--ink-mid)]">{label}</span>
                )}
                <span className="font-numeric text-xs text-[var(--ink-low)]">
                    {done} / {total}
                </span>
            </div>
            <Meter value={done} max={Math.max(1, total)} size="sm" />
            {list && open && (
                <ul className="grid grid-cols-1 gap-x-4 gap-y-1 pt-1 sm:grid-cols-2">
                    {list.items.map((item) => (
                        <li key={item.id} className="flex items-center gap-1.5 text-[11px]">
                            {item.done ? (
                                <Check size={11} className="shrink-0 text-[var(--accent-ink)]" aria-hidden />
                            ) : (
                                <span className="w-[11px] shrink-0" />
                            )}
                            <span style={{ color: item.done ? "var(--ink-mid)" : "var(--ink-low)" }}>{item.name}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/**
 * The current time, refreshed on an interval. Null until mounted, so the
 * server render and the first client render agree and nothing flickers.
 */
function useNow(intervalMs: number): number | null {
    const [now, setNow] = useState<number | null>(null);

    useEffect(() => {
        const tick = () => setNow(Date.now());
        const first = window.setTimeout(tick, 0);
        const timer = window.setInterval(tick, intervalMs);

        return () => {
            window.clearTimeout(first);
            window.clearInterval(timer);
        };
    }, [intervalMs]);

    return now;
}

function until(at: number, now: number): string {
    const minutes = Math.max(0, Math.round((at - now) / 60_000));
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;

    return [days > 0 ? `${days}d` : null, hours > 0 ? `${hours}h` : null, `${mins}m`].filter(Boolean).join(" ");
}
