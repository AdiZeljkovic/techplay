"use client";

import { useState } from "react";
import axios from "@/lib/axios";
import { Lightbulb, ThumbsUp, Smile, Sparkles, ThumbsDown } from "lucide-react";

/**
 * Reacting to one reply.
 *
 * The forum's only signal sat on the thread, so telling somebody their answer
 * helped meant writing another reply saying so — which is how a useful thread
 * fills with "this", "same" and "thanks" that everyone after has to scroll
 * past.
 *
 * A fixed, short vocabulary rather than free emoji: five named reactions stay
 * scannable down a long thread, and each one means something a reader can act
 * on. Counts that are zero draw nothing at all — a row of empty tallies under
 * every reply is noise, and the picker only appears on hover or focus.
 */

const KINDS = [
    { id: "helpful", label: "Helpful", icon: Lightbulb },
    { id: "agree", label: "Agree", icon: ThumbsUp },
    { id: "insightful", label: "Insightful", icon: Sparkles },
    { id: "funny", label: "Funny", icon: Smile },
    { id: "disagree", label: "Disagree", icon: ThumbsDown },
] as const;

export default function PostReactions({
    threadSlug,
    postId,
    counts,
    mine,
    canReact,
}: {
    threadSlug: string;
    postId: number;
    counts: Record<string, number>;
    mine: string | null;
    canReact: boolean;
}) {
    const [state, setState] = useState({ counts, mine });
    const [busy, setBusy] = useState(false);

    const react = async (kind: string) => {
        if (!canReact || busy) return;
        setBusy(true);

        // Optimistic, and reversed on failure rather than left wrong: a tally
        // that silently disagrees with the server is worse than none.
        const previous = state;
        const next = { ...state.counts };
        if (state.mine) next[state.mine] = Math.max(0, (next[state.mine] ?? 1) - 1);
        if (state.mine !== kind) next[kind] = (next[kind] ?? 0) + 1;

        setState({ counts: next, mine: state.mine === kind ? null : kind });

        try {
            const res = await axios.post(
                `/forum/threads/${threadSlug}/posts/${postId}/reactions`,
                { reaction: kind }
            );
            setState({ counts: res.data.reactions ?? {}, mine: res.data.mine ?? null });
        } catch {
            setState(previous);
        } finally {
            setBusy(false);
        }
    };

    const shown = KINDS.filter((k) => (state.counts[k.id] ?? 0) > 0);

    return (
        <div className="group/react mt-3 flex flex-wrap items-center gap-1.5">
            {shown.map((k) => {
                const Icon = k.icon;
                const isMine = state.mine === k.id;

                return (
                    <button
                        key={k.id}
                        type="button"
                        onClick={() => react(k.id)}
                        disabled={!canReact}
                        aria-pressed={isMine}
                        title={k.label}
                        className={`inline-flex h-[26px] items-center gap-1.5 rounded-full border px-2.5 text-[11px] transition-colors ${
                            isMine
                                ? "border-[color-mix(in_srgb,var(--accent)_45%,transparent)] bg-[var(--accent-soft)] text-[var(--accent-ink)]"
                                : "border-[var(--line)] bg-white/[0.03] text-[var(--ink-low)] hover:border-white/20"
                        } ${canReact ? "" : "cursor-default"}`}
                    >
                        <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
                        <span className="font-numeric">{state.counts[k.id]}</span>
                    </button>
                );
            })}

            {canReact && (
                /* Hidden until the reply is hovered or something in here has
                   focus, so the picker never competes with the words. */
                <span className="flex items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover/react:opacity-100">
                    {KINDS.filter((k) => !shown.some((s) => s.id === k.id)).map((k) => {
                        const Icon = k.icon;

                        return (
                            <button
                                key={k.id}
                                type="button"
                                onClick={() => react(k.id)}
                                title={k.label}
                                aria-label={k.label}
                                className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full text-[var(--ink-faint)] transition-colors hover:bg-white/[0.05] hover:text-[var(--accent-ink)]"
                            >
                                <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
                            </button>
                        );
                    })}
                </span>
            )}
        </div>
    );
}
