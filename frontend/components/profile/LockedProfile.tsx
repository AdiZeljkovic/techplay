"use client";

import Link from "next/link";
import { Lock, User as UserIcon, UserPlus, Clock, Check, CalendarDays, ShieldCheck } from "lucide-react";
import type { FriendStatus } from "@/lib/types/profile";
import { PROFILE_TABS } from "@/lib/profileTabs";
import { xpForLevel } from "@/lib/level";
import { RankInsigniaMark, XpRail } from "@/components/home-dashboard/RankInsignia";

interface Props {
    username: string;
    displayName: string;
    avatarUrl: string | null;
    coverImage: string | null;
    level: number;
    rankName: string | null;
    rankColor: string | null;
    /** The struck insignia the open profile wears, not a stand-in for it. */
    rankIcon: string | null;
    rankMinXp: number;
    xp: number;
    joinedAt: string | null;
    friendStatus: FriendStatus;
    viewerSignedIn: boolean;
    busy: boolean;
    onAddFriend: () => void;
}

/**
 * A friends-only profile, seen by somebody who is not a friend yet.
 *
 * A doorway rather than a dead end: identity and standing stay visible so there
 * is a reason to knock, and everything they own, play or wrote does not.
 *
 * It used to be one centred card floating in the middle of an empty page —
 * avatar, name, a paragraph, a button — which reads as an error state rather
 * than a person. Someone arriving here followed a link to a profile and was
 * shown a notice. It keeps the real profile's shape now: the same header band
 * the open version has, and under it the sections that exist, named and shut,
 * so the request being asked for has something behind it.
 *
 * Nothing here invents content. The shut panels carry a label and a lock, never
 * a blurred number somebody might read as a fact.
 */
export default function LockedProfile({
    username,
    displayName,
    avatarUrl,
    coverImage,
    level,
    rankName,
    rankColor,
    rankIcon,
    rankMinXp,
    xp,
    joinedAt,
    friendStatus,
    viewerSignedIn,
    busy,
    onAddFriend,
}: Props) {
    // Where they sit inside their own rank band, not across the whole ladder:
    // the same reading the open profile's gauge takes.
    const nextAt = xpForLevel(level + 1);
    const bandFloor = Math.max(rankMinXp, xpForLevel(level));
    const bandPercent = nextAt > bandFloor
        ? Math.max(0, Math.min(100, Math.round(((xp - bandFloor) / (nextAt - bandFloor)) * 100)))
        : 0;

    const action = !viewerSignedIn ? (
        <Link
            href="/login"
            className="btn-command inline-flex items-center gap-2 px-5 h-11 bg-[var(--accent)] text-white font-display text-[11px] font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors duration-300"
        >
            <UserPlus className="w-4 h-4" /> Sign in to send a request
        </Link>
    ) : friendStatus === "pending" ? (
        <span className="inline-flex items-center gap-2 px-5 h-11 rounded-[8px] bg-[var(--fill-2)] border border-[var(--line-strong)] text-[var(--ink-low)] font-display text-[11px] font-bold uppercase tracking-wider">
            <Clock className="w-4 h-4" /> Request sent
        </span>
    ) : friendStatus === "incoming" ? (
        <Link
            href="/friends"
            className="btn-command inline-flex items-center gap-2 px-5 h-11 bg-[var(--accent)] text-white font-display text-[11px] font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors duration-300"
        >
            <Check className="w-4 h-4" /> Respond to their request
        </Link>
    ) : (
        <button
            onClick={onAddFriend}
            disabled={busy}
            className="btn-command inline-flex items-center gap-2 px-5 h-11 bg-[var(--accent)] text-white font-display text-[11px] font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors duration-300 disabled:opacity-60"
        >
            <UserPlus className="w-4 h-4" /> {busy ? "Sending…" : "Add friend"}
        </button>
    );

    return (
        <div className="container-page py-8 space-y-5">
            {/* ── the header band, same shape the open profile uses ── */}
            <section className="relative overflow-hidden">
                {/* The cover, as a cover.
                
                    It used to be pushed to a quarter opacity behind a 2xl blur
                    — hidden rather than veiled, on the reasoning that nothing
                    private should be readable. But the API hands it to every
                    visitor by design: a banner is part of the identity a
                    private profile keeps public, alongside the name and the
                    rank. What is withheld is the collection, not the wallpaper.
                    It carries the same feathering the open profile uses, so the
                    two headers are the same object in two states. */}
                <div aria-hidden className="absolute inset-0 overflow-hidden">
                    {coverImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coverImage} alt="" className="w-full h-full object-cover" />
                    )}
                    <span className="absolute inset-0 bg-gradient-to-r from-[var(--surface-0)] from-[4%] via-[color-mix(in_srgb,var(--surface-0)_55%,transparent)] via-[45%] to-[color-mix(in_srgb,var(--surface-0)_20%,transparent)]" />
                    <span className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[var(--surface-0)] to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[var(--surface-0)] to-transparent" />
                    <span className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--surface-0)] to-transparent" />
                </div>

                <div className="relative flex flex-col lg:flex-row lg:items-end gap-6 p-5 md:p-8">
                    <div className="flex items-start gap-4 md:gap-7 flex-1 min-w-0">
                        <span className="relative shrink-0">
                            <span className="block w-[92px] h-[92px] md:w-[104px] md:h-[104px] rounded-full p-[2px]" style={{ background: "var(--line-strong)" }}>
                                <span className="block w-full h-full rounded-full p-[3px] bg-[var(--surface-0)]">
                                    {avatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <span className="w-full h-full rounded-full bg-white/[0.05] flex items-center justify-center text-white/25">
                                            <UserIcon className="w-9 h-9" />
                                        </span>
                                    )}
                                </span>
                            </span>
                            <span className="absolute -bottom-0.5 -right-0.5 w-8 h-8 rounded-full bg-[var(--surface-0)] border border-[var(--line-strong)] flex items-center justify-center">
                                <Lock className="w-3.5 h-3.5 text-white/45" />
                            </span>
                        </span>

                        <div className="min-w-0 flex-1 pt-1">
                            <span className="inline-flex items-center gap-1.5 h-[21px] px-2.5 rounded-[6px] bg-white/[0.06] border border-white/[0.09] font-display text-[9px] font-black uppercase tracking-[0.14em] text-white/45">
                                <Lock className="w-3 h-3" /> Friends only
                            </span>

                            <h1 className="mt-2.5 font-display text-[24px] md:text-[38px] font-black text-white leading-none truncate">
                                {displayName}
                            </h1>
                            <p className="mt-1.5 text-[13px] font-semibold text-white/45">@{username}</p>

                            {/* Standing, drawn with the objects the open
                                profile already owns — the struck insignia and
                                the XP rail — rather than a plainer stand-in.
                                It is the same person at the same rank; there is
                                no reason for their crest to look different
                                because a visitor has not been let in. */}
                            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
                                <span className="flex items-center gap-3">
                                    <RankInsigniaMark icon={rankIcon} color={rankColor} name={rankName} size={52} />
                                    <span>
                                        <span className="block font-display text-[13px] font-black uppercase tracking-[0.06em] text-white leading-none">
                                            {rankName ?? `Level ${level}`}
                                        </span>
                                        <span className="mt-1.5 block font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/30">
                                            Level {level} · {xp.toLocaleString()} XP
                                        </span>
                                    </span>
                                </span>

                                {joinedAt && (
                                    <span className="inline-flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">
                                        <CalendarDays className="w-3.5 h-3.5" /> Member since {joinedAt}
                                    </span>
                                )}
                            </div>

                            {/* How far through the band they are — public, like
                                the level it belongs to. */}
                            <div className="mt-4 max-w-[420px]">
                                <XpRail percent={bandPercent} />
                            </div>
                        </div>
                    </div>

                    {/* The one action, where the profile's own actions live. */}
                    <div className="shrink-0">{action}</div>
                </div>
            </section>

            {/* ── what is behind the door ──

                Named and shut. A visitor followed a link to somebody's profile;
                telling them "this is private" answers a question they did not
                ask, while showing which rooms exist answers the one they did. */}
            <section
                className="rounded-[var(--radius-panel)] border overflow-hidden"
                style={{ borderColor: "var(--line-strong)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
            >
                <header className="px-5 md:px-6 py-4 border-b border-white/[0.07] flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h2 className="font-display text-[12px] font-black uppercase tracking-[0.15em] text-white">
                        {displayName} keeps this for friends
                    </h2>
                    <p className="text-[12px] text-white/35">Accepted requests open all of it at once.</p>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-px" style={{ background: "var(--line)" }}>
                    {PROFILE_TABS.filter((t) => !t.ownOnly && t.id !== "overview").map(({ id, label, icon: Icon }) => (
                        <div key={id} className="group flex items-center gap-3.5 px-5 py-5" style={{ background: "var(--surface-2)" }}>
                            <span className="relative shrink-0 w-10 h-10 flex items-center justify-center">
                                <Icon className="w-[22px] h-[22px] text-white/[0.14]" strokeWidth={1.5} />
                                <Lock className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-white/25" />
                            </span>
                            <span className="min-w-0">
                                <span className="block font-display text-[11.5px] font-bold uppercase tracking-[0.1em] text-white/45 truncate">
                                    {label}
                                </span>
                                <span className="mt-1 block font-display text-[9px] font-bold uppercase tracking-[0.14em] text-white/[0.18]">
                                    Locked
                                </span>
                            </span>
                        </div>
                    ))}
                </div>

                <p className="px-5 md:px-6 py-4 border-t border-white/[0.07] flex items-start gap-2.5 text-[12px] leading-relaxed text-white/30">
                    <ShieldCheck className="w-4 h-4 mt-[1px] shrink-0 text-white/20" />
                    <span>
                        Their name, level and rank stay visible to everyone — a private profile is not a hidden one.
                        Everything they own, play or wrote is held back until a request is accepted.
                    </span>
                </p>
            </section>
        </div>
    );
}
