"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { Shield, Users, Crown, ShieldCheck, MessageSquare, LogOut, UserPlus, Check, X, Loader2, Flame, Gamepad2, CalendarDays, Globe2, Sparkles, ChevronRight, Coins, Hourglass, Send, Castle, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Panel from "@/components/ui/Panel";
import EmptyState from "@/components/ui/EmptyState";
import Avatar from "@/components/ui/Avatar";
import { timeAgo } from "@/lib/timeAgo";
import { getStorageUrl } from "@/lib/imageUrl";
import { TIER_COLORS } from "../ClansClient";
import ManageClanModal from "@/components/clans/ManageClanModal";
import type { ClanApplicationRow, ClanProfile, ClanRosterMember } from "@/lib/types/clan";
import { Trophy } from "lucide-react";

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data);

const ROLE_META: Record<string, { label: string; color: string }> = {
    owner: { label: "Leader", color: "#f0b429" },
    officer: { label: "Officer", color: "#60a5fa" },
    member: { label: "Member", color: "rgba(255,255,255,0.45)" },
};

/** Feed types → the dot colour on the rail. */
const FEED_TINTS: Record<string, string> = {
    level_up: "#f0b429",
    member_joined: "#34d399",
    member_left: "#9ca3af",
    application_received: "#60a5fa",
};

/* ── roster row ───────────────────────────────────────────────────────── */

function RosterRow({ member }: { member: ClanRosterMember }) {
    const role = ROLE_META[member.role] ?? ROLE_META.member;

    return (
        <tr className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.015] transition-colors">
            <td className="px-4 py-2.5">
                <Link href={`/profile/${member.user.username}`} className="group flex items-center gap-3 min-w-0">
                    <span className="relative shrink-0">
                        <Avatar src={member.user.avatar} alt={member.user.username} size="sm" />
                        {member.role === "owner" && (
                            <Crown className="absolute -top-1.5 -right-1 w-3 h-3 text-[#f0b429]" />
                        )}
                    </span>
                    <span className="text-[13px] font-bold text-white truncate group-hover:text-[var(--accent)] transition-colors">
                        {member.user.username}
                    </span>
                </Link>
            </td>
            <td className="px-4 py-2.5">
                <span
                    className="inline-flex items-center h-[19px] px-2 rounded-[4px] font-display text-[8.5px] font-black uppercase tracking-[0.12em]"
                    style={{ color: role.color, background: `color-mix(in srgb, ${role.color} 13%, transparent)` }}
                >
                    {role.label}
                </span>
            </td>
            <td className="px-4 py-2.5">
                {member.in_game ? (
                    <span className="inline-flex items-center gap-1.5 font-display text-[10.5px] font-bold text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> In Game
                    </span>
                ) : member.online ? (
                    <span className="inline-flex items-center gap-1.5 font-display text-[10.5px] font-bold text-emerald-400/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online
                    </span>
                ) : (
                    <span className="font-display text-[10.5px] font-bold text-white/20">Offline</span>
                )}
            </td>
            <td className="px-4 py-2.5 text-[12px] text-white/45 max-w-[180px] truncate">
                {member.in_game ?? member.main_game ?? "—"}
            </td>
            <td className="px-4 py-2.5 text-right">
                <span className="inline-flex items-center gap-1.5 font-display text-[12px] font-black tabular-nums text-[var(--accent)]">
                    <Sparkles className="w-3 h-3" /> {member.contribution.toLocaleString("en-US")}
                </span>
            </td>
        </tr>
    );
}

/* ── applications (officers) ──────────────────────────────────────────── */

function ApplicationsPanel({ slug, onHandled }: { slug: string; onHandled: () => void }) {
    const { data, mutate } = useSWR<ClanApplicationRow[]>(`/clans/${slug}/applications`, fetcher);
    const [busy, setBusy] = useState<number | null>(null);

    const respond = async (id: number, accept: boolean) => {
        setBusy(id);
        try {
            await axios.post(`/clans/applications/${id}/respond`, { accept });
            toast.success(accept ? "Application accepted" : "Application declined");
            mutate();
            onHandled();
        } catch (e: unknown) {
            const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Couldn't handle that application.");
        } finally {
            setBusy(null);
        }
    };

    const rows = data ?? [];

    return (
        <Panel
            title="Pending Applications"
            meta={rows.length > 0 ? (
                <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-[var(--accent)] font-display text-[10px] font-black text-white tabular-nums">
                    {rows.length}
                </span>
            ) : undefined}
        >
            {rows.length === 0 ? (
                <EmptyState variant="compact" title="No applications waiting" />
            ) : (
                <div className="space-y-3">
                    {rows.map((app) => (
                        <div key={app.id} className="flex items-start gap-3">
                            <Avatar src={app.user.avatar_url} alt={app.user.username} size="sm" />
                            <div className="min-w-0 flex-1">
                                <Link href={`/profile/${app.user.username}`} className="block text-[12.5px] font-bold text-white truncate hover:text-[var(--accent)] transition-colors">
                                    {app.user.display_name || app.user.username}
                                </Link>
                                <p className="font-display text-[9.5px] font-bold uppercase tracking-[0.1em] text-white/30">
                                    {app.user.xp.toLocaleString("en-US")} XP · {timeAgo(app.created_at)}
                                </p>
                                {app.message && <p className="mt-1 text-[11.5px] text-white/45 leading-snug line-clamp-2">{app.message}</p>}
                            </div>
                            <span className="shrink-0 flex items-center gap-1">
                                <button
                                    onClick={() => respond(app.id, true)}
                                    disabled={busy === app.id}
                                    title="Accept"
                                    className="w-7 h-7 rounded-[6px] bg-emerald-500/12 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                                >
                                    {busy === app.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                    onClick={() => respond(app.id, false)}
                                    disabled={busy === app.id}
                                    title="Decline"
                                    className="w-7 h-7 rounded-[6px] bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </Panel>
    );
}

/* ── the page ─────────────────────────────────────────────────────────── */

export default function ClanDetailClient({ slug }: { slug: string }) {
    const { user } = useAuth();
    const { data: clan, isLoading, mutate } = useSWR<ClanProfile>(`/clans/${slug}`, fetcher);
    const [busy, setBusy] = useState(false);
    const [applyOpen, setApplyOpen] = useState(false);
    const [managing, setManaging] = useState(false);
    const [applyMessage, setApplyMessage] = useState("");

    const act = async (fn: () => Promise<unknown>, done: string) => {
        setBusy(true);
        try {
            await fn();
            toast.success(done);
            mutate();
        } catch (e: unknown) {
            const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "That didn't work.");
        } finally {
            setBusy(false);
        }
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-[var(--surface-0)]">
                <div className="container-page py-6 space-y-4">
                    <div className="h-[220px] rounded-[var(--radius-panel)] bg-white/[0.04] animate-pulse" />
                    <div className="h-[86px] rounded-[var(--radius-panel)] bg-white/[0.04] animate-pulse" />
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                        <div className="xl:col-span-8 h-[420px] rounded-[var(--radius-panel)] bg-white/[0.04] animate-pulse" />
                        <div className="xl:col-span-4 h-[420px] rounded-[var(--radius-panel)] bg-white/[0.04] animate-pulse" />
                    </div>
                </div>
            </main>
        );
    }

    if (!clan) {
        return (
            <main className="min-h-screen bg-[var(--surface-0)] flex items-center justify-center">
                <EmptyState icon={<Shield className="w-[18px] h-[18px]" />} title="Clan not found" action={{ label: "Browse clans", href: "/clans" }} />
            </main>
        );
    }

    // A Workshop theme, once equipped, overrides the tier tint — the clan
    // chose its colours and earned the right to.
    const tier = clan.theme_color ?? TIER_COLORS[clan.tier_name] ?? TIER_COLORS.Outpost;
    const viewer = clan.viewer;
    const isMember = !!viewer?.role;
    const isOfficer = viewer?.role === "owner" || viewer?.role === "officer";
    const status = clan.status ?? "recruiting";
    const onlineNow = clan.roster.filter((m) => m.online || m.in_game);

    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            {/* ── header ── */}
            <div className="relative overflow-hidden border-b border-white/[0.07]">
                {clan.banner ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getStorageUrl(clan.banner)} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-30" />
                        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[var(--surface-0)] via-[var(--surface-0)]/70 to-transparent" />
                    </>
                ) : (
                    <span
                        aria-hidden
                        className="absolute inset-0"
                        style={{ background: `radial-gradient(100% 150% at 20% 0%, color-mix(in srgb, ${tier} 14%, transparent), transparent 60%)` }}
                    />
                )}

                <div className="relative z-10 container-page pt-8 pb-7">
                    <p className="flex items-center gap-2 font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/30 mb-5">
                        <Link href="/clans" className="hover:text-white transition-colors">Clans</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-[var(--accent)]">{clan.name}</span>
                    </p>

                    <div className="flex flex-wrap items-start gap-6">
                        {/* emblem */}
                        <span
                            className="relative w-[104px] h-[104px] shrink-0 rounded-[18px] border-2 bg-[var(--surface-1)] overflow-hidden flex items-center justify-center"
                            style={{ borderColor: tier, boxShadow: `0 0 34px color-mix(in srgb, ${tier} 30%, transparent)` }}
                        >
                            {clan.logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={getStorageUrl(clan.logo)} alt={clan.name} className="w-full h-full object-cover" />
                            ) : (
                                <Shield className="w-11 h-11" style={{ color: tier }} />
                            )}
                        </span>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="font-display text-[30px] md:text-[36px] font-black text-white tracking-tight leading-none">
                                    {clan.name}
                                </h1>
                                {clan.tag && <span className="font-display text-[15px] font-black text-[var(--accent)]">[{clan.tag}]</span>}
                            </div>

                            {clan.motto && <p className="mt-2 text-[14px] italic text-white/55">&ldquo;{clan.motto}&rdquo;</p>}
                            {clan.description && <p className="mt-1.5 text-[12.5px] text-white/40 leading-relaxed max-w-2xl">{clan.description}</p>}

                            <div className="mt-4 flex items-center gap-5 flex-wrap font-display text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">
                                {clan.region && <span className="inline-flex items-center gap-1.5"><Globe2 className="w-3.5 h-3.5" /> {clan.region}</span>}
                                <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> Founded {new Date(clan.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
                                <span className="inline-flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {clan.members_count} / {clan.member_limit}</span>
                                <span className="inline-flex items-center gap-1.5" style={{ color: tier }}>
                                    <ShieldCheck className="w-3.5 h-3.5" /> {clan.tier_name} · Level {clan.level}
                                </span>
                                {status === "recruiting" ? (
                                    <span className="inline-flex items-center gap-1.5 text-emerald-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Recruiting
                                    </span>
                                ) : (
                                    <span className="text-white/30">{status === "closed" ? "Closed" : "Invite only"}</span>
                                )}
                            </div>
                        </div>

                        {/* actions */}
                        <div className="flex flex-col gap-2 shrink-0">
                            {isMember ? (
                                <>
                                    {isOfficer && (
                                        <button
                                            onClick={() => setManaging(true)}
                                            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-[8px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white font-display text-[10.5px] font-bold uppercase tracking-[0.1em] transition-colors"
                                        >
                                            <Settings className="w-4 h-4" /> Manage clan
                                        </button>
                                    )}
                                    <Link
                                        href={`/clans/${clan.slug}/base`}
                                        className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-[8px] bg-[var(--accent)] hover:brightness-110 text-white font-display text-[10.5px] font-bold uppercase tracking-[0.1em] transition-[filter]"
                                    >
                                        <Castle className="w-4 h-4" /> Clan Base
                                    </Link>
                                    <Link
                                        href={`/forum?category=${clan.forum_slug}`}
                                        className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-[8px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white font-display text-[10.5px] font-bold uppercase tracking-[0.1em] transition-colors"
                                    >
                                        <MessageSquare className="w-4 h-4" /> Clan Chat
                                    </Link>
                                    {viewer?.role !== "owner" && (
                                        <button
                                            onClick={() => act(() => axios.delete(`/clans/${clan.slug}/leave`), "You left the clan.")}
                                            disabled={busy}
                                            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-[8px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white/70 font-display text-[10.5px] font-bold uppercase tracking-[0.1em] transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" /> Leave
                                        </button>
                                    )}
                                </>
                            ) : viewer?.application_pending ? (
                                <span className="inline-flex items-center gap-2 h-10 px-5 rounded-[8px] bg-white/[0.05] border border-white/[0.1] font-display text-[10.5px] font-bold uppercase tracking-[0.1em] text-white/50">
                                    <Hourglass className="w-4 h-4" /> Application pending
                                </span>
                            ) : user && !viewer?.in_other_clan && status !== "closed" ? (
                                status === "recruiting" ? (
                                    <button
                                        onClick={() => act(() => axios.post(`/clans/${clan.slug}/join`), "Welcome to the clan!")}
                                        disabled={busy}
                                        className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-[8px] bg-[var(--accent)] hover:brightness-110 text-white font-display text-[10.5px] font-bold uppercase tracking-[0.1em] transition-[filter]"
                                    >
                                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Join clan
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setApplyOpen(true)}
                                        className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-[8px] bg-[var(--accent)] hover:brightness-110 text-white font-display text-[10.5px] font-bold uppercase tracking-[0.1em] transition-[filter]"
                                    >
                                        <Send className="w-4 h-4" /> Apply
                                    </button>
                                )
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-page py-5 space-y-4">
                {/* ── stat strip ── */}
                <div className="rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-2)] px-5 py-4">
                    <div className="flex items-center gap-6 md:gap-0 md:justify-between overflow-x-auto scrollbar-none min-w-max md:min-w-0">
                        {([
                            [<Users key="m" className="w-4 h-4" />, "Members", `${clan.members_count}`, "var(--accent)", clan.online_count > 0 ? `${clan.online_count} online` : null],
                            [<Crown key="p" className="w-4 h-4" />, "Prestige", clan.resources.prestige_lifetime.toLocaleString("en-US"), "#a855f7", null],
                            [<ShieldCheck key="l" className="w-4 h-4" />, "Level", `${clan.level}`, tier, clan.tier_name],
                            [<Flame key="a" className="w-4 h-4" />, "Activity Score", clan.activity_score.toLocaleString("en-US"), "#34d399", "last 7 days"],
                            [<Coins key="i" className="w-4 h-4" />, "Intel", clan.resources.intel.toLocaleString("en-US"), "#60a5fa", null],
                            [<Coins key="t" className="w-4 h-4" />, "Materials", clan.resources.materials.toLocaleString("en-US"), "#f0b429", null],
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
                                        <span className="font-display text-[18px] font-black tabular-nums leading-none text-white">{value}</span>
                                        {sub && <span className="text-[10.5px] text-white/30 whitespace-nowrap">{sub}</span>}
                                    </span>
                                </span>
                            </span>
                        ))}

                        {/* level progress cell */}
                        <span className="flex items-center gap-3 shrink-0 min-w-[170px]">
                            <span aria-hidden className="hidden md:block w-px h-9 bg-white/[0.08] mr-6" />
                            <span className="flex-1">
                                <span className="flex items-center justify-between gap-2 mb-1.5">
                                    <span className="font-display text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">Next level</span>
                                    <span className="font-display text-[9.5px] font-bold tabular-nums text-white/35">
                                        {clan.progress.xp.toLocaleString("en-US")} / {clan.progress.next_level_xp.toLocaleString("en-US")}
                                    </span>
                                </span>
                                <span className="block h-[6px] rounded-full bg-[var(--track)] overflow-hidden">
                                    <span
                                        className="block h-full rounded-full transition-[width] duration-700 ease-[var(--ease-hud)]"
                                        style={{ width: `${clan.progress.percent}%`, background: `linear-gradient(90deg, ${tier}90, ${tier})` }}
                                    />
                                </span>
                            </span>
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                    {/* ── left: feed + roster ── */}
                    <div className="xl:col-span-8 min-w-0 space-y-4">
                        <Panel title="Clan Feed">
                            {clan.feed.length === 0 ? (
                                <EmptyState
                                    variant="compact"
                                    title="Nothing has happened yet"
                                    body="Reviews, completions, achievements and new members all land here."
                                />
                            ) : (
                                <div className="space-y-3">
                                    {clan.feed.map((item) => (
                                        <div key={item.id} className="flex items-center gap-3">
                                            <span
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ background: FEED_TINTS[item.type] ?? "var(--accent)" }}
                                            />
                                            <span className="min-w-0 flex-1 text-[12.5px] text-white/70 truncate">{item.title}</span>
                                            <span className="shrink-0 font-display text-[9.5px] font-bold uppercase tracking-[0.1em] text-white/25">
                                                {timeAgo(item.created_at)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Panel>

                        <Panel
                            title="Clan Roster"
                            meta={<span className="font-display text-[11px] font-black tabular-nums text-white/35">{clan.members_count} members</span>}
                            padding="none"
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[640px] text-left">
                                    <thead>
                                        <tr className="border-b border-white/[0.07]">
                                            {["Member", "Role", "Status", "Main Game", "Contribution"].map((h, i) => (
                                                <th key={h} className={`px-4 py-2.5 font-display text-[9px] font-bold uppercase tracking-[0.14em] text-white/35 ${i === 4 ? "text-right" : ""}`}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clan.roster.map((m) => <RosterRow key={m.user.username} member={m} />)}
                                    </tbody>
                                </table>
                            </div>
                        </Panel>

                        {/* clan games */}
                        {clan.clan_games.length > 0 && (
                            <Panel title="Clan Games">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {clan.clan_games.map((g) => (
                                        <Link
                                            key={g.slug}
                                            href={`/games/${g.slug}`}
                                            className="group relative h-[86px] rounded-[10px] overflow-hidden border border-white/[0.07] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors"
                                        >
                                            {g.cover_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={g.cover_url} alt="" aria-hidden loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:opacity-75 group-hover:scale-[1.04] transition-[opacity,transform] duration-500" />
                                            ) : (
                                                <span className="absolute inset-0 bg-white/[0.03]" />
                                            )}
                                            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                                            <span className="absolute inset-x-0 bottom-0 p-2.5">
                                                <span className="block font-display text-[12px] font-bold text-white truncate">{g.name}</span>
                                                <span className="block font-display text-[9px] font-bold uppercase tracking-[0.1em] text-emerald-400/90">
                                                    {g.percent}% of members
                                                </span>
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </Panel>
                        )}
                    </div>

                    {/* ── right: about, contributors, applications, online ── */}
                    <aside className="xl:col-span-4 min-w-0 space-y-4">
                        <Panel title="About Clan">
                            {clan.description && <p className="text-[12.5px] text-white/55 leading-relaxed mb-4">{clan.description}</p>}
                            <div className="grid grid-cols-2 gap-3">
                                {([
                                    ["Playstyle", clan.playstyle, Sparkles],
                                    ["Region", clan.region, Globe2],
                                    ["Language", clan.language, MessageSquare],
                                    ["Focus", clan.focus, Gamepad2],
                                ] as const).filter(([, v]) => v).map(([label, value, Icon]) => (
                                    <div key={label} className="p-2.5 rounded-[9px] border border-white/[0.06] bg-white/[0.02]">
                                        <p className="flex items-center gap-1.5 font-display text-[8.5px] font-bold uppercase tracking-[0.14em] text-white/35">
                                            <Icon className="w-3 h-3" /> {label}
                                        </p>
                                        <p className="mt-1 text-[12px] font-bold text-white capitalize">{value}</p>
                                    </div>
                                ))}
                            </div>
                            {clan.requirements && (
                                <p className="mt-3 pt-3 border-t border-white/[0.07] text-[11.5px] text-white/40 leading-snug">
                                    <span className="font-display text-[9px] font-black uppercase tracking-[0.12em] text-white/50 block mb-1">Requirements</span>
                                    {clan.requirements}
                                </p>
                            )}
                        </Panel>

                        <Panel title="Top Contributors" meta={<span className="font-display text-[9.5px] font-bold uppercase tracking-[0.1em] text-white/30">This week</span>}>
                            {clan.top_contributors.length === 0 ? (
                                <EmptyState variant="compact" title="Nobody has earned this week yet" body="Reviews, completions and achievements all count." />
                            ) : (
                                <div className="space-y-2.5">
                                    {clan.top_contributors.map((m, i) => (
                                        <Link key={m.user.username} href={`/profile/${m.user.username}`} className="group flex items-center gap-3">
                                            <span className={`w-5 shrink-0 font-display text-[11px] font-black tabular-nums ${i === 0 ? "text-[#f0b429]" : "text-white/25"}`}>{i + 1}</span>
                                            <Avatar src={m.user.avatar} alt={m.user.username} size="sm" />
                                            <span className="min-w-0 flex-1 text-[12.5px] font-semibold text-white truncate group-hover:text-[var(--accent)] transition-colors">
                                                {m.user.username}
                                            </span>
                                            <span className="shrink-0 font-display text-[11.5px] font-black tabular-nums text-[var(--accent)]">
                                                {m.contribution_week.toLocaleString("en-US")}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </Panel>

                        {clan.trophies.length > 0 && (
                            <Panel title="Clan Trophies">
                                <div className="space-y-2.5">
                                    {clan.trophies.map((t) => (
                                        <div key={t.id} className="flex items-center gap-3">
                                            <span className="w-8 h-8 shrink-0 rounded-[8px] bg-[#f0b429]/12 border border-[#f0b429]/30 flex items-center justify-center">
                                                <Trophy className="w-3.5 h-3.5 text-[#f0b429]" />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block text-[12.5px] font-bold text-white leading-snug">{t.title}</span>
                                                <span className="block font-display text-[9px] font-bold uppercase tracking-[0.1em] text-white/30">
                                                    {new Date(t.awarded_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                                                </span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Panel>
                        )}

                        {isOfficer && <ApplicationsPanel slug={clan.slug} onHandled={() => mutate()} />}

                        <Panel
                            title="Online Now"
                            meta={<span className="font-display text-[11px] font-black tabular-nums text-emerald-400">{onlineNow.length}</span>}
                        >
                            {onlineNow.length === 0 ? (
                                <EmptyState variant="compact" title="Nobody online right now" />
                            ) : (
                                <div className="space-y-2.5">
                                    {onlineNow.slice(0, 6).map((m) => (
                                        <Link key={m.user.username} href={`/profile/${m.user.username}`} className="group flex items-center gap-3">
                                            <Avatar src={m.user.avatar} alt={m.user.username} size="sm" online />
                                            <span className="min-w-0 flex-1 text-[12.5px] font-semibold text-white truncate group-hover:text-[var(--accent)] transition-colors">
                                                {m.user.username}
                                            </span>
                                            <span className={`shrink-0 font-display text-[9px] font-black uppercase tracking-[0.1em] ${m.in_game ? "text-emerald-400" : "text-white/30"}`}>
                                                {m.in_game ? "In Game" : "Online"}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </Panel>
                    </aside>
                </div>
            </div>

            {managing && (
                <ManageClanModal
                    clan={clan}
                    isOwner={viewer?.role === "owner"}
                    onClose={() => setManaging(false)}
                    onSaved={() => mutate()}
                />
            )}

            {/* ── apply modal ── */}
            {applyOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={() => setApplyOpen(false)}>
                    <div className="w-full max-w-md rounded-[14px] border border-white/[0.1] bg-[var(--surface-2)] p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="font-display text-[15px] font-black text-white mb-1.5">Apply to {clan.name}</h2>
                        <p className="text-[12px] text-white/40 mb-4">An officer will review your application.</p>
                        <textarea
                            value={applyMessage}
                            onChange={(e) => setApplyMessage(e.target.value.slice(0, 500))}
                            rows={3}
                            placeholder="Why do you want to join? (optional)"
                            className="w-full px-3 py-2.5 rounded-[8px] bg-white/[0.04] border border-white/[0.09] text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] resize-none"
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                onClick={() => setApplyOpen(false)}
                                className="h-9 px-4 rounded-[8px] bg-white/[0.05] text-white/60 font-display text-[10px] font-bold uppercase tracking-[0.1em]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setApplyOpen(false);
                                    act(() => axios.post(`/clans/${clan.slug}/apply`, { message: applyMessage || null }), "Application sent.");
                                }}
                                disabled={busy}
                                className="inline-flex items-center gap-2 h-9 px-5 rounded-[8px] bg-[var(--accent)] hover:brightness-110 text-white font-display text-[10px] font-bold uppercase tracking-[0.1em] transition-[filter]"
                            >
                                <Send className="w-3.5 h-3.5" /> Send application
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
