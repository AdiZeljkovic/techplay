"use client";

import Link from "next/link";
import { Lock, User as UserIcon, UserPlus, Clock, Check, CalendarDays } from "lucide-react";
import type { FriendStatus } from "@/lib/types/profile";
import { LevelCrest, RankEmblem } from "@/components/home-dashboard/RankInsignia";

interface Props {
    username: string;
    displayName: string;
    avatarUrl: string | null;
    coverImage: string | null;
    level: number;
    rankName: string | null;
    rankColor: string | null;
    joinedAt: string | null;
    friendStatus: FriendStatus;
    viewerSignedIn: boolean;
    busy: boolean;
    onAddFriend: () => void;
}

/**
 * A friends-only profile, seen by someone who isn't a friend yet. It is a
 * doorway, not a dead end: identity and standing stay visible so there is a
 * reason to send the request — everything they own, play or wrote does not.
 */
export default function LockedProfile({
    username,
    displayName,
    avatarUrl,
    coverImage,
    level,
    rankName,
    rankColor,
    joinedAt,
    friendStatus,
    viewerSignedIn,
    busy,
    onAddFriend,
}: Props) {
    return (
        <div className="container-page py-8">
            <section className="relative rounded-[var(--radius-panel)] overflow-hidden bg-[var(--surface-1)] border border-[var(--line)]">
                {/* the cover still sets the tone — heavily veiled, never readable as content */}
                <div aria-hidden className="absolute inset-0 overflow-hidden">
                    {coverImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coverImage} alt="" className="w-full h-full object-cover opacity-20 blur-xl scale-110" />
                    )}
                    <span className="absolute inset-0 bg-gradient-to-b from-[color-mix(in_srgb,var(--surface-1)_75%,transparent)] to-[var(--surface-1)]" />
                    <span className="absolute inset-0 bg-hud-grid opacity-30" />
                </div>

                <div className="relative px-6 py-12 md:py-16 flex flex-col items-center text-center">
                    <div className="relative">
                        <span className="block w-[112px] h-[112px] rounded-full overflow-hidden border-2 border-[var(--line-strong)] bg-[var(--surface-2)]">
                            {avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="w-full h-full flex items-center justify-center">
                                    <UserIcon className="w-10 h-10 text-[var(--ink-faint)]" />
                                </span>
                            )}
                        </span>
                        <span className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-[var(--surface-0)] border border-[var(--line-strong)] flex items-center justify-center">
                            <Lock className="w-4 h-4 text-[var(--ink-low)]" />
                        </span>
                    </div>

                    <h1 className="mt-5 font-display text-[26px] md:text-[32px] font-black text-[var(--ink-hi)] leading-none">
                        {displayName}
                    </h1>
                    <p className="mt-1.5 text-[12px] text-[var(--ink-faint)]">@{username}</p>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                        <LevelCrest level={level} size={54} />
                        {rankName && <RankEmblem name={rankName} color={rankColor} />}
                        {joinedAt && (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">
                                <CalendarDays className="w-3.5 h-3.5" /> Member since {joinedAt}
                            </span>
                        )}
                    </div>

                    <div className="mt-8 max-w-[440px]">
                        <p className="font-display text-[13px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                            This profile is friends only
                        </p>
                        <p className="mt-2 text-[13px] leading-relaxed text-[var(--ink-low)]">
                            {displayName} keeps their collection, stats and activity for friends. Send a request — once
                            it&apos;s accepted, the full profile opens up.
                        </p>
                    </div>

                    <div className="mt-6">
                        {!viewerSignedIn ? (
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 px-6 h-11 rounded-[var(--radius-card)] bg-[var(--accent)] text-white font-display text-[11px] font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors duration-300 shadow-[var(--glow-accent)]"
                            >
                                <UserPlus className="w-4 h-4" /> Sign In To Send A Request
                            </Link>
                        ) : friendStatus === "pending" ? (
                            <span className="inline-flex items-center gap-2 px-6 h-11 rounded-[var(--radius-card)] bg-[var(--fill-2)] border border-[var(--line-strong)] text-[var(--ink-low)] font-display text-[11px] font-bold uppercase tracking-wider">
                                <Clock className="w-4 h-4" /> Request Sent
                            </span>
                        ) : friendStatus === "incoming" ? (
                            <Link
                                href="/friends"
                                className="inline-flex items-center gap-2 px-6 h-11 rounded-[var(--radius-card)] bg-[var(--accent)] text-white font-display text-[11px] font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors duration-300 shadow-[var(--glow-accent)]"
                            >
                                <Check className="w-4 h-4" /> Respond To Their Request
                            </Link>
                        ) : (
                            <button
                                onClick={onAddFriend}
                                disabled={busy}
                                className="inline-flex items-center gap-2 px-6 h-11 rounded-[var(--radius-card)] bg-[var(--accent)] text-white font-display text-[11px] font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors duration-300 shadow-[var(--glow-accent)] disabled:opacity-60"
                            >
                                <UserPlus className="w-4 h-4" /> {busy ? "Sending…" : "Add Friend"}
                            </button>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
