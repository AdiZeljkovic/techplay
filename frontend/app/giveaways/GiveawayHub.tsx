"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import {
    Gift, Gem, Trophy, Users, Timer, ArrowRight, Lock, Check, Globe, Sparkles, Zap, LayoutGrid, History,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

/* ── shapes, read off the endpoints rather than assumed ───────────────── */

interface Row {
    id: number;
    slug: string;
    title: string;
    description: string | null;
    featured_image: string | null;
    prize: { name: string | null; value: number | string | null; image: string | null };
    timing: { starts_at: string | null; ends_at: string | null; is_active: boolean; has_ended: boolean };
    stats: { total_entries: number; entry_goal: number | null };
    platform: string | null;
    prize_type: string | null;
    region: string | null;
    entry_type: string | null;
    winner: { username: string; avatar: string | null } | null;
    status: string;
}

interface Facet { value: string; label: string; count: number }

interface Hub {
    stats: { active: number; prize_value: number; winners: number; participants: number };
    facets: Record<"platform" | "prize_type" | "region" | "entry_type", Facet[]>;
    featured: {
        slug: string; title: string; description: string | null; featured_image: string | null;
        prize: { name: string | null; value: number | string | null; image: string | null };
        ends_at: string | null; entries: number; entry_goal: number | null;
        region: string | null; entry_type: string | null;
    } | null;
    recent_winners: {
        slug: string; title: string; prize: string | null; announced_at: string | null;
        winner: { username: string; avatar: string | null } | null;
    }[];
    mine: { total: number; active: number; won: number; ended: number } | null;
}

const FILTER_GROUPS = [
    { key: "platform", label: "Platform" },
    { key: "prize_type", label: "Prize type" },
    { key: "region", label: "Region" },
    { key: "entry_type", label: "Entry type" },
] as const;

/* ── a countdown that stops rather than counting into the past ────────── */

function useCountdown(iso: string | null) {
    const [left, setLeft] = useState<number | null>(null);

    useEffect(() => {
        if (!iso) return;

        const tick = () => setLeft(Math.max(0, new Date(iso).getTime() - Date.now()));
        tick();

        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [iso]);

    if (left === null) return null;

    const s = Math.floor(left / 1000);
    return {
        done: left === 0,
        days: Math.floor(s / 86400),
        hours: Math.floor((s % 86400) / 3600),
        mins: Math.floor((s % 3600) / 60),
        secs: s % 60,
    };
}

function Countdown({ endsAt, big = false }: { endsAt: string | null; big?: boolean }) {
    const c = useCountdown(endsAt);

    if (!c) return null;

    if (c.done) {
        return (
            <span className="font-display text-[11px] font-black uppercase tracking-[0.12em] text-white/35">
                Closed
            </span>
        );
    }

    const cells = [
        { n: c.days, unit: "Days" },
        { n: c.hours, unit: "Hrs" },
        { n: c.mins, unit: "Mins" },
        { n: c.secs, unit: "Secs" },
    ];

    if (!big) {
        return (
            <span className="font-display text-[11.5px] font-black tabular-nums text-white/70">
                {cells.map((c) => String(c.n).padStart(2, "0")).join(" : ")}
            </span>
        );
    }

    return (
        <div className="flex items-center gap-2.5">
            {cells.map((cell) => (
                <span key={cell.unit} className="text-center">
                    <span className="block font-display text-[26px] font-black tabular-nums text-white leading-none">
                        {String(cell.n).padStart(2, "0")}
                    </span>
                    <span className="block mt-1 font-display text-[8.5px] font-bold uppercase tracking-[0.14em] text-white/35">
                        {cell.unit}
                    </span>
                </span>
            ))}
        </div>
    );
}

/* ── the page ─────────────────────────────────────────────────────────── */

export default function GiveawayHub() {
    const { user } = useAuth();

    const [status, setStatus] = useState<"active" | "all" | "ended">("active");
    const [picked, setPicked] = useState<Record<string, string>>({});

    const { data: hubBody } = useSWR<{ data: Hub }>("/giveaways/hub", fetcher, { revalidateOnFocus: false });
    const hub = hubBody?.data;

    const query = useMemo(() => {
        const q = new URLSearchParams({ status });
        Object.entries(picked).forEach(([k, v]) => v && q.set(k, v));
        return q.toString();
    }, [status, picked]);

    const { data: listBody, isLoading } = useSWR<{ data: Row[]; meta: { total: number } }>(
        `/giveaways?${query}`,
        fetcher,
        { keepPreviousData: true },
    );

    const rows = listBody?.data ?? [];
    const money = (v: number | string | null | undefined) => {
        const n = Number(v ?? 0);
        return n > 0 ? `${n.toLocaleString("en-US", { maximumFractionDigits: 0 })} KM` : null;
    };

    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            {/* ── hero ── */}
            <section className="relative overflow-hidden border-b border-white/[0.07]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/page-hero.webp"
                    alt=""
                    aria-hidden
                    className="absolute inset-0 w-full h-full object-cover object-center"
                />
                <span aria-hidden className="absolute inset-0 bg-[radial-gradient(58%_120%_at_50%_45%,rgba(5,7,10,0.82),rgba(5,7,10,0.55)_72%)]" />
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--surface-0)] to-transparent" />

                <div className="relative z-10 container-page py-12 text-center">
                    <h1 className="font-display font-black tracking-tight text-[44px] md:text-[60px] leading-none text-white">
                        GIVE<span className="text-[var(--accent)]">AWAYS</span>
                    </h1>
                    <p className="mt-2.5 text-[13px] text-white/45">
                        Win gaming prizes, collector rewards and exclusive keys.
                    </p>

                    {/* Four figures, all of them counted — in the same pill
                        row the forum and the social hub use. */}
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                        {([
                            [Gift, hub ? String(hub.stats.active) : "—", "Active"],
                            [Gem, hub ? (money(hub.stats.prize_value) ?? "—") : "—", "In prizes"],
                            [Trophy, hub ? String(hub.stats.winners) : "—", "Winners"],
                            [Users, hub ? hub.stats.participants.toLocaleString() : "—", "Taking part"],
                        ] as const).map(([Icon, value, label]) => (
                            <span
                                key={label}
                                className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm"
                            >
                                <Icon className="w-3.5 h-3.5 text-[var(--accent)]" />
                                <span className="font-display text-[12px] font-black tabular-nums text-white leading-none">{value}</span>
                                <span className="font-display text-[9px] font-bold uppercase tracking-[0.12em] text-white/35">{label}</span>
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            <div className="container-page py-6 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
                <div className="min-w-0">
                    {/* ── filter row ── */}
                    <div className="flex flex-wrap items-center gap-3 mb-5">
                        <div className="flex flex-wrap gap-1.5 p-1.5 rounded-[12px] border border-white/[0.07] bg-[var(--surface-1)]">
                            {([
                                ["active", "Active", Zap],
                                ["all", "All", LayoutGrid],
                                ["ended", "Ended", History],
                            ] as const).map(([id, label, Icon]) => (
                                <button
                                    key={id}
                                    onClick={() => setStatus(id)}
                                    aria-pressed={status === id}
                                    className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-[8px] font-display text-[11px] font-bold uppercase tracking-[0.06em] transition-colors duration-200 ${
                                        status === id ? "bg-[var(--accent)] text-white" : "text-white/45 hover:text-white hover:bg-white/[0.05]"
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" /> {label}
                                </button>
                            ))}
                        </div>

                        {/* Only groups an editor has actually filled in — a
                            filter with nothing behind it is a dead control. */}
                        {FILTER_GROUPS.map((group) => {
                            const options = hub?.facets[group.key] ?? [];
                            if (!options.length) return null;

                            return (
                                <select
                                    key={group.key}
                                    value={picked[group.key] ?? ""}
                                    onChange={(e) => setPicked((p) => ({ ...p, [group.key]: e.target.value }))}
                                    className="h-8 px-2.5 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-[11.5px] text-white/70 outline-none"
                                >
                                    <option value="" className="bg-[var(--surface-0)]">{group.label}</option>
                                    {options.map((o) => (
                                        <option key={o.value} value={o.value} className="bg-[var(--surface-0)]">
                                            {o.label} ({o.count})
                                        </option>
                                    ))}
                                </select>
                            );
                        })}
                    </div>

                    {/* ── featured ── */}
                    {hub?.featured && (
                        <Featured featured={hub.featured} money={money} />
                    )}

                    {/* ── the grid ── */}
                    {isLoading && !rows.length ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <span key={i} className="block h-[230px] rounded-[12px] bg-white/[0.03] animate-pulse" />
                            ))}
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="py-16 text-center">
                            <Gift className="w-7 h-7 mx-auto mb-3 text-white/15" />
                            <p className="font-display text-[13.5px] font-bold text-white">
                                {status === "active" ? "No giveaways running right now" : "Nothing here yet"}
                            </p>
                            <p className="mt-1.5 text-[12px] text-white/35">
                                {status === "active"
                                    ? "When the next one opens it lands here first."
                                    : "Try a different filter."}
                            </p>
                            {/* Landing on Active with nothing running left the page
                                blank and offered nothing to do about it. */}
                            {status === "active" && (
                                <button
                                    onClick={() => setStatus("all")}
                                    className="mt-4 inline-flex items-center h-9 px-5 rounded-[9px] bg-white/[0.05] hover:bg-white/[0.1] font-display text-[10px] font-black uppercase tracking-[0.1em] text-white/60 hover:text-white transition-colors"
                                >
                                    See past giveaways
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {rows.map((row) => <Card key={row.id} row={row} />)}
                        </div>
                    )}
                </div>

                {/* ── right rail ── */}
                {/* 96px clears the 72px fixed header — same reason as the rail
                    in SectionHub, which had the identical offset. */}
                <aside className="space-y-4 xl:sticky xl:top-24">
                    <Panel title="How it works">
                        <ol className="space-y-3">
                            {[
                                { t: "Find one you want", d: "Browse what is running and pick your prizes." },
                                { t: "Do what it asks", d: "Some are a single click; some have tasks worth extra entries." },
                                { t: "Winners are drawn", d: "Announced here and on your profile when the draw closes." },
                            ].map((step, i) => (
                                <li key={step.t} className="flex gap-2.5">
                                    <span className="shrink-0 w-5 h-5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-display text-[10px] font-black flex items-center justify-center">
                                        {i + 1}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-[12px] font-bold text-white">{step.t}</span>
                                        <span className="block text-[11.5px] text-white/40 leading-snug">{step.d}</span>
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </Panel>

                    <Panel title="Recent winners">
                        {hub?.recent_winners.length ? (
                            <div className="space-y-3">
                                {hub.recent_winners.map((w) => (
                                    <Link key={w.slug} href={`/giveaway/${w.slug}`} className="flex items-center gap-2.5 group">
                                        <span className="w-7 h-7 shrink-0 rounded-full overflow-hidden bg-white/[0.06]">
                                            {w.winner?.avatar && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={w.winner.avatar} alt="" aria-hidden className="w-full h-full object-cover" />
                                            )}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[12px] font-bold text-white truncate group-hover:text-[var(--accent)]">
                                                {w.winner?.username ?? "Winner"}
                                            </span>
                                            <span className="block text-[11px] text-white/35 truncate">
                                                Won {w.prize ?? w.title}
                                            </span>
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[11.5px] text-white/30">
                                No draws have been settled yet — the first winner shows up here.
                            </p>
                        )}
                    </Panel>

                    <Panel title="Your entries">
                        {!user ? (
                            <p className="text-[11.5px] text-white/30">
                                <Link href="/login" className="text-[var(--accent)] hover:brightness-110">Sign in</Link>{" "}
                                to keep track of what you have entered.
                            </p>
                        ) : hub?.mine ? (
                            <div className="grid grid-cols-4 gap-2 text-center">
                                <Tally value={hub.mine.total} label="Total" />
                                <Tally value={hub.mine.active} label="Active" />
                                <Tally value={hub.mine.won} label="Won" />
                                <Tally value={hub.mine.ended} label="Ended" />
                            </div>
                        ) : (
                            <p className="text-[11.5px] text-white/30">You have not entered anything yet.</p>
                        )}
                    </Panel>
                </aside>
            </div>
        </main>
    );
}

/* ── pieces ───────────────────────────────────────────────────────────── */

function Tally({ value, label }: { value: number; label: string }) {
    return (
        <span className="block">
            <span className="block font-display text-[17px] font-black tabular-nums text-white leading-none">{value}</span>
            <span className="block mt-1 text-[9.5px] uppercase tracking-[0.1em] text-white/35">{label}</span>
        </span>
    );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-[13px] border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="mb-3 font-display text-[10px] font-black uppercase tracking-[0.14em] text-white">
                {title}
            </p>
            {children}
        </div>
    );
}

function Featured({
    featured, money,
}: { featured: NonNullable<Hub["featured"]>; money: (v: number | string | null | undefined) => string | null }) {
    const pct = featured.entry_goal
        ? Math.min(100, Math.round((featured.entries / featured.entry_goal) * 100))
        : null;

    return (
        <div className="mb-5 rounded-[14px] border border-[color-mix(in_srgb,var(--accent)_28%,transparent)] bg-gradient-to-br from-[color-mix(in_srgb,var(--accent)_10%,var(--surface-2))] to-[var(--surface-0)] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_auto] gap-5 p-5 items-center">
                <span className="relative block h-[170px] rounded-[10px] overflow-hidden bg-white/[0.04]">
                    {(featured.prize.image ?? featured.featured_image) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={(featured.prize.image ?? featured.featured_image) as string}
                            alt={featured.title}
                            className="w-full h-full object-cover"
                        />
                    )}
                    <span className="absolute top-2.5 left-2.5 inline-flex items-center h-[21px] px-2 rounded-[5px] bg-[var(--accent)] font-display text-[9px] font-black uppercase tracking-[0.1em] text-white">
                        Featured
                    </span>
                </span>

                <div className="min-w-0">
                    <h2 className="font-display text-[24px] font-black uppercase tracking-tight text-white leading-none">
                        {featured.title}
                    </h2>
                    {featured.description && (
                        <p className="mt-2 text-[12.5px] text-white/45 leading-snug line-clamp-2">{featured.description}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] text-white/45">
                        {featured.region && (
                            <span className="inline-flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> {featured.region}</span>
                        )}
                        {featured.entry_type && (
                            <span className="inline-flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> {featured.entry_type}</span>
                        )}
                        {money(featured.prize.value) && (
                            <span className="inline-flex items-center gap-1.5 text-white/60">
                                <Gem className="w-3.5 h-3.5" /> {money(featured.prize.value)}
                            </span>
                        )}
                    </div>

                    {/* A bar only where somebody set a target. */}
                    {pct !== null ? (
                        <div className="mt-4">
                            <span className="block h-[7px] rounded-full bg-white/[0.07] overflow-hidden">
                                <span className="block h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
                            </span>
                            <p className="mt-1.5 font-display text-[10.5px] font-bold tabular-nums text-white/40">
                                {featured.entries.toLocaleString()} / {featured.entry_goal!.toLocaleString()} entries · {pct}%
                            </p>
                        </div>
                    ) : (
                        <p className="mt-4 font-display text-[10.5px] font-bold tabular-nums text-white/40">
                            {featured.entries.toLocaleString()} {featured.entries === 1 ? "entry" : "entries"} so far
                        </p>
                    )}
                </div>

                <div className="flex flex-col items-center gap-3 lg:pl-4">
                    <span className="font-display text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Ends in</span>
                    <Countdown endsAt={featured.ends_at} big />
                    <Link
                        href={`/giveaway/${featured.slug}`}
                        className="mt-1 inline-flex items-center justify-center gap-2 h-10 px-7 rounded-[9px] bg-[var(--accent)] hover:brightness-110 font-display text-[11px] font-black uppercase tracking-[0.1em] text-white transition-all"
                    >
                        Enter giveaway <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

function Card({ row }: { row: Row }) {
    const ended = row.timing.has_ended || row.status === "ended";
    const closingSoon = !ended && row.timing.ends_at
        ? new Date(row.timing.ends_at).getTime() - Date.now() < 86_400_000
        : false;

    const badge = ended
        ? { label: "Ended", cls: "bg-white/[0.1] text-white/50" }
        : closingSoon
        ? { label: "Ending soon", cls: "bg-amber-500 text-black" }
        : row.entry_type === "members"
        ? { label: "Members only", cls: "bg-violet-500 text-white" }
        : { label: "Live", cls: "bg-emerald-500 text-black" };

    return (
        <Link
            href={`/giveaway/${row.slug}`}
            className="group flex flex-col rounded-[12px] border border-white/[0.07] bg-white/[0.02] overflow-hidden hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors"
        >
            <span className="relative block h-[132px] bg-white/[0.04]">
                {(row.prize.image ?? row.featured_image) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={(row.prize.image ?? row.featured_image) as string}
                        alt={row.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    />
                )}
                <span className={`absolute top-2 left-2 inline-flex items-center h-[20px] px-2 rounded-[5px] font-display text-[8.5px] font-black uppercase tracking-[0.1em] ${badge.cls}`}>
                    {badge.label}
                </span>
                {row.entry_type === "members" && (
                    <span className="absolute top-2 right-2 text-white/60"><Lock className="w-3.5 h-3.5" /></span>
                )}
            </span>

            <span className="flex-1 flex flex-col p-3">
                <span className="font-display text-[12.5px] font-black text-white leading-tight line-clamp-2">
                    {row.title}
                </span>
                {row.prize.name && (
                    <span className="mt-1 text-[11px] text-white/40 line-clamp-1">{row.prize.name}</span>
                )}

                <span className="mt-auto pt-3 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10.5px] text-white/35">
                        <Users className="w-3 h-3" /> {row.stats.total_entries.toLocaleString()}
                    </span>
                    {ended ? (
                        row.winner ? (
                            <span className="inline-flex items-center gap-1 font-display text-[9.5px] font-black uppercase tracking-[0.08em] text-emerald-400">
                                <Check className="w-3 h-3" /> Won
                            </span>
                        ) : null
                    ) : (
                        <span className="inline-flex items-center gap-1.5">
                            <Timer className="w-3 h-3 text-white/30" />
                            <Countdown endsAt={row.timing.ends_at} />
                        </span>
                    )}
                </span>
            </span>
        </Link>
    );
}
