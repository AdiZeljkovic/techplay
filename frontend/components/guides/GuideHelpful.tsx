"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { ThumbsUp, ThumbsDown, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Was this guide any use.
 *
 * The counter has been on every guide since guides shipped, printing "0 found
 * helpful" under a header — and there was no way to say so. The vote handler
 * existed in the controller and was never given a route, so the number could
 * only ever be zero. This is the missing half.
 *
 * Pressing the same answer twice withdraws it. A verdict you cannot take back
 * is one people stop giving, and it is the difference between a rating and a
 * trap.
 */
export default function GuideHelpful({
    slug, helpful, unhelpful, initialVote, onChange,
}: {
    slug: string;
    helpful: number;
    unhelpful: number;
    initialVote?: boolean | null;
    /** Lets the page's header chip move with the vote. */
    onChange?: (helpful: number) => void;
}) {
    const { user } = useAuth();
    const [vote, setVote] = useState<boolean | null>(initialVote ?? null);
    const [counts, setCounts] = useState({ helpful, unhelpful });
    const [busy, setBusy] = useState<boolean | null>(null);

    const cast = async (isHelpful: boolean) => {
        if (!user) return;
        setBusy(isHelpful);
        try {
            const { data } = await axios.post(`/guides/${slug}/vote`, { is_helpful: isHelpful });
            const next = data?.data ?? {};
            setVote(next.user_vote ?? null);
            setCounts({ helpful: next.helpful_count ?? 0, unhelpful: next.unhelpful_count ?? 0 });
            onChange?.(next.helpful_count ?? 0);
        } catch {
            toast.error("Couldn't record that. Try again in a moment.");
        } finally {
            setBusy(null);
        }
    };

    const total = counts.helpful + counts.unhelpful;

    return (
        <section
            className="mt-12 rounded-[var(--radius-panel)] border overflow-hidden"
            style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
        >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 md:px-6 py-5">
                <div className="min-w-0 flex-1">
                    <h3 className="font-display text-[14px] font-black uppercase tracking-[0.12em] text-white">
                        {vote === null ? "Did this guide help?" : vote ? "Glad it helped" : "Sorry it missed"}
                    </h3>
                    <p className="mt-1.5 text-[12.5px] text-white/40 leading-snug">
                        {vote === null
                            ? "One tap. It tells us which guides are worth writing more of."
                            : "Press the same button again to take it back."}
                    </p>
                </div>

                {user ? (
                    <div className="flex items-center gap-2 shrink-0">
                        {([
                            [true, "Yes", ThumbsUp, "#34d399", counts.helpful],
                            [false, "No", ThumbsDown, "#f87171", counts.unhelpful],
                        ] as const).map(([value, label, Icon, tint, count]) => {
                            const on = vote === value;

                            return (
                                <button
                                    key={label}
                                    onClick={() => cast(value)}
                                    disabled={busy !== null}
                                    aria-pressed={on}
                                    className="inline-flex items-center gap-2 h-10 px-4 rounded-[9px] border font-display text-[11px] font-black uppercase tracking-[0.1em] transition-colors duration-300 disabled:opacity-60"
                                    style={on
                                        ? { borderColor: tint, background: `color-mix(in srgb, ${tint} 14%, transparent)`, color: tint }
                                        : { borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)" }}
                                >
                                    {busy === value
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <Icon className="w-4 h-4" strokeWidth={2} />}
                                    {label}
                                    {count > 0 && <span className="tabular-nums opacity-60">{count}</span>}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <Link
                        href="/login?redirect=/guides"
                        className="shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-[9px] bg-[var(--accent)] hover:brightness-110 font-display text-[11px] font-black uppercase tracking-[0.1em] text-white transition-[filter]"
                    >
                        Sign in to answer
                    </Link>
                )}
            </div>

            {total > 0 && (
                <p className="flex items-center gap-2 px-5 md:px-6 py-3 border-t border-white/[0.07] font-display text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/70" />
                    <span className="tabular-nums text-white/60">{counts.helpful}</span> of{" "}
                    <span className="tabular-nums text-white/60">{total}</span> found this helpful
                </p>
            )}
        </section>
    );
}
