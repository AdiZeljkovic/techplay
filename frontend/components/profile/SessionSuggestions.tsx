"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { Check, X, Loader2, Sparkles } from "lucide-react";

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data);

interface Suggestion {
    id: number;
    minutes: number;
    played_on: string;
    source: string;
    game: { slug: string; name: string; cover_url: string | null };
}

const hhmm = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
};

/** "today" / "yesterday" / a date — nobody says "on 2026-08-12". */
function when(iso: string) {
    const day = new Date(`${iso}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - day.getTime()) / 86_400_000);

    if (diff <= 0) return "today";
    if (diff === 1) return "yesterday";
    if (diff < 7) return `${diff} days ago`;

    return day.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * Sessions the site noticed, waiting for a yes.
 *
 * Steam reports lifetime playtime per game and we ask it on a schedule, so the
 * difference between two readings is a session that already happened. The
 * journal's real problem was never its design — it was that it asked people to
 * sit down and write. This asks them to nod.
 *
 * Nothing is written until they do. Steam counts time in the pause menu and
 * time spent making a sandwich, so the minutes are editable on the way in: the
 * person who was there knows better than the clock did.
 */
export default function SessionSuggestions({ onLogged }: { onLogged?: () => void }) {
    const { data, mutate } = useSWR<{ items: Suggestion[] }>("/journal/suggestions", fetcher, {
        revalidateOnFocus: false,
    });

    const [busy, setBusy] = useState<number | null>(null);
    const [edited, setEdited] = useState<Record<number, string>>({});

    const items = data?.items ?? [];

    if (items.length === 0) return null;

    const accept = async (s: Suggestion) => {
        setBusy(s.id);
        try {
            const typed = edited[s.id];
            const minutes = typed ? Number(typed) : undefined;

            await axios.post(`/journal/suggestions/${s.id}`, minutes && minutes > 0 ? { minutes } : {});
            toast.success(`Logged ${s.game.name}.`);
            mutate();
            onLogged?.();
        } catch {
            toast.error("Couldn't log that one.");
        } finally {
            setBusy(null);
        }
    };

    const dismiss = async (s: Suggestion) => {
        setBusy(s.id);
        try {
            await axios.delete(`/journal/suggestions/${s.id}`);
            mutate();
        } catch {
            toast.error("Couldn't dismiss that one.");
        } finally {
            setBusy(null);
        }
    };

    return (
        <section className="rounded-[var(--radius-panel)] border border-[color-mix(in_srgb,var(--accent)_26%,transparent)] bg-[var(--surface-1)] overflow-hidden">
            <header className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.06]">
                <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="font-display text-[11px] font-black uppercase tracking-[0.14em] text-white">
                    Looks like you played
                </h3>
                <span className="ml-auto font-display text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">
                    From Steam
                </span>
            </header>

            <ul className="divide-y divide-white/[0.05]">
                {items.map((s) => (
                    <li key={s.id} className="flex items-center gap-3.5 px-4 py-3">
                        {s.game.cover_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.game.cover_url} alt="" aria-hidden className="w-10 h-[54px] shrink-0 rounded-[5px] object-cover" />
                        ) : (
                            <span className="w-10 h-[54px] shrink-0 rounded-[5px] bg-white/[0.05]" />
                        )}

                        <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-white truncate">{s.game.name}</p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-white/55">
                                <input
                                    value={edited[s.id] ?? String(s.minutes)}
                                    onChange={(e) => setEdited((prev) => ({ ...prev, [s.id]: e.target.value.replace(/\D/g, "") }))}
                                    inputMode="numeric"
                                    aria-label={`Minutes played of ${s.game.name}`}
                                    className="w-[52px] h-6 px-1.5 rounded-[5px] bg-white/[0.05] border border-white/[0.09] text-[11.5px] tabular-nums text-white text-center focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
                                />
                                min · {hhmm(Number(edited[s.id] ?? s.minutes) || s.minutes)} {when(s.played_on)}
                            </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                onClick={() => accept(s)}
                                disabled={busy === s.id}
                                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[7px] bg-[var(--accent)] hover:brightness-110 font-display text-[10px] font-bold uppercase tracking-[0.1em] text-white transition-[filter] disabled:opacity-50"
                            >
                                {busy === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Log it
                            </button>
                            <button
                                onClick={() => dismiss(s)}
                                disabled={busy === s.id}
                                aria-label={`Dismiss ${s.game.name}`}
                                className="w-8 h-8 rounded-[7px] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.07] transition-colors disabled:opacity-50"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
