"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import Panel from "@/components/ui/Panel";
import Chip from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getWhatsNew, gw2Error, setReturnedFrom, type Gw2Change } from "@/lib/gw2";

/**
 * What changed, for a returning player.
 *
 * The full list renders on the server for anyone. Signed in with an account
 * connected, it narrows to what the player owns and to the date they say they
 * left — a question the API cannot answer, so it is asked. Every row carries
 * the page it was written from.
 */
export default function WhatsNewClient({ initial }: { initial: Gw2Change[] }) {
    const { user, isLoading } = useAuth();
    const [mine, setMine] = useState<{ returned_from: string | null; changes: Gw2Change[] } | null>(null);
    const [date, setDate] = useState("");
    const [saving, setSaving] = useState(false);

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

    return (
        <div className="space-y-5">
            {mine ? (
                <Panel material="instrument" title="When did you last play?">
                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <label htmlFor="gw2-returned" className="mb-1.5 block text-sm text-[var(--ink-mid)]">
                                The game cannot tell us — it keeps no record of absences.
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
                    <p className="mt-3 text-[11px] text-[var(--ink-faint)]">
                        Showing {mine.changes.length} changes
                        {mine.returned_from ? ` since ${formatDate(mine.returned_from)}` : ""}, only for what your
                        account owns. Changes to Visions of Eternity stay in and are marked — the game does not report
                        whether you own it.
                    </p>
                </Panel>
            ) : (
                !isLoading && (
                    <Panel material="matte">
                        <p className="text-sm text-[var(--ink-mid)]">
                            Everything since 2023, for every purchase.{" "}
                            <Link href="/gw2" className="text-[var(--accent-ink)] hover:underline">
                                Connect your account
                            </Link>{" "}
                            to see only what applies to what you own, since the day you left.
                        </p>
                    </Panel>
                )
            )}

            {changes.length === 0 ? (
                <Panel material="matte">
                    <p className="text-sm text-[var(--ink-low)]">Nothing we have recorded changed since then.</p>
                </Panel>
            ) : (
                <ol className="space-y-3">
                    {changes.map((change) => (
                        <li
                            key={`${change.date}-${change.title}`}
                            className="rounded-[var(--radius-card)] border p-4"
                            style={{ borderColor: "var(--line)", background: "var(--surface-2)" }}
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <time dateTime={change.date} className="font-numeric text-xs text-[var(--ink-low)]">
                                    {formatDate(change.date)}
                                </time>
                                {change.applies_to_name && (
                                    <Chip variant={change.yours === null && mine ? "warning" : "neutral"} size="sm">
                                        {change.applies_to_name}
                                        {change.yours === null && mine ? " — ownership unknown" : ""}
                                    </Chip>
                                )}
                            </div>
                            <h2 className="mt-1.5 text-base text-[var(--ink-hi)]">{change.title}</h2>
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
                        </li>
                    ))}
                </ol>
            )}
        </div>
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
