"use client";

import { useState } from "react";
import axios from "@/lib/axios";
import { BarChart3, Check, Lock } from "lucide-react";
import { toast } from "react-hot-toast";

/**
 * The thread's poll.
 *
 * Drawn as bars rather than as a list with numbers beside it, because the whole
 * point of asking is to see the shape of the answer at a glance — a column of
 * "23", "19", "4" makes the reader do the comparison themselves.
 *
 * The tally can be withheld until you vote, and when it is, the counts are not
 * in the payload at all rather than merely undrawn: anything sent is readable
 * whatever the interface does with it.
 */

export interface PollOption {
    id: number;
    label: string;
    /** null when the poll withholds its tally from people who have not voted. */
    votes: number | null;
}

export interface PollData {
    id: number;
    question: string;
    allows_multiple: boolean;
    hide_results_until_voted: boolean;
    closes_at: string | null;
    is_closed: boolean;
    voters: number;
    has_voted: boolean;
    can_see_results: boolean;
    my_options: number[];
    options: PollOption[];
}

export default function ThreadPoll({
    poll,
    threadSlug,
    canVote,
    onVoted,
}: {
    poll: PollData;
    threadSlug: string;
    canVote: boolean;
    onVoted: (next: PollData) => void;
}) {
    const [picked, setPicked] = useState<number[]>(poll.my_options ?? []);
    const [saving, setSaving] = useState(false);

    const open = canVote && !poll.is_closed;

    const toggle = (id: number) => {
        if (!open) return;
        setPicked((current) =>
            poll.allows_multiple
                ? current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
                : [id]
        );
    };

    const submit = async () => {
        if (!picked.length || saving) return;
        setSaving(true);

        try {
            const res = await axios.post(`/forum/threads/${threadSlug}/poll/vote`, { options: picked });
            onVoted(res.data);
        } catch (err) {
            toast.error(
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                ?? "That vote could not be recorded."
            );
        } finally {
            setSaving(false);
        }
    };

    // Percentages are of voters, not of votes: in a multiple-choice poll three
    // people picking two things each is six votes, and "60% of votes" is a
    // number nobody wants to read.
    const denominator = Math.max(1, poll.voters);

    return (
        <section className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] overflow-hidden">
            <header className="flex items-center gap-2.5 border-b border-[var(--line)] px-4 py-3">
                <BarChart3 aria-hidden className="h-4 w-4 shrink-0 text-[var(--accent)]" strokeWidth={1.7} />
                <h2 className="min-w-0 flex-1 font-display text-[14px] font-bold text-white">{poll.question}</h2>
                {poll.is_closed && (
                    <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-[var(--ink-faint)]">
                        <Lock className="h-3 w-3" /> Closed
                    </span>
                )}
            </header>

            <div className="space-y-2 p-4">
                {poll.options.map((option) => {
                    const mine = picked.includes(option.id);
                    const share = option.votes === null ? 0 : Math.round((option.votes / denominator) * 100);

                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => toggle(option.id)}
                            disabled={!open}
                            aria-pressed={mine}
                            className={`relative block w-full overflow-hidden rounded-[var(--radius-card)] border px-3 py-2.5 text-left transition-colors ${
                                mine
                                    ? "border-[color-mix(in_srgb,var(--accent)_45%,transparent)] bg-[var(--accent-soft)]"
                                    : "border-[var(--line)] bg-white/[0.02]"
                            } ${open ? "hover:border-white/20" : "cursor-default"}`}
                        >
                            {/* The bar sits behind the label rather than beside
                                it, so the row stays one line at any width. */}
                            {poll.can_see_results && (
                                <span
                                    aria-hidden
                                    className="absolute inset-y-0 left-0 bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] transition-[width] duration-500"
                                    style={{ width: `${share}%` }}
                                />
                            )}

                            <span className="relative flex items-center gap-2">
                                {mine && <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" strokeWidth={2.2} />}
                                <span className="min-w-0 flex-1 truncate text-[13px] text-white">{option.label}</span>
                                {poll.can_see_results && (
                                    <span className="shrink-0 font-numeric text-[12px] text-[var(--ink-mid)]">
                                        {option.votes} · {share}%
                                    </span>
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>

            <footer className="flex flex-wrap items-center gap-3 border-t border-[var(--line)] px-4 py-3">
                <span className="font-numeric text-[12px] text-[var(--ink-mid)]">{poll.voters}</span>
                <span className="-ml-2 font-display text-[9.5px] font-bold uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                    {poll.voters === 1 ? "Voter" : "Voters"}
                </span>

                {poll.allows_multiple && (
                    <span className="text-[11.5px] text-[var(--ink-faint)]">Pick as many as you like</span>
                )}
                {!poll.can_see_results && (
                    <span className="text-[11.5px] text-[var(--ink-faint)]">Results show once you vote</span>
                )}

                <span className="flex-1" />

                {open && (
                    <button
                        type="button"
                        onClick={submit}
                        disabled={!picked.length || saving}
                        className="btn-command inline-flex h-9 items-center bg-[var(--accent)] px-5 font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-40"
                    >
                        {saving ? "Saving…" : poll.has_voted ? "Change vote" : "Vote"}
                    </button>
                )}
            </footer>
        </section>
    );
}
