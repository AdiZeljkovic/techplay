"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { BookOpen, Clock3, Flame, CalendarDays, Gamepad2, Star, Loader2, Trash2, Pencil, Search, X, EyeOff, AlertTriangle, Users, Film, Check, ChevronDown, Layers , Image as ImageIcon } from "lucide-react";
import Panel from "@/components/ui/Panel";
import EmptyState from "@/components/ui/EmptyState";
import SessionSuggestions from "./SessionSuggestions";
import { useCountUp } from "@/hooks/useCountUp";
import type { JournalPayload, PlaySession } from "@/lib/types/profile";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

/** Each mood owns a colour, so a month of sessions reads as a mood at a glance. */
const MOODS: Record<string, { label: string; color: string }> = {
    hooked: { label: "Hooked", color: "#f97316" },
    relaxed: { label: "Relaxed", color: "#34d399" },
    grinding: { label: "Grinding", color: "#60a5fa" },
    frustrated: { label: "Frustrated", color: "#f87171" },
    impressed: { label: "Impressed", color: "#a855f7" },
    bored: { label: "Bored", color: "#9ca3af" },
    emotional: { label: "Emotional", color: "#f472b6" },
};

const PLATFORMS = ["PC", "PlayStation", "Xbox", "Nintendo", "Mobile", "Retro"];

/**
 * Two lenses instead of four tabs.
 *
 * Sessions and the calendar are the same question — what did I play, and when —
 * so they stack rather than hide behind each other. Completed games and the
 * reviews written about them are likewise one thing seen twice: a finished game
 * and what you said about finishing it.
 */
export type JournalView = "diary" | "timeline";

const hhmm = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
};

/** "August 2026" — a diary is read by the month, so that is what divides it. */
const monthOf = (iso: string) => iso.slice(0, 7);
const monthLabel = (key: string) =>
    new Date(`${key}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
const dayLabel = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Keeps the given order, gathers runs under their key. */
function groupRuns<T>(rows: T[], key: (row: T) => string): { key: string; rows: T[] }[] {
    const out: { key: string; rows: T[] }[] = [];

    for (const row of rows) {
        const k = key(row);
        const last = out[out.length - 1];
        if (last && last.key === k) last.rows.push(row);
        else out.push({ key: k, rows: [row] });
    }

    return out;
}

/**
 * One finished game and what was said about finishing it.
 *
 * The timeline drew the games and the reviews as two separate panels, one
 * under the other, listing largely the same titles — so a game you finished
 * and rated appeared twice, and the verdict sat three hundred pixels below the
 * thing it was a verdict on. They are one record.
 */
interface FinishedEntry {
    slug: string;
    name: string;
    cover_url: string | null;
    at: string | null;
    hours: number;
    from_backlog: boolean;
    completed: boolean;
    rating: number | null;
    review: string | null;
}

function FinishedRow({ entry }: { entry: FinishedEntry }) {
    return (
        <div className="group flex gap-3.5 p-3 rounded-[12px] border border-white/[0.07] bg-white/[0.02] hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] transition-colors duration-300">
            <Link
                href={`/games/${entry.slug}`}
                className="relative w-[74px] shrink-0 aspect-[3/4] rounded-[9px] overflow-hidden bg-white/[0.04] border border-white/[0.06]"
            >
                {entry.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.cover_url} alt="" aria-hidden loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500" />
                ) : (
                    <span className="w-full h-full flex items-center justify-center text-white/15"><Gamepad2 className="w-5 h-5" /></span>
                )}
            </Link>

            <div className="min-w-0 flex-1 flex flex-col">
                <p className="flex items-center gap-2.5 flex-wrap">
                    <Link href={`/games/${entry.slug}`} className="font-display text-[14px] font-black text-white hover:text-[var(--accent)] transition-colors line-clamp-1">
                        {entry.name}
                    </Link>
                    {entry.rating != null && (
                        <span className="shrink-0 inline-flex items-center gap-1 font-display text-[11px] font-black tabular-nums text-amber-400">
                            <Star className="w-3 h-3 fill-current" /> {entry.rating.toFixed(1)}
                        </span>
                    )}
                </p>

                <p className="mt-1.5 flex items-center gap-2 flex-wrap font-display text-[9.5px] font-bold uppercase tracking-[0.11em] text-white/30">
                    <span
                        className="inline-flex items-center gap-1 h-[18px] px-1.5 rounded-[4px]"
                        style={entry.completed
                            ? { background: "rgba(34,197,94,0.14)", color: "#22c55e" }
                            : { background: "rgba(251,191,36,0.14)", color: "#fbbf24" }}
                    >
                        {entry.completed ? "Finished" : "Rated"}
                    </span>
                    {entry.at && <span className="tabular-nums">{dayLabel(entry.at)}</span>}
                    {entry.hours > 0 && <span className="tabular-nums">{entry.hours}h</span>}
                    {entry.from_backlog && (
                        <span className="inline-flex items-center gap-1 h-[18px] px-1.5 rounded-[4px] bg-blue-500/15 text-blue-400">
                            <Layers className="w-2.5 h-2.5" /> From backlog
                        </span>
                    )}
                </p>

                {entry.review && (
                    <p className="mt-2 text-[12.5px] text-white/55 leading-snug line-clamp-3">{entry.review}</p>
                )}
            </div>
        </div>
    );
}

/* ── the composer ─────────────────────────────────────────────────────── */

interface Draft {
    game: { slug: string; name: string; cover_url: string | null } | null;
    played_on: string;
    hours: string;
    minutes: string;
    platform: string;
    progress_label: string;
    progress_percent: string;
    note: string;
    mood: string;
    companions: string;
    has_spoilers: boolean;
    is_private: boolean;
}

const emptyDraft = (): Draft => ({
    game: null,
    played_on: new Date().toISOString().slice(0, 10),
    hours: "1",
    minutes: "0",
    platform: "",
    progress_label: "",
    progress_percent: "",
    note: "",
    mood: "",
    companions: "",
    has_spoilers: false,
    is_private: false,
});

const draftFromSession = (s: PlaySession): Draft => ({
    game: s.game,
    played_on: s.played_on,
    hours: String(Math.floor(s.minutes / 60)),
    minutes: String(s.minutes % 60),
    platform: s.platform ?? "",
    progress_label: s.progress_label ?? "",
    progress_percent: s.progress_percent != null ? String(s.progress_percent) : "",
    note: s.note ?? "",
    mood: s.mood ?? "",
    companions: (s.companions ?? []).join(", "),
    has_spoilers: s.has_spoilers,
    is_private: s.is_private,
});

function GamePicker({ value, onPick }: { value: Draft["game"]; onPick: (g: Draft["game"]) => void }) {
    const [term, setTerm] = useState("");
    const { data, isLoading } = useSWR<{ results: { slug: string; name: string; cover_url: string | null }[] }>(
        term.trim().length >= 2 ? `/games?search=${encodeURIComponent(term.trim())}&page_size=8` : null,
        fetcher
    );

    if (value) {
        return (
            <div className="flex items-center gap-3 p-2 rounded-[10px] border border-white/[0.09] bg-white/[0.03]">
                <span className="w-[62px] h-[36px] shrink-0 rounded-[6px] overflow-hidden bg-white/[0.05]">
                    {value.cover_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={value.cover_url} alt="" aria-hidden className="w-full h-full object-cover" />
                    )}
                </span>
                <span className="flex-1 min-w-0 text-[13px] font-bold text-white truncate">{value.name}</span>
                <button onClick={() => onPick(null)} className="p-1.5 text-white/30 hover:text-white transition-colors">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
            <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Which game did you play?"
                className="w-full h-10 pl-9 pr-3 rounded-[8px] bg-white/[0.04] border border-white/[0.09] text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
            />
            {term.trim().length >= 2 && (
                <div className="absolute z-20 left-0 right-0 top-[44px] max-h-[240px] overflow-y-auto rounded-[10px] border border-white/[0.1] bg-[var(--surface-2)] shadow-[0_20px_44px_rgba(0,0,0,0.6)]">
                    {isLoading ? (
                        <p className="flex items-center gap-2 p-3 text-[12px] text-white/35"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching…</p>
                    ) : (data?.results ?? []).length === 0 ? (
                        <p className="p-3 text-[12px] text-white/30">Nothing matched.</p>
                    ) : (
                        (data?.results ?? []).map((g) => (
                            <button
                                key={g.slug}
                                onClick={() => { onPick(g); setTerm(""); }}
                                className="w-full flex items-center gap-3 p-2 hover:bg-white/[0.05] transition-colors text-left"
                            >
                                <span className="w-[52px] h-[30px] shrink-0 rounded-[5px] overflow-hidden bg-white/[0.05]">
                                    {g.cover_url && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={g.cover_url} alt="" aria-hidden className="w-full h-full object-cover" />
                                    )}
                                </span>
                                <span className="flex-1 min-w-0 text-[12.5px] text-white truncate">{g.name}</span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

function SessionComposer({
    initial, sessionId, onDone, onCancel,
}: {
    initial: Draft;
    sessionId: number | null;
    onDone: () => void;
    onCancel: () => void;
}) {
    const [draft, setDraft] = useState<Draft>(initial);
    const [saving, setSaving] = useState(false);

    const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

    const totalMinutes = (parseInt(draft.hours || "0", 10) || 0) * 60 + (parseInt(draft.minutes || "0", 10) || 0);

    const save = async () => {
        if (!draft.game) return toast.error("Pick a game first.");
        if (totalMinutes < 1) return toast.error("A session needs at least a minute on it.");

        setSaving(true);
        try {
            const payload = {
                game_slug: draft.game.slug,
                played_on: draft.played_on,
                minutes: totalMinutes,
                platform: draft.platform || null,
                progress_label: draft.progress_label || null,
                progress_percent: draft.progress_percent === "" ? null : Number(draft.progress_percent),
                note: draft.note || null,
                mood: draft.mood || null,
                companions: draft.companions
                    ? draft.companions.split(",").map((c) => c.trim()).filter(Boolean)
                    : [],
                has_spoilers: draft.has_spoilers,
                is_private: draft.is_private,
            };

            if (sessionId) await axios.put(`/journal/sessions/${sessionId}`, payload);
            else await axios.post("/journal/sessions", payload);

            toast.success(sessionId ? "Session updated" : "Session logged");
            onDone();
        } catch (e: unknown) {
            const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Couldn't save that session.");
        } finally {
            setSaving(false);
        }
    };

    const field = "w-full h-10 px-3 rounded-[8px] bg-white/[0.04] border border-white/[0.09] text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)]";
    const label = "block font-display text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mb-1.5";

    return (
        <Panel
            variant="console"
            title={sessionId ? "Edit session" : "Log a session"}
            action={{ label: "Cancel", onClick: onCancel }}
        >
            <div className="space-y-4">
                <div>
                    <span className={label}>Game</span>
                    <GamePicker value={draft.game} onPick={(g) => set("game", g)} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                        <span className={label}>Date</span>
                        <input type="date" max={new Date().toISOString().slice(0, 10)} value={draft.played_on} onChange={(e) => set("played_on", e.target.value)} className={field} />
                    </div>
                    <div>
                        <span className={label}>Hours</span>
                        <input type="number" min={0} max={24} value={draft.hours} onChange={(e) => set("hours", e.target.value)} className={field} />
                    </div>
                    <div>
                        <span className={label}>Minutes</span>
                        <input type="number" min={0} max={59} value={draft.minutes} onChange={(e) => set("minutes", e.target.value)} className={field} />
                    </div>
                    <div>
                        <span className={label}>Platform</span>
                        <div className="relative">
                            <select value={draft.platform} onChange={(e) => set("platform", e.target.value)} className={`${field} appearance-none pr-8 cursor-pointer`}>
                                <option value="">—</option>
                                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                        <span className={label}>How far you got</span>
                        <input value={draft.progress_label} onChange={(e) => set("progress_label", e.target.value)} placeholder="Chapter 4, Stormveil Castle…" className={field} />
                    </div>
                    <div>
                        <span className={label}>Percent complete</span>
                        <input type="number" min={0} max={100} value={draft.progress_percent} onChange={(e) => set("progress_percent", e.target.value)} placeholder="—" className={field} />
                    </div>
                </div>

                <div>
                    <span className={label}>How was it</span>
                    <div className="flex flex-wrap gap-1.5">
                        {Object.entries(MOODS).map(([id, m]) => (
                            <button
                                key={id}
                                onClick={() => set("mood", draft.mood === id ? "" : id)}
                                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border font-display text-[10px] font-bold uppercase tracking-[0.08em] transition-colors"
                                style={draft.mood === id
                                    ? { borderColor: m.color, background: `color-mix(in srgb, ${m.color} 16%, transparent)`, color: m.color }
                                    : { borderColor: "rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.45)" }}
                            >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <span className={label}>Note</span>
                    <textarea
                        value={draft.note}
                        onChange={(e) => set("note", e.target.value.slice(0, 2000))}
                        rows={3}
                        placeholder="What happened? What are you going to do next time?"
                        className="w-full px-3 py-2.5 rounded-[8px] bg-white/[0.04] border border-white/[0.09] text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] resize-none"
                    />
                </div>

                <div>
                    <span className={label}>Played with</span>
                    <input value={draft.companions} onChange={(e) => set("companions", e.target.value)} placeholder="Names, comma separated" className={field} />
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                    {([
                        ["has_spoilers", "Contains spoilers", <AlertTriangle key="s" className="w-3.5 h-3.5" />],
                        ["is_private", "Private — only you", <EyeOff key="p" className="w-3.5 h-3.5" />],
                    ] as const).map(([key, text, icon]) => (
                        <button
                            key={key}
                            onClick={() => set(key, !draft[key])}
                            className={`inline-flex items-center gap-2 text-[12px] font-semibold transition-colors ${draft[key] ? "text-[var(--accent)]" : "text-white/40 hover:text-white/70"}`}
                        >
                            <span className={`w-4 h-4 rounded-[4px] border flex items-center justify-center ${draft[key] ? "bg-[var(--accent)] border-transparent" : "border-white/20"}`}>
                                {draft[key] && <Check className="w-3 h-3 text-white" />}
                            </span>
                            {icon}
                            {text}
                        </button>
                    ))}

                    <span className="ml-auto flex items-center gap-3">
                        <span className="font-display text-[11px] font-bold tabular-nums text-white/35">{hhmm(totalMinutes)}</span>
                        <button
                            onClick={save}
                            disabled={saving}
                            className="inline-flex items-center gap-2 h-9 px-5 rounded-[8px] bg-[var(--accent)] hover:brightness-110 disabled:opacity-50 text-white font-display text-[10.5px] font-bold uppercase tracking-[0.1em] transition-[filter]"
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            {sessionId ? "Save" : "Log session"}
                        </button>
                    </span>
                </div>
            </div>
        </Panel>
    );
}

/* ── one session ──────────────────────────────────────────────────────── */

function MomentTile({
    moment, canEdit, onRemoved,
}: {
    moment: JournalPayload["sessions"][number]["moments"][number];
    /** Only the journal's owner is offered the remove. */
    canEdit?: boolean;
    onRemoved?: () => void;
}) {
    const [revealed, setRevealed] = useState(false);
    const [removing, setRemoving] = useState(false);

    const remove = async (e: React.MouseEvent) => {
        // The tile itself is a link to the clip; the X must not follow it.
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm("Remove this moment?")) return;
        setRemoving(true);
        try {
            await axios.delete(`/journal/moments/${moment.id}`);
            toast.success("Moment removed");
            onRemoved?.();
        } catch {
            toast.error("Couldn't remove that moment.");
            setRemoving(false);
        }
    };
    const src = moment.type === "screenshot" && moment.image_url
        ? moment.image_url
        : moment.thumbnail_url;
    const hidden = moment.has_spoilers && !revealed;

    const body = (
        <span className="relative block w-[104px] h-[62px] rounded-[7px] overflow-hidden bg-white/[0.05]">
            {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={moment.caption ?? ""} loading="lazy" className={`w-full h-full object-cover ${hidden ? "blur-md scale-110" : ""}`} />
            ) : (
                <span className="w-full h-full flex items-center justify-center text-white/25">
                    {moment.type === "clip" ? <Film className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                </span>
            )}
            {moment.type === "clip" && !hidden && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <Film className="w-4 h-4 text-white" />
                </span>
            )}
            {hidden && (
                <span className="absolute inset-0 flex items-center justify-center font-display text-[8px] font-black uppercase tracking-[0.1em] text-white/80">
                    Spoiler
                </span>
            )}

            {canEdit && (
                <button
                    onClick={remove}
                    disabled={removing}
                    aria-label="Remove this moment"
                    title="Remove this moment"
                    className="absolute top-1 right-1 w-[22px] h-[22px] rounded-full bg-black/70 border border-white/20 inline-flex items-center justify-center text-white/70 hover:text-white hover:bg-[var(--accent)] hover:border-transparent transition-colors disabled:opacity-50"
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </span>
    );

    if (hidden) {
        return <button onClick={() => setRevealed(true)} title="Reveal">{body}</button>;
    }

    return moment.type === "clip" && moment.url ? (
        <a href={moment.url} target="_blank" rel="noopener noreferrer" title={moment.caption ?? "Watch clip"}>{body}</a>
    ) : (
        <span title={moment.caption ?? ""}>{body}</span>
    );
}

function SessionRow({ session, onEdit, onDelete, onChanged }: { session: PlaySession; onEdit: () => void; onDelete: () => void; onChanged: () => void }) {
    const [revealed, setRevealed] = useState(false);
    const mood = session.mood ? MOODS[session.mood] : null;
    const noteHidden = session.has_spoilers && !revealed;

    return (
        <div className="group relative flex gap-4 p-4 rounded-[12px] border border-white/[0.07] bg-white/[0.02] hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] transition-colors duration-300">
            {/* date rail */}
            <span className="shrink-0 flex flex-col items-center justify-center w-[54px] h-[54px] rounded-[10px] bg-white/[0.04] border border-white/[0.07] leading-none">
                <span className="font-display text-[17px] font-black tabular-nums text-white">
                    {new Date(session.played_on).getDate()}
                </span>
                <span className="mt-1 font-display text-[8px] font-bold uppercase tracking-[0.12em] text-white/35">
                    {new Date(session.played_on).toLocaleDateString("en-GB", { month: "short" })}
                </span>
            </span>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                    {session.game && (
                        <Link href={`/games/${session.game.slug}`} className="font-display text-[14px] font-bold text-white hover:text-[var(--accent)] transition-colors truncate">
                            {session.game.name}
                        </Link>
                    )}
                    <span className="inline-flex items-center gap-1 font-display text-[11px] font-bold tabular-nums text-[var(--xp-bright)]">
                        <Clock3 className="w-3 h-3" /> {hhmm(session.minutes)}
                    </span>
                    {session.platform && (
                        <span className="font-display text-[9.5px] font-bold uppercase tracking-[0.1em] text-white/30">{session.platform}</span>
                    )}
                    {mood && (
                        <span
                            className="inline-flex items-center gap-1 h-[18px] px-2 rounded-[4px] font-display text-[8px] font-black uppercase tracking-[0.1em]"
                            style={{ color: mood.color, background: `color-mix(in srgb, ${mood.color} 14%, transparent)` }}
                        >
                            {mood.label}
                        </span>
                    )}
                    {session.is_private && (
                        <span className="inline-flex items-center gap-1 font-display text-[8.5px] font-black uppercase tracking-[0.1em] text-white/30">
                            <EyeOff className="w-2.5 h-2.5" /> Private
                        </span>
                    )}
                </div>

                {(session.progress_label || session.progress_percent != null) && (
                    <div className="mt-2 flex items-center gap-2.5">
                        {session.progress_label && (
                            <span className="text-[12px] text-white/55">{session.progress_label}</span>
                        )}
                        {session.progress_percent != null && (
                            <>
                                <span className="flex-1 max-w-[140px] h-[4px] rounded-full bg-[var(--track)] overflow-hidden">
                                    <span className="block h-full rounded-full bg-[var(--accent)]" style={{ width: `${session.progress_percent}%` }} />
                                </span>
                                <span className="font-display text-[10px] font-black tabular-nums text-white/40">{session.progress_percent}%</span>
                            </>
                        )}
                    </div>
                )}

                {session.note && (
                    noteHidden ? (
                        <button
                            onClick={() => setRevealed(true)}
                            className="mt-2 inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-[6px] bg-amber-500/12 border border-amber-500/30 font-display text-[9px] font-black uppercase tracking-[0.1em] text-amber-400"
                        >
                            <AlertTriangle className="w-3 h-3" /> Spoilers — tap to read
                        </button>
                    ) : (
                        <p className="mt-2 text-[12.5px] text-white/55 leading-snug whitespace-pre-line">{session.note}</p>
                    )
                )}

                {session.companions.length > 0 && (
                    <p className="mt-2 inline-flex items-center gap-1.5 font-display text-[10px] font-bold text-white/30">
                        <Users className="w-3 h-3" /> with {session.companions.join(", ")}
                    </p>
                )}

                {session.moments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {session.moments.map((m) => (
                            <MomentTile key={m.id} moment={m} canEdit={session.can_edit} onRemoved={onChanged} />
                        ))}
                    </div>
                )}
            </div>

            {session.can_edit && (
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={onEdit} title="Edit" className="w-7 h-7 rounded-[6px] bg-black/50 flex items-center justify-center text-white/50 hover:text-[var(--accent)] transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={onDelete} title="Delete" className="w-7 h-7 rounded-[6px] bg-black/50 flex items-center justify-center text-white/50 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}

/* ── calendar ─────────────────────────────────────────────────────────── */

/**
 * Fifty-three weeks of cells, coloured by how long that day ran. The scale is
 * relative to the player's own busiest day — an hour is a lot for one person
 * and a warm-up for another.
 */
function CalendarHeat({ calendar }: { calendar: JournalPayload["calendar"] }) {
    const byDate = useMemo(() => new Map(calendar.map((d) => [d.date, d])), [calendar]);
    const peak = useMemo(() => Math.max(60, ...calendar.map((d) => d.minutes)), [calendar]);

    const weeks = useMemo(() => {
        const end = new Date();
        end.setHours(0, 0, 0, 0);
        // Wind back to the Monday 52 weeks ago so columns line up as weeks.
        const start = new Date(end);
        start.setDate(start.getDate() - 364);
        start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

        const out: Date[][] = [];
        const cursor = new Date(start);
        while (cursor <= end) {
            const week: Date[] = [];
            for (let i = 0; i < 7; i++) {
                week.push(new Date(cursor));
                cursor.setDate(cursor.getDate() + 1);
            }
            out.push(week);
        }
        return out;
    }, []);

    return (
        <div className="overflow-x-auto scrollbar-none">
            <div className="flex gap-[3px] min-w-max">
                {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-[3px]">
                        {week.map((day) => {
                            const key = day.toISOString().slice(0, 10);
                            const entry = byDate.get(key);
                            const intensity = entry ? Math.min(1, entry.minutes / peak) : 0;
                            const future = day > new Date();

                            return (
                                <span
                                    key={key}
                                    title={entry ? `${key} · ${hhmm(entry.minutes)} · ${entry.games.join(", ")}` : key}
                                    className="block w-[11px] h-[11px] rounded-[2px]"
                                    style={{
                                        background: future
                                            ? "transparent"
                                            : entry
                                                ? `color-mix(in srgb, var(--accent) ${18 + intensity * 82}%, var(--surface-2))`
                                                : "rgba(255,255,255,0.045)",
                                    }}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── the tab ──────────────────────────────────────────────────────────── */

interface JournalProps {
    username: string;
    /** Which lens to draw. The Library owns the switch. */
    view?: JournalView;
    /**
     * A game handed over from the shelf, so "log a session" on a cover opens
     * the composer already knowing what you played. Logging used to mean
     * coming here first and searching backwards for the game you had just put
     * down, which is a form to fill in rather than a diary to keep.
     */
    prefill?: { slug: string; name: string; cover_url: string | null } | null;
    onPrefillConsumed?: () => void;
}

export default function JournalTab({ username, view = "diary", prefill, onPrefillConsumed }: JournalProps) {
    const { data, isLoading, mutate } = useSWR<{ data: JournalPayload }>(
        `/users/${username}/journal`, fetcher, { revalidateOnFocus: false }
    );

    const [composing, setComposing] = useState(false);
    const [editing, setEditing] = useState<PlaySession | null>(null);

    // A game handed over from the shelf opens the composer already holding it.
    // Derived rather than copied into state: the parent owns the handover, and
    // clearing it there is what closes the composer, so the two can never
    // disagree about whether one is open.
    const showComposer = composing || editing !== null || prefill != null;
    const draft = editing
        ? draftFromSession(editing)
        : prefill
            ? { ...emptyDraft(), game: prefill }
            : emptyDraft();

    const closeComposer = () => {
        setComposing(false);
        setEditing(null);
        onPrefillConsumed?.();
    };

    const journal = data?.data;

    const hours = useCountUp(journal?.summary.hours ?? 0, 1100);
    const sessionCount = useCountUp(journal?.summary.sessions ?? 0, 1100);

    const remove = async (session: PlaySession) => {
        if (!window.confirm('Delete this session and everything logged with it?')) return;
        try {
            await axios.delete(`/journal/sessions/${session.id}`);
            toast.success("Session deleted");
            mutate();
        } catch {
            toast.error("Couldn't delete that session.");
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-[86px] rounded-[var(--radius-panel)] bg-white/[0.04] animate-pulse" />
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                    <div className="xl:col-span-8 h-[420px] rounded-[var(--radius-panel)] bg-white/[0.04] animate-pulse" />
                    <div className="xl:col-span-4 h-[420px] rounded-[var(--radius-panel)] bg-white/[0.04] animate-pulse" />
                </div>
            </div>
        );
    }

    if (!journal) {
        return <EmptyState icon={<BookOpen className="w-[18px] h-[18px]" />} title="No journal yet" />;
    }

    const s = journal.summary;

    // A finished game and what you said about finishing it are one record.
    // They were two panels, one under the other, listing largely the same
    // titles — so a game you finished and rated appeared twice and the verdict
    // sat three hundred pixels below the thing it was a verdict on. Games you
    // rated without finishing keep their place in the same run, marked as what
    // they are rather than exiled to a list of their own.
    const reviewFor = new Map(journal.reviews.map((r) => [r.game.slug, r]));
    const finished: FinishedEntry[] = [
        ...journal.completed_timeline.map((g) => {
            const r = reviewFor.get(g.slug);

            return {
                slug: g.slug,
                name: g.name,
                cover_url: g.cover_url,
                at: g.completed_at,
                hours: g.hours,
                from_backlog: g.from_backlog,
                completed: true,
                rating: r?.rating ?? null,
                review: r?.review ?? null,
            };
        }),
        ...journal.reviews
            .filter((r) => !journal.completed_timeline.some((g) => g.slug === r.game.slug))
            .map((r) => ({
                slug: r.game.slug,
                name: r.game.name,
                cover_url: r.game.cover_url ?? null,
                at: r.created_at ? r.created_at.slice(0, 10) : null,
                hours: 0,
                from_backlog: false,
                completed: false,
                rating: r.rating,
                review: r.review,
            })),
    ].sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));

    return (
        <div className="space-y-4">
            {/* ── summary strip ──

                Equal bays with hairlines between them, and the marks drawn as
                marks: unplated line art in the reading's own colour, the way
                the shelf ledger and the navigation menus do it. It used to
                spread six readings across the full page with justify-between
                and put a 16px glyph inside a tinted box, which at that width
                left the boxes as the only thing you saw. */}
            <div
                className="rounded-[var(--radius-panel)] border overflow-hidden"
                style={{ borderColor: "var(--line-strong)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)" }}
            >
                <div
                    className={`grid grid-cols-2 md:grid-cols-3 gap-px ${s.busiest_month ? "lg:grid-cols-6" : "lg:grid-cols-5"}`}
                    style={{ background: "var(--line)" }}
                >
                    {([
                        [Clock3, "Hours played", `${hours}`, "var(--xp-bright)", s.minutes > 0 ? hhmm(s.minutes) : null],
                        [BookOpen, "Sessions", `${sessionCount}`, "var(--accent-ink)", null],
                        [Gamepad2, "Games", `${s.games}`, "#34d399", null],
                        [CalendarDays, "Days logged", `${s.days}`, "#60a5fa", null],
                        [Flame, "Streak", `${s.current_streak}`, "#f97316", s.current_streak > 0 ? "days running" : "log today"],
                    ] as const).map(([Icon, label, value, tint, sub]) => (
                        <div key={label} className="group/bay flex items-center gap-3.5 min-w-0 px-5 py-4" style={{ background: "var(--surface-2)" }}>
                            <span className="shrink-0 w-10 h-10 flex items-center justify-center" style={{ color: tint }}>
                                <Icon className="w-[24px] h-[24px] transition-transform duration-300 group-hover/bay:scale-110" strokeWidth={1.5} />
                            </span>
                            <span className="min-w-0">
                                <span className="block font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/40 whitespace-nowrap">{label}</span>
                                <span className="flex items-baseline gap-2 mt-1">
                                    <span className="font-display text-[19px] font-black tabular-nums leading-none text-white">{value}</span>
                                    {sub && <span className="text-[11px] text-white/30 whitespace-nowrap">{sub}</span>}
                                </span>
                            </span>
                        </div>
                    ))}

                    {s.busiest_month && (
                        <div className="flex items-center min-w-0 px-5 py-4 col-span-2 md:col-span-3 lg:col-span-1" style={{ background: "var(--surface-2)" }}>
                            <span className="min-w-0">
                                <span className="block font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/40 whitespace-nowrap">Busiest month</span>
                                <span className="block mt-1.5 text-[12.5px] font-semibold text-white whitespace-nowrap">
                                    {s.busiest_month.label} <span className="text-white/30">· {hhmm(s.busiest_month.minutes)}</span>
                                </span>
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* The year, first. It is the one object here that shows a habit
                rather than an entry, and it was buried under the session list
                where you only found it by scrolling past everything it
                summarises. Full width because fifty-three weeks of cells want
                it, and the column it used to sit in was cutting them off. */}
            {view === "diary" && (
                <Panel
                    title="Gaming Calendar"
                    material="lit"
                    meta={<span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-white/30">Last 12 months</span>}
                >
                    {journal.calendar.length === 0 ? (
                        <EmptyState variant="compact" title="Nothing logged yet" />
                    ) : (
                        <>
                            <CalendarHeat calendar={journal.calendar} />
                            <p className="mt-4 flex items-center gap-2 font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/25">
                                Less
                                {[0.1, 0.35, 0.6, 0.85, 1].map((v) => (
                                    <span key={v} className="block w-[11px] h-[11px] rounded-[2px]" style={{ background: `color-mix(in srgb, var(--accent) ${18 + v * 82}%, var(--surface-2))` }} />
                                ))}
                                More
                            </p>
                        </>
                    )}
                </Panel>
            )}

            {/* Sessions Steam already noticed, above the form that asks you to
                type one in. Nodding beats writing. */}
            {journal.is_owner && view === "diary" && <SessionSuggestions onLogged={mutate} />}

            {showComposer && (
                <SessionComposer
                    key={editing?.id ?? prefill?.slug ?? "new"}
                    initial={draft}
                    sessionId={editing?.id ?? null}
                    onDone={() => { closeComposer(); mutate(); }}
                    onCancel={closeComposer}
                />
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                <div className="xl:col-span-8 min-w-0 space-y-4">
                    {view === "diary" && (
                        <Panel
                            title="Sessions"
                            meta={journal.total_sessions > 0
                                ? <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] tabular-nums text-white/30">
                                    {journal.sessions.length} of {journal.total_sessions}
                                </span>
                                : undefined}
                            action={journal.is_owner && !showComposer
                                ? { label: "Log a session", onClick: () => setComposing(true) }
                                : undefined}
                            bodyClassName="p-4"
                        >
                            {journal.sessions.length === 0 ? (
                                <EmptyState
                                    icon={<BookOpen className="w-[18px] h-[18px]" />}
                                    title={journal.is_owner ? "Your journal is empty" : "No sessions logged"}
                                    body={journal.is_owner ? "Log what you played and this becomes a history you'll actually want to read back." : undefined}
                                />
                            ) : (
                                /* By the month, because that is how a diary is
                                   read back. An unbroken column of dated cards
                                   makes you compute where you are in the year
                                   from the number on each tile. */
                                <div className="space-y-5">
                                    {groupRuns(journal.sessions, (s) => monthOf(s.played_on)).map(({ key, rows }) => (
                                        <section key={key}>
                                            <h4 className="flex items-center gap-3 mb-2.5">
                                                <span className="font-display text-[9.5px] font-black uppercase tracking-[0.16em] text-white/35 whitespace-nowrap">
                                                    {monthLabel(key)}
                                                </span>
                                                <span aria-hidden className="flex-1 h-px bg-white/[0.06]" />
                                                <span className="font-display text-[9.5px] font-bold tabular-nums text-white/20">
                                                    {hhmm(rows.reduce((a, r) => a + r.minutes, 0))}
                                                </span>
                                            </h4>
                                            <div className="space-y-2.5">
                                                {rows.map((session) => (
                                                    <SessionRow
                                                        key={session.id}
                                                        session={session}
                                                        onEdit={() => { setEditing(session); setComposing(false); }}
                                                        onDelete={() => remove(session)}
                                                        onChanged={() => mutate()}
                                                    />
                                                ))}
                                            </div>
                                        </section>
                                    ))}
                                </div>
                            )}
                        </Panel>
                    )}

                    {view === "timeline" && (
                        <Panel
                            title="Finished"
                            meta={<span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-white/30">Games, and your verdict on them</span>}
                            bodyClassName="p-4"
                        >
                            {finished.length === 0 ? (
                                <EmptyState
                                    icon={<Star className="w-[18px] h-[18px]" />}
                                    title="Nothing finished yet"
                                    body="Mark a game completed in your collection, or rate one, and it lands here."
                                />
                            ) : (
                                <div className="space-y-5">
                                    {groupRuns(finished, (e) => e.at?.slice(0, 4) ?? "—").map(({ key, rows }) => (
                                        <section key={key}>
                                            <h4 className="flex items-center gap-3 mb-2.5">
                                                <span className="font-display text-[9.5px] font-black uppercase tracking-[0.16em] tabular-nums text-white/35">
                                                    {key === "—" ? "Undated" : key}
                                                </span>
                                                <span aria-hidden className="flex-1 h-px bg-white/[0.06]" />
                                                <span className="font-display text-[9.5px] font-bold tabular-nums text-white/20">
                                                    {rows.length} {rows.length === 1 ? "game" : "games"}
                                                </span>
                                            </h4>
                                            <div className="space-y-2.5">
                                                {rows.map((e) => <FinishedRow key={`${e.slug}-${e.at}`} entry={e} />)}
                                            </div>
                                        </section>
                                    ))}
                                </div>
                            )}
                        </Panel>
                    )}
                </div>

                {/* ── sidebar ── */}
                <aside className="xl:col-span-4 min-w-0 space-y-4">
                    <Panel title="Where the hours went" material="instrument">
                        {journal.per_game.length === 0 ? (
                            <EmptyState variant="compact" title="No sessions yet" />
                        ) : (
                            <div className="space-y-3">
                                {journal.per_game.map((row) => (
                                    <div key={row.game.slug}>
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <Link href={`/games/${row.game.slug}`} className="text-[12.5px] font-semibold text-white/75 truncate hover:text-[var(--accent)] transition-colors">
                                                {row.game.name}
                                            </Link>
                                            <span className="shrink-0 font-display text-[11px] font-black tabular-nums text-white/45">{hhmm(row.minutes)}</span>
                                        </div>
                                        <span className="block h-[5px] rounded-full bg-[var(--track)] overflow-hidden">
                                            <span
                                                className="block h-full rounded-full transition-[width] duration-700 ease-[var(--ease-hud)]"
                                                style={{ width: `${row.percent}%`, background: "linear-gradient(90deg, var(--xp-deep), var(--xp-bright))" }}
                                            />
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>

                    <Panel title="Gaming Moments">
                        {(() => {
                            const moments = journal.sessions.flatMap((s) => s.moments).slice(0, 9);
                            return moments.length === 0 ? (
                                <EmptyState
                                    variant="compact"
                                    title="No moments yet"
                                    body={journal.is_owner ? "Attach a screenshot or a clip link to any session." : undefined}
                                />
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {moments.map((m) => <MomentTile key={m.id} moment={m} canEdit={journal.sessions.some((s) => s.can_edit)} onRemoved={() => mutate()} />)}
                                </div>
                            );
                        })()}
                    </Panel>
                </aside>
            </div>
        </div>
    );
}
