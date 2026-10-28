"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import Chip from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ActionLink, Gw2Panel, SectionHeader } from "@/components/gw2/Gw2Ui";
import { PageSummary } from "@/components/gw2/Gw2PageParts";
import { DOMAIN_TONE } from "@/lib/gw2domain";
import { getWhatsNew, gw2Error, setReturnedFrom, type Gw2Change } from "@/lib/gw2";

/**
 * What changed, for a returning player.
 *
 * The full list renders on the server for anyone. Signed in with an account
 * connected, it narrows to what the player owns and to the date they say they
 * left — a question the API cannot answer, so it is asked. Every row carries
 * the page it was written from.
 *
 * The question at the top of the column, where a phone reaches it before the
 * list; the changes as a dated line grouped by year; and down the right, the
 * list by category — which narrows it here in the browser, never asking the
 * server for anything new. The category bars carry this page's colour, and
 * nothing else does.
 */

const CHANGES = DOMAIN_TONE.changes;

/** The admin's own labels for `gw2_changes.category`, so both say the same thing. */
const CATEGORY_LABEL: Record<string, string> = {
    expansion: "Expansion",
    system: "System",
    economy: "Economy",
    raids_fractals: "Raids & fractals",
    wvw_pvp: "WvW & PvP",
    cosmetics: "Cosmetics",
    business: "Business",
};

function categoryLabel(category: string): string {
    return CATEGORY_LABEL[category] ?? category.replace(/_/g, " ");
}

export default function WhatsNewClient({ initial }: { initial: Gw2Change[] }) {
    const { user, isLoading } = useAuth();
    const [mine, setMine] = useState<{ returned_from: string | null; changes: Gw2Change[] } | null>(null);
    const [date, setDate] = useState("");
    const [saving, setSaving] = useState(false);
    const [category, setCategory] = useState<string | null>(null);

    useEffect(() => {
        if (isLoading || !user) return;

        let cancelled = false;

        getWhatsNew()
            .then((data) => {
                if (cancelled || !data) return;
                setMine(data);
                setDate(data.returned_from ?? "");
            })
            // No account connected: the public list stands.
            .catch(() => undefined);

        return () => {
            cancelled = true;
        };
    }, [isLoading, user]);

    async function save(value: string | null) {
        setSaving(true);

        try {
            await setReturnedFrom(value);
            setMine(await getWhatsNew());
        } catch (e) {
            toast.error(gw2Error(e, "We could not save that date."));
        } finally {
            setSaving(false);
        }
    }

    const changes = mine?.changes ?? initial;
    const shown = category ? changes.filter((c) => c.category === category) : changes;

    // Already newest first from the server; grouping keeps that order.
    const years: { year: string; changes: Gw2Change[] }[] = [];

    for (const change of shown) {
        const year = change.date.slice(0, 4);
        const last = years[years.length - 1];

        if (last && last.year === year) {
            last.changes.push(change);
        } else {
            years.push({ year, changes: [change] });
        }
    }

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-6">
                {mine ? (
                    <PageSummary
                        title="When did you last play?"
                        description="The game cannot tell us — it keeps no record of absences."
                    >
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-end gap-3">
                                <div>
                                    <label
                                        htmlFor="gw2-returned"
                                        className="mb-1.5 block text-xs font-medium text-[var(--ink-low)]"
                                    >
                                        Last played
                                    </label>
                                    <Input
                                        id="gw2-returned"
                                        type="date"
                                        value={date}
                                        max={new Date().toISOString().slice(0, 10)}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                                    />
                                </div>
                                <Button onClick={() => void save(date || null)} disabled={saving}>
                                    Show what changed since
                                </Button>
                                {mine.returned_from && (
                                    <Button variant="ghost" onClick={() => void save(null)} disabled={saving}>
                                        Show everything
                                    </Button>
                                )}
                            </div>
                            <p className="text-[11px] text-[var(--ink-faint)]">
                                Showing {mine.changes.length} changes
                                {mine.returned_from ? ` since ${formatDate(mine.returned_from)}` : ""}, only for what
                                your account owns. Changes to Visions of Eternity stay in and are marked — the game does
                                not report whether you own it.
                            </p>
                        </div>
                    </PageSummary>
                ) : (
                    !isLoading && (
                        <PageSummary
                            title="Everything since 2023, for every purchase"
                            description="Connect your account to see only what applies to what you own, since the day you left."
                        >
                            <ActionLink href="/gw2" className="sm:w-auto">
                                Connect your account
                            </ActionLink>
                        </PageSummary>
                    )
                )}

                <section className="space-y-4">
                    <SectionHeader
                        title="Changes, newest first"
                        description={
                            category
                                ? `${shown.length} of ${changes.length} — ${categoryLabel(category)} only.`
                                : `${changes.length} ${changes.length === 1 ? "change" : "changes"}, each dated and linked to the page it came from.`
                        }
                        meta={
                            category ? (
                                <button
                                    type="button"
                                    onClick={() => setCategory(null)}
                                    className="shrink-0 rounded-full border px-3.5 py-1.5 text-xs text-[var(--ink-mid)] transition-colors hover:bg-[var(--fill-1)]"
                                    style={{ borderColor: "var(--line-strong)" }}
                                >
                                    Show every category
                                </button>
                            ) : undefined
                        }
                    />

                    {shown.length === 0 ? (
                        <p
                            className="rounded-[var(--radius-card)] border px-4 py-3 text-sm text-[var(--ink-low)]"
                            style={{ borderColor: "var(--line)", background: "var(--surface-1)" }}
                        >
                            {changes.length === 0
                                ? "Nothing we have recorded changed since then."
                                : "Nothing in this category since then."}
                        </p>
                    ) : (
                        <div className="space-y-6">
                            {years.map((group) => (
                                <div key={group.year} className="space-y-3">
                                    <h3 className="font-numeric text-sm font-semibold text-[var(--ink-hi)]">{group.year}</h3>
                                    <ol className="space-y-3 border-l pl-5" style={{ borderColor: "var(--line-strong)" }}>
                                        {group.changes.map((change) => (
                                            <li key={`${change.date}-${change.title}`} className="relative">
                                                <ChangeCard change={change} signedIn={mine !== null} />
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <div className="space-y-5">
                {changes.length > 0 && (
                    <CategoryPanel changes={changes} selected={category} onSelect={setCategory} />
                )}

                <Gw2Panel title="How to read this">
                    <ul className="space-y-2 text-[13px] text-[var(--ink-mid)]">
                        <li>Every entry is dated, written in our words, and links the page it came from.</li>
                        <li>
                            A tag names what the change applies to. Nothing tagged applies to everybody.
                        </li>
                        {mine && (
                            <li>
                                An amber tag means the game does not say whether you own it, so the change stays in
                                rather than being guessed away.
                            </li>
                        )}
                    </ul>
                </Gw2Panel>
            </div>
        </div>
    );
}

/** One dated entry on the line, with its dot on the rule to its left. */
function ChangeCard({ change, signedIn }: { change: Gw2Change; signedIn: boolean }) {
    return (
        <>
            <span
                aria-hidden
                className="absolute -left-[24px] top-[19px] h-2 w-2 rounded-full"
                style={{ background: "var(--ink-low)" }}
            />
            <article
                className="rounded-[var(--radius-panel)] border p-4"
                style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)" }}
            >
                <div className="flex flex-wrap items-center gap-2">
                    <time dateTime={change.date} className="font-numeric text-xs text-[var(--ink-low)]">
                        {formatDate(change.date)}
                    </time>
                    <span className="text-[11px] text-[var(--ink-mid)]">· {categoryLabel(change.category)}</span>
                    {change.applies_to_name && (
                        <Chip variant={change.yours === null && signedIn ? "warning" : "neutral"} size="sm">
                            {change.applies_to_name}
                            {change.yours === null && signedIn ? " — ownership unknown" : ""}
                        </Chip>
                    )}
                </div>
                <h4 className="mt-1.5 text-base font-semibold text-[var(--ink-hi)]">{change.title}</h4>
                <p className="mt-1 text-sm leading-relaxed text-[var(--ink-mid)]">{change.summary}</p>
                <a
                    href={change.source.url}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] text-[var(--ink-faint)] hover:text-[var(--accent-ink)]"
                >
                    <ExternalLink size={11} aria-hidden />
                    {change.source.label}
                </a>
            </article>
        </>
    );
}

/**
 * The list by category, and a way to read one at a time.
 *
 * Counted over what is on the page — after the date and ownership filters —
 * so a number here is always the number of rows the click will leave.
 */
function CategoryPanel({
    changes,
    selected,
    onSelect,
}: {
    changes: Gw2Change[];
    selected: string | null;
    onSelect: (category: string | null) => void;
}) {
    const counts = new Map<string, number>();

    for (const change of changes) {
        counts.set(change.category, (counts.get(change.category) ?? 0) + 1);
    }

    const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const peak = Math.max(1, ...rows.map(([, n]) => n));

    return (
        <Gw2Panel title="By category" description="Pick one to read only that">
            <ul className="space-y-1">
                {rows.map(([category, count]) => {
                    const on = category === selected;

                    return (
                        <li key={category}>
                            <button
                                type="button"
                                onClick={() => onSelect(on ? null : category)}
                                aria-pressed={on}
                                className="block w-full space-y-1 rounded-[var(--radius-card)] border px-2 py-1.5 text-left transition-colors hover:bg-[var(--fill-1)]"
                                style={
                                    on
                                        ? { background: "var(--fill-2)", borderColor: "var(--accent)" }
                                        : { borderColor: "transparent" }
                                }
                            >
                                <span className="flex items-baseline justify-between gap-3 text-[13px]">
                                    <span style={{ color: on ? "var(--ink-hi)" : "var(--ink-mid)" }}>
                                        {categoryLabel(category)}
                                    </span>
                                    <span className="font-numeric text-[11px] text-[var(--ink-low)]">{count}</span>
                                </span>
                                <span aria-hidden className="block h-[3px] rounded-full bg-[var(--track)]">
                                    <span
                                        className="block h-full rounded-full"
                                        style={{ width: `${(count / peak) * 100}%`, background: CHANGES }}
                                    />
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </Gw2Panel>
    );
}

function formatDate(iso: string): string {
    return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
}
