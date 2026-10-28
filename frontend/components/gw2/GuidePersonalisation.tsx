"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axios";
import Meter from "@/components/ui/Meter";
import { ActionLink, Gw2Panel } from "@/components/gw2/Gw2Ui";

/**
 * The part of a guide that is about you.
 *
 * A client island inside a server-rendered page, and the split is the whole
 * design. §20.2 requires public content to be useful without a key, so the
 * guide's substance is rendered on the server and indexed; this adds a figure,
 * a checklist or a short list of recommendations on top of prose that already
 * stands without it.
 *
 * It renders nothing at all for a signed-out reader — not a login wall, not an
 * empty box. A crawler and a stranger both see the guide, complete, and that is
 * what lets it rank.
 */

interface Figure {
    kind: "figure";
    label: string;
    value: number;
    target: number | null;
    shortfall?: number;
    subject?: string;
    note: string | null;
}

interface Checklist {
    kind: "checklist";
    label: string;
    done: number;
    total: number;
    items: { label: string; done: boolean; note: string | null }[];
    note: string | null;
}

interface Rows {
    kind: "rows";
    label: string;
    rows: { label: string; value: number; of: number; spent: number; affordable: number }[];
    note: string | null;
}

interface Recommendations {
    kind: "recommendations";
    label: string;
    items: { title: string; body: string; confidence: string }[];
}

/**
 * A curated chain, with this reader's progress through it.
 *
 * Which achievements make up a mount and in what order is ours — the game
 * publishes neither. Every step inside them is ArenaNet's own wording, which is
 * why `steps_remaining` is rendered verbatim and never paraphrased.
 */
interface Collection {
    kind: "collection";
    label: string;
    complete: number;
    total: number;
    items: {
        id: number;
        name: string;
        requirement: string | null;
        done: boolean;
        /** Null where the account has no record of this one at all. */
        current: number | null;
        max: number | null;
        steps_remaining: { index: number; text: string | null }[];
    }[];
    note: string | null;
}

type Block = Figure | Checklist | Rows | Recommendations | Collection;

export default function GuidePersonalisation({
    personaliseAs,
    tone = "var(--accent)",
}: {
    personaliseAs: string;
    /** The guide's own colour, for its bars — the panel itself stays neutral. */
    tone?: string;
}) {
    const { user, isLoading } = useAuth();
    const userId = user?.id ?? null;

    /*
     * Keyed by the person it was read for, the way the shell keys the
     * connection: signing in as somebody else must not show the previous
     * reader's figures for the length of a request. A stale answer is told
     * apart by its key rather than cleared from inside the effect.
     */
    const [read, setRead] = useState<{ user: number; block: Block | null } | null>(null);

    useEffect(() => {
        if (isLoading || userId === null) return;

        let cancelled = false;

        void axiosInstance
            .get<{ data: Block | null }>(`/gw2/personalise/${personaliseAs}`)
            .then(({ data }) => {
                if (!cancelled) setRead({ user: userId, block: data.data });
            })
            .catch(() => {
                if (!cancelled) setRead({ user: userId, block: null });
            });

        return () => {
            cancelled = true;
        };
    }, [isLoading, userId, personaliseAs]);

    const block = read && read.user === userId ? read.block : null;

    /*
     * Signed out: an invitation, not a wall. The guide above it is complete,
     * and this is the one place on a public page where connecting an account is
     * worth mentioning — right beside the thing it would personalise.
     */
    if (!isLoading && !user) {
        return (
            <Gw2Panel title="Your own figures">
                <div className="space-y-4">
                    <p className="text-sm text-[var(--ink-mid)]">
                        Connect a Guild Wars 2 account and this page shows your own figures instead.
                    </p>
                    <ActionLink href="/gw2">
                        Connect an account
                    </ActionLink>
                </div>
            </Gw2Panel>
        );
    }

    // Still reading, or nothing on this account to show: the guide stands alone.
    if (isLoading || !block) {
        return null;
    }

    return (
        <Gw2Panel title={block.label} description="From your own account">
            {block.kind === "figure" && (
                <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                        <span className="font-numeric text-3xl font-semibold text-[var(--ink-hi)]">{block.value}</span>
                        {block.target !== null && (
                            <span className="font-numeric text-lg text-[var(--ink-low)]">/ {block.target}</span>
                        )}
                    </div>
                    {block.target !== null && <Meter value={block.value} max={block.target} size="sm" tone={tone} />}
                    {block.note && <p className="text-sm text-[var(--ink-mid)]">{block.note}</p>}
                </div>
            )}

            {block.kind === "checklist" && (
                <div className="space-y-3">
                    <div className="flex items-baseline justify-between gap-2">
                        <span className="font-numeric text-2xl font-semibold text-[var(--ink-hi)]">
                            {block.done} <span className="text-base font-normal text-[var(--ink-low)]">/ {block.total}</span>
                        </span>
                    </div>
                    <Meter value={block.done} max={block.total} size="sm" tone={tone} />
                    {block.items.length > 0 && (
                        <ul className="space-y-1.5">
                            {block.items.map((item) => (
                                <li key={item.label} className="flex items-baseline justify-between gap-3 text-sm">
                                    <span className="truncate text-[var(--ink-hi)]">{item.label}</span>
                                    {item.note && (
                                        <span className="shrink-0 text-xs text-[var(--ink-low)]">{item.note}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                    {block.note && <p className="text-sm text-[var(--ink-mid)]">{block.note}</p>}
                </div>
            )}

            {block.kind === "rows" && (
                <div className="space-y-3">
                    <ul className="space-y-2">
                        {block.rows.map((row) => (
                            <li key={row.label} className="space-y-1">
                                <div className="flex items-baseline justify-between gap-2 text-sm">
                                    <span className="truncate text-[var(--ink-hi)]">{row.label}</span>
                                    <span className="shrink-0 font-numeric text-xs text-[var(--ink-low)]">
                                        {row.spent} / {row.of}
                                        {row.value > 0 && (
                                            <span className="text-[var(--accent-ink)]"> · {row.value} free</span>
                                        )}
                                    </span>
                                </div>
                                <Meter value={row.spent} max={row.of} size="sm" tone={tone} />
                            </li>
                        ))}
                    </ul>
                    {block.note && <p className="text-sm text-[var(--ink-mid)]">{block.note}</p>}
                </div>
            )}

            {block.kind === "collection" && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <span className="block font-numeric text-2xl font-semibold text-[var(--ink-hi)]">
                            {block.complete}{" "}
                            <span className="text-base font-normal text-[var(--ink-low)]">/ {block.total}</span>
                        </span>
                        <Meter value={block.complete} max={block.total} size="sm" tone={tone} />
                    </div>

                    <ol className="space-y-3">
                        {block.items.map((item) => (
                            <li key={item.id} className="space-y-1.5">
                                <div className="flex items-baseline justify-between gap-3 text-sm">
                                    <span
                                        className="truncate"
                                        style={{
                                            color: item.done ? "var(--ink-low)" : "var(--ink-hi)",
                                            // A finished collection stays on the
                                            // page — the chain is the point, and
                                            // seeing what is behind you is half
                                            // of what makes it readable.
                                            textDecoration: item.done ? "line-through" : undefined,
                                        }}
                                    >
                                        {item.name}
                                    </span>
                                    <span className="shrink-0 font-numeric text-xs text-[var(--ink-low)]">
                                        {item.done
                                            ? "done"
                                            : item.current === null
                                              ? "not started"
                                              : `${item.current} / ${item.max}`}
                                    </span>
                                </div>

                                {item.steps_remaining.length > 0 && (
                                    <ul className="space-y-1 pl-3">
                                        {item.steps_remaining
                                            .filter((step) => step.text !== null)
                                            .map((step) => (
                                                <li
                                                    key={step.index}
                                                    className="flex gap-2 text-xs text-[var(--ink-low)]"
                                                >
                                                    <span
                                                        aria-hidden
                                                        className="mt-[5px] h-1 w-1 shrink-0 rounded-full"
                                                        style={{ background: "var(--ink-faint)" }}
                                                    />
                                                    <span>{step.text}</span>
                                                </li>
                                            ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ol>

                    {block.note && <p className="text-sm text-[var(--ink-mid)]">{block.note}</p>}
                </div>
            )}

            {block.kind === "recommendations" && (
                <ul className="space-y-3">
                    {block.items.map((item) => (
                        <li key={item.title}>
                            <p className="text-sm font-medium text-[var(--ink-hi)]">{item.title}</p>
                            <p className="text-sm text-[var(--ink-mid)]">{item.body}</p>
                        </li>
                    ))}
                </ul>
            )}
        </Gw2Panel>
    );
}
