"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import {
    BookOpen, Plus, Clock3, Flame, CalendarDays, Gamepad2, Trophy, Star, Loader2,
    Trash2, Pencil, Search, X, EyeOff, AlertTriangle, Users, Image as ImageIcon,
    Film, Check, ChevronDown, Layers,
} from "lucide-react";
import Panel from "@/components/ui/Panel";
import EmptyState from "@/components/ui/EmptyState";
import { useCountUp } from "@/hooks/useCountUp";
import { getStorageUrl } from "@/lib/imageUrl";
import { timeAgo } from "@/lib/timeAgo";
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

type View = "sessions" | "calendar" | "completed" | "reviews";

const VIEWS: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: "sessions", label: "Play Sessions", icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: "calendar", label: "Calendar", icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { id: "completed", label: "Completed", icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: "reviews", label: "Reviews", icon: <Star className="w-3.5 h-3.5" /> },
];

const hhmm = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
};

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
    const { data, isLoading } = useSWR<{ data: { slug: string; name: string; cover_url: string | null }[] }>(
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
                    ) : (data?.data ?? []).length === 0 ? (
                        <p className="p-3 text-[12px] text-white/30">Nothing matched.</p>
                    ) : (
                        (data?.data ?? []).map((g) => (
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

function MomentTile({ moment }: { moment: JournalPayload["sessions"][number]["moments"][number] }) {
    const [revealed, setRevealed] = useState(false);
    const src = moment.type === "screenshot" && moment.path
        ? getStorageUrl(moment.path)
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

function SessionRow({ session, onEdit, onDelete }: { session: PlaySession; onEdit: () => void; onDelete: () => void }) {
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
                        {session.moments.map((m) => <MomentTile key={m.id} moment={m} />)}
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

export default function JournalTab({ username }: { username: string }) {
    const { data, isLoading, mutate } = useSWR<{ data: JournalPayload }>(
        `/users/${username}/journal`, fetcher, { revalidateOnFocus: false }
    );

    const [view, setView] = useState<View>("sessions");
    const [composing, setComposing] = useState(false);
    const [editing, setEditing] = useState<PlaySession | null>(null);

    const journal = data?.data;

    const hours = useCountUp(journal?.summary.hours ?? 0, 1100);
    const sessionCount = useCountUp(journal?.summary.sessions ?? 0, 1100);

    const remove = async (session: PlaySession) => {
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

    return (
        <div className="space-y-4">
            {/* ── summary strip ── */}
            <div className="rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-2)] px-5 py-4">
                <div className="flex items-center gap-6 md:gap-0 md:justify-between overflow-x-auto scrollbar-none min-w-max md:min-w-0">
                    {([
                        [<Clock3 key="h" className="w-4 h-4" />, "Hours played", `${hours}`, "var(--xp-bright)", s.minutes > 0 ? hhmm(s.minutes) : null],
                        [<BookOpen key="s" className="w-4 h-4" />, "Sessions", `${sessionCount}`, "var(--accent)", null],
                        [<Gamepad2 key="g" className="w-4 h-4" />, "Games", `${s.games}`, "#34d399", null],
                        [<CalendarDays key="d" className="w-4 h-4" />, "Days logged", `${s.days}`, "#60a5fa", null],
                        [<Flame key="f" className="w-4 h-4" />, "Streak", `${s.current_streak}`, "#f97316", s.current_streak > 0 ? "days running" : "log today"],
                    ] as const).map(([icon, label, value, tint, sub], i) => (
                        <span key={label} className="flex items-center gap-3 shrink-0">
                            {i > 0 && <span aria-hidden className="hidden md:block w-px h-9 bg-white/[0.08] mr-6" />}
                            <span
                                className="w-9 h-9 rounded-[9px] flex items-center justify-center shrink-0"
                                style={{ background: `color-mix(in srgb, ${tint} 14%, transparent)`, color: tint }}
                            >
                                {icon}
                            </span>
                            <span>
                                <span className="block font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/40 whitespace-nowrap">{label}</span>
                                <span className="flex items-baseline gap-2 mt-0.5">
                                    <span className="font-display text-[19px] font-black tabular-nums leading-none text-white">{value}</span>
                                    {sub && <span className="text-[11px] text-white/30 whitespace-nowrap">{sub}</span>}
                                </span>
                            </span>
                        </span>
                    ))}

                    {s.busiest_month && (
                        <span className="flex items-center gap-3 shrink-0">
                            <span aria-hidden className="hidden md:block w-px h-9 bg-white/[0.08] mr-6" />
                            <span>
                                <span className="block font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/40 whitespace-nowrap">Busiest month</span>
                                <span className="block mt-1 text-[12px] font-semibold text-white whitespace-nowrap">
                                    {s.busiest_month.label} <span className="text-white/30">· {hhmm(s.busiest_month.minutes)}</span>
                                </span>
                            </span>
                        </span>
                    )}
                </div>
            </div>

            {journal.is_owner && !composing && !editing && (
                <button
                    onClick={() => setComposing(true)}
                    className="inline-flex items-center gap-2 h-10 px-5 rounded-[8px] bg-[var(--accent)] hover:brightness-110 text-white font-display text-[11px] font-bold uppercase tracking-[0.1em] transition-[filter]"
                >
                    <Plus className="w-4 h-4" /> Log a session
                </button>
            )}

            {(composing || editing) && (
                <SessionComposer
                    key={editing?.id ?? "new"}
                    initial={editing ? draftFromSession(editing) : emptyDraft()}
                    sessionId={editing?.id ?? null}
                    onDone={() => { setComposing(false); setEditing(null); mutate(); }}
                    onCancel={() => { setComposing(false); setEditing(null); }}
                />
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                <div className="xl:col-span-8 min-w-0 space-y-4">
                    {/* view switcher */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        {VIEWS.map((v) => (
                            <button
                                key={v.id}
                                onClick={() => setView(v.id)}
                                className={`inline-flex items-center gap-2 h-8 px-3.5 rounded-[7px] font-display text-[10.5px] font-bold uppercase tracking-[0.08em] transition-colors ${
                                    view === v.id ? "bg-[var(--accent)] text-white" : "bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.08]"
                                }`}
                            >
                                {v.icon} {v.label}
                            </button>
                        ))}
                    </div>

                    {view === "sessions" && (
                        journal.sessions.length === 0 ? (
                            <EmptyState
                                icon={<BookOpen className="w-[18px] h-[18px]" />}
                                title={journal.is_owner ? "Your journal is empty" : "No sessions logged"}
                                body={journal.is_owner ? "Log what you played and this becomes a history you'll actually want to read back." : undefined}
                            />
                        ) : (
                            <div className="space-y-2.5">
                                {journal.sessions.map((session) => (
                                    <SessionRow
                                        key={session.id}
                                        session={session}
                                        onEdit={() => { setEditing(session); setComposing(false); }}
                                        onDelete={() => remove(session)}
                                    />
                                ))}
                                {journal.total_sessions > journal.sessions.length && (
                                    <p className="pt-1 text-center font-display text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">
                                        Showing {journal.sessions.length} of {journal.total_sessions}
                                    </p>
                                )}
                            </div>
                        )
                    )}

                    {view === "calendar" && (
                        <Panel
                            title="Gaming Calendar"
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

                    {view === "completed" && (
                        <Panel title="Completed Timeline">
                            {journal.completed_timeline.length === 0 ? (
                                <EmptyState variant="compact" title="Nothing finished yet" body="Mark a game completed in your collection and it lands here." />
                            ) : (
                                <div className="relative pl-5">
                                    <span aria-hidden className="absolute left-[5px] top-2 bottom-2 w-px bg-white/[0.09]" />
                                    <div className="space-y-3">
                                        {journal.completed_timeline.map((g) => (
                                            <Link key={g.slug + g.completed_at} href={`/games/${g.slug}`} className="group relative flex items-center gap-3">
                                                <span aria-hidden className="absolute -left-5 top-1/2 -translate-y-1/2 w-[11px] h-[11px] rounded-full bg-emerald-400 border-2 border-[var(--surface-2)]" />
                                                <span className="w-[78px] h-[44px] shrink-0 rounded-[7px] overflow-hidden bg-white/[0.04]">
                                                    {g.cover_url && (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={g.cover_url} alt="" aria-hidden loading="lazy" className="w-full h-full object-cover" />
                                                    )}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-[13px] font-bold text-white truncate group-hover:text-[var(--accent)] transition-colors">{g.name}</span>
                                                    <span className="block font-display text-[10px] font-bold uppercase tracking-[0.1em] text-white/30">
                                                        {g.completed_at}
                                                        {g.hours > 0 && ` · ${g.hours}h`}
                                                    </span>
                                                </span>
                                                {g.from_backlog && (
                                                    <span className="shrink-0 inline-flex items-center gap-1 h-[19px] px-2 rounded-[4px] bg-blue-500/15 font-display text-[8px] font-black uppercase tracking-[0.1em] text-blue-400">
                                                        <Layers className="w-2.5 h-2.5" /> From backlog
                                                    </span>
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Panel>
                    )}

                    {view === "reviews" && (
                        <Panel title="Reviews">
                            {journal.reviews.length === 0 ? (
                                <EmptyState variant="compact" title="No reviews yet" body="Rate a game with a few words and it shows up here." />
                            ) : (
                                <div className="space-y-3">
                                    {journal.reviews.map((r) => (
                                        <div key={r.id} className="flex gap-3 p-3 rounded-[10px] border border-white/[0.07] bg-white/[0.02]">
                                            <Link href={`/games/${r.game.slug}`} className="w-[86px] h-[50px] shrink-0 rounded-[7px] overflow-hidden bg-white/[0.04]">
                                                {r.game.cover_url && (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={r.game.cover_url} alt="" aria-hidden loading="lazy" className="w-full h-full object-cover" />
                                                )}
                                            </Link>
                                            <div className="min-w-0 flex-1">
                                                <p className="flex items-center gap-2.5">
                                                    <Link href={`/games/${r.game.slug}`} className="text-[13px] font-bold text-white truncate hover:text-[var(--accent)] transition-colors">
                                                        {r.game.name}
                                                    </Link>
                                                    <span className="shrink-0 inline-flex items-center gap-1 font-display text-[11px] font-black tabular-nums text-amber-400">
                                                        <Star className="w-3 h-3 fill-current" /> {r.rating.toFixed(1)}
                                                    </span>
                                                    {r.created_at && (
                                                        <span className="shrink-0 font-display text-[9.5px] font-bold uppercase tracking-[0.1em] text-white/25">
                                                            {timeAgo(r.created_at)}
                                                        </span>
                                                    )}
                                                </p>
                                                {r.review && <p className="mt-1.5 text-[12.5px] text-white/55 leading-snug line-clamp-3">{r.review}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Panel>
                    )}
                </div>

                {/* ── sidebar ── */}
                <aside className="xl:col-span-4 min-w-0 space-y-4">
                    <Panel title="Where the hours went">
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
                                    {moments.map((m) => <MomentTile key={m.id} moment={m} />)}
                                </div>
                            );
                        })()}
                    </Panel>
                </aside>
            </div>
        </div>
    );
}
