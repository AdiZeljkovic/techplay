"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axios";
import Panel from "@/components/ui/Panel";
import Meter from "@/components/ui/Meter";
import { Button } from "@/components/ui/Button";

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

type Block = Figure | Checklist | Rows | Recommendations;

export default function GuidePersonalisation({ personaliseAs }: { personaliseAs: string }) {
    const { user, isLoading } = useAuth();
    const [block, setBlock] = useState<Block | null>(null);
    const [state, setState] = useState<"idle" | "loading" | "none">("loading");

    useEffect(() => {
        if (isLoading || !user) {
            setState("none");

            return;
        }

        let cancelled = false;

        void axiosInstance
            .get<{ data: Block | null }>(`/gw2/personalise/${personaliseAs}`)
            .then(({ data }) => {
                if (cancelled) return;

                setBlock(data.data);
                setState(data.data ? "idle" : "none");
            })
            .catch(() => {
                if (!cancelled) setState("none");
            });

        return () => {
            cancelled = true;
        };
    }, [isLoading, user, personaliseAs]);

    /*
     * Signed out: an invitation, not a wall. The guide above it is complete,
     * and this is the one place on a public page where connecting an account is
     * worth mentioning — right beside the thing it would personalise.
     */
    if (!isLoading && !user) {
        return (
            <Panel material="matte" className="my-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <p className="text-sm text-[var(--ink-mid)]">
                        Connect a Guild Wars 2 account and this page shows your own figures instead.
                    </p>
                    <Button variant="secondary" asChild>
                        <Link href="/gw2">Connect an account</Link>
                    </Button>
                </div>
            </Panel>
        );
    }

    if (state === "none" || !block) {
        return null;
    }

    return (
        <Panel material="lit" crown title={block.label} className="my-6">
            {block.kind === "figure" && (
                <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                        <span className="font-numeric text-3xl text-[var(--ink-hi)]">{block.value}</span>
                        {block.target !== null && (
                            <span className="font-numeric text-lg text-[var(--ink-low)]">/ {block.target}</span>
                        )}
                    </div>
                    {block.target !== null && <Meter value={block.value} max={block.target} size="sm" />}
                    {block.note && <p className="text-sm text-[var(--ink-mid)]">{block.note}</p>}
                </div>
            )}

            {block.kind === "checklist" && (
                <div className="space-y-3">
                    <div className="flex items-baseline justify-between gap-2">
                        <span className="font-numeric text-2xl text-[var(--ink-hi)]">
                            {block.done} <span className="text-base text-[var(--ink-low)]">/ {block.total}</span>
                        </span>
                    </div>
                    <Meter value={block.done} max={block.total} size="sm" />
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
                                <Meter value={row.spent} max={row.of} size="sm" />
                            </li>
                        ))}
                    </ul>
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
        </Panel>
    );
}
