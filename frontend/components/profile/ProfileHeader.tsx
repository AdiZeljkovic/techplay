"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
    Calendar, MapPin, Crown, Pen, ShieldCheck, Award, CheckCircle2,
    UserPlus, Clock, Mail, Sparkles, Share2, Swords, MoreHorizontal,
    Gamepad2, Trophy, Star, List as ListIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import GiveRecognitionButton from "./GiveRecognitionButton";
import LivePresenceBadge from "./dashboard/LivePresenceBadge";
import type { ProfileTab } from "./ProfileTabs";
import type { ProfileUser, ProfileStats, UserProfile, ReputationData, CustomizationData } from "@/lib/types/profile";

interface ProfileHeaderProps {
    userData: ProfileUser;
    stats: ProfileStats;
    nextRank: UserProfile["next_rank"];
    isOwnProfile: boolean;
    currentUsername?: string;
    friendStatus: "none" | "pending" | "accepted";
    loadingAction: boolean;
    onSendRequest: () => void;
    onOpenMessage: () => void;
    onOpenTab: (tab: ProfileTab) => void;
    listsCount: number;
    reputation?: ReputationData;
    customization?: CustomizationData;
}

const roleConfig: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
    admin: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/50", icon: ShieldCheck, label: "Admin" },
    super_admin: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/50", icon: Crown, label: "Super Admin" },
    "editor-in-chief": { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/50", icon: Crown, label: "Editor-in-Chief" },
    editor: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/50", icon: Pen, label: "Editor" },
    moderator: { color: "text-[var(--accent)]", bg: "bg-[var(--accent)]/10", border: "border-[var(--accent)]/50", icon: ShieldCheck, label: "Moderator" },
    journalist: { color: "text-[var(--accent)]", bg: "bg-[var(--accent)]/10", border: "border-[var(--accent)]/40", icon: Pen, label: "Journalist" },
};

/** Avatar wrapped in an SVG level ring showing XP progress to the next rank. */
function LevelRingAvatar({ userData, level, progress, frameValue, animated }: {
    userData: ProfileUser;
    level: number;
    progress: number; // 0..100
    frameValue?: string | null;
    animated: boolean;
}) {
    const size = 148;
    const stroke = 5;
    const r = (size - stroke) / 2;
    const circumference = 2 * Math.PI * r;
    const dash = (Math.min(100, Math.max(0, progress)) / 100) * circumference;

    return (
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            {/* XP progress ring */}
            <svg width={size} height={size} className="absolute inset-0 -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
                <circle
                    cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke="var(--accent)" strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    style={{ transition: "stroke-dasharray 1.2s ease-out", filter: "drop-shadow(0 0 8px color-mix(in srgb, var(--accent) 60%, transparent))" }}
                />
            </svg>

            {/* Equipped frame ring (inside the XP ring) */}
            <div
                className="absolute rounded-full"
                style={{ inset: stroke + 4, background: frameValue ?? "transparent" }}
            />

            {/* Avatar */}
            <div
                className={`absolute rounded-full bg-[var(--bg-elevated)] overflow-hidden flex items-center justify-center${animated ? " animate-spin-slow" : ""}`}
                style={{ inset: stroke + (frameValue ? 8 : 6) }}
            >
                {userData.avatar_url ? (
                    <img src={userData.avatar_url} alt={userData.username} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-5xl font-black text-[var(--accent)]">{userData.username?.charAt(0)?.toUpperCase() || "?"}</span>
                )}
            </div>

            {/* Level badge */}
            <div className="absolute -bottom-1 -right-1 z-10 w-12 h-12 rounded-full bg-[var(--bg-primary)] border-[3px] border-[var(--accent)] flex flex-col items-center justify-center shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_50%,transparent)]">
                <span className="text-[7px] font-black uppercase tracking-widest text-white/40 leading-none">LVL</span>
                <span className="text-lg font-black text-[var(--accent)] leading-none">{level}</span>
            </div>
        </div>
    );
}

/** Clickable identity stat chip — jumps to the matching tab. */
function StatChip({ icon: Icon, label, value, sub, onClick }: {
    icon: any;
    label: string;
    value: string | number;
    sub?: string | null;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="group flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/[0.08] hover:border-[var(--accent)]/50 transition-all"
        >
            <Icon className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-[15px] font-black text-white leading-none">{value}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/45 group-hover:text-white/70 transition-colors leading-none">
                {label}
                {sub && <span className="ml-1 text-[var(--accent)]">{sub}</span>}
            </span>
        </button>
    );
}

export default function ProfileHeader({
    userData,
    stats,
    nextRank,
    isOwnProfile,
    currentUsername,
    friendStatus,
    loadingAction,
    onSendRequest,
    onOpenMessage,
    onOpenTab,
    listsCount,
    reputation,
    customization,
}: ProfileHeaderProps) {
    const [menuOpen, setMenuOpen] = useState(false);

    const currentXP = stats?.xp || 0;
    const level = stats?.level || 1;
    const currentRankMinXP = userData.rank?.min_xp || 0;
    const nextRankMinXP = nextRank?.min_xp || currentRankMinXP + 1000;
    const rankSpan = Math.max(1, nextRankMinXP - currentRankMinXP);
    const progressInRank = Math.max(0, currentXP - currentRankMinXP);
    const xpProgress = Math.min(100, (progressInRank / rankSpan) * 100);
    const config = roleConfig[userData.role?.toLowerCase()];
    const isStaffRole = !!config;
    const frame = customization?.equipped?.frame;
    const badge = customization?.equipped?.badge;
    const hasAnimatedAvatar = customization?.perks?.animated_avatar === true;
    const hasSpotlight = customization?.perks?.profile_spotlight === true;

    const shareProfile = () => {
        const url = `${window.location.origin}/profile/${userData.username}`;
        navigator.clipboard.writeText(url).then(() => toast.success("Profile link copied!"));
        setMenuOpen(false);
    };

    const menuItemCls = "w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors text-left";
    const primaryBtnCls = "flex items-center justify-center gap-2 h-[42px] px-5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[12px] font-bold uppercase tracking-wider transition-colors shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_30%,transparent)]";
    const ghostBtnCls = "flex items-center justify-center gap-2 h-[42px] px-5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white text-[12px] font-bold uppercase tracking-wider transition-colors";

    return (
        <div className={`relative -mt-[120px] md:-mt-[116px]${hasSpotlight ? " ring-2 ring-[var(--accent)] shadow-[0_0_60px_color-mix(in_srgb,var(--accent)_25%,transparent)]" : ""}`}>
            {/* === COVER === */}
            <div className="absolute inset-0 overflow-hidden">
                {userData.cover_image ? (
                    <img src={userData.cover_image} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0a0f1f] via-[#0d1228] to-[#120a1e]">
                        <div className="absolute inset-0 profile-grid-bg opacity-40" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-primary)] via-[var(--bg-primary)]/75 to-[var(--bg-primary)]/25" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-[var(--bg-primary)]/40" />
            </div>

            {/* === CONTENT === */}
            <div className="relative z-10 max-w-[1320px] mx-auto px-4 xl:px-0 pt-[150px] md:pt-[160px] pb-6">
                <div className="flex flex-col md:flex-row md:items-end gap-6">
                    <LevelRingAvatar
                        userData={userData}
                        level={level}
                        progress={xpProgress}
                        frameValue={frame?.value}
                        animated={hasAnimatedAvatar}
                    />

                    {/* Identity */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap mb-2">
                            <h1 className="text-3xl md:text-[38px] font-black text-white tracking-tight drop-shadow-lg leading-none">
                                {userData.display_name || userData.username}
                            </h1>
                            {config && (() => {
                                const Icon = config.icon;
                                return (
                                    <span className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${config.color} ${config.bg} ${config.border}`}>
                                        <Icon className="w-3 h-3" /> {config.label}
                                    </span>
                                );
                            })()}
                            {isStaffRole && <CheckCircle2 className="w-5 h-5 text-[var(--accent)] fill-[var(--accent)]/20 drop-shadow" />}
                            {badge && (
                                <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider border flex items-center gap-1.5"
                                    style={{ color: badge.value ?? "#fff", borderColor: `${badge.value ?? "#fff"}55`, backgroundColor: `${badge.value ?? "#fff"}1A` }}>
                                    <Award className="w-3 h-3" /> {badge.name}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3 flex-wrap text-[13px] text-white/50 mb-2.5">
                            <span className="font-mono text-white/40">@{userData.username}</span>
                            {userData.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {userData.location}</span>}
                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Since {format(new Date(userData.created_at), "MMM yyyy")}</span>
                            <LivePresenceBadge username={userData.username} userId={userData.id} />
                        </div>

                        {/* Single metal progression: Rank + XP to next */}
                        <div className="flex items-center gap-3 mb-3 max-w-md">
                            <span className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--accent)] shrink-0">
                                {userData.rank?.name || "Unranked"}
                            </span>
                            <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/10 min-w-[80px]">
                                <div
                                    className="h-full bg-[var(--accent)] rounded-full shadow-[0_0_10px_color-mix(in_srgb,var(--accent)_50%,transparent)]"
                                    style={{ width: `${xpProgress}%`, transition: "width 1.2s ease-out" }}
                                />
                            </div>
                            {nextRank && (
                                <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 shrink-0">
                                    {Math.max(0, nextRankMinXP - currentXP).toLocaleString()} XP → {nextRank.name}
                                </span>
                            )}
                        </div>

                        {userData.tagline && (
                            <p className="text-[14px] font-semibold text-white/85 mb-1">{userData.tagline}</p>
                        )}
                        {userData.bio && (
                            <p className="text-[13px] text-white/50 leading-relaxed max-w-xl line-clamp-2">{userData.bio}</p>
                        )}
                    </div>

                    {/* Actions: max 2 primary + overflow menu */}
                    <div className="flex items-center gap-2 md:pb-1 shrink-0">
                        {isOwnProfile ? (
                            <>
                                <Link href="/settings" className={ghostBtnCls}>
                                    <Pen className="w-3.5 h-3.5" /> Edit Profile
                                </Link>
                                <Link href="?customize=1" scroll={false} className={primaryBtnCls}>
                                    <Sparkles className="w-3.5 h-3.5" /> Customize
                                </Link>
                            </>
                        ) : (
                            <>
                                <button onClick={onOpenMessage} className={ghostBtnCls}>
                                    <Mail className="w-3.5 h-3.5" /> Message
                                </button>
                                {friendStatus === "pending" ? (
                                    <button disabled className={`${ghostBtnCls} opacity-50 cursor-default`}>
                                        <Clock className="w-3.5 h-3.5" /> Sent
                                    </button>
                                ) : (
                                    <button onClick={onSendRequest} disabled={loadingAction} className={primaryBtnCls}>
                                        <UserPlus className="w-3.5 h-3.5" /> Add Friend
                                    </button>
                                )}
                                <GiveRecognitionButton username={userData.username} />
                            </>
                        )}

                        {/* Overflow menu */}
                        <div className="relative">
                            <button
                                onClick={() => setMenuOpen((v) => !v)}
                                aria-label="More actions"
                                className="flex items-center justify-center w-[42px] h-[42px] rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white/70 hover:text-white transition-colors"
                            >
                                <MoreHorizontal className="w-4.5 h-4.5" />
                            </button>
                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                                    <div className="absolute right-0 top-[48px] z-40 w-52 rounded-xl bg-[#0d1117] border border-[var(--border)] shadow-2xl overflow-hidden py-1">
                                        <button onClick={shareProfile} className={menuItemCls}>
                                            <Share2 className="w-3.5 h-3.5" /> Share Profile
                                        </button>
                                        {isOwnProfile && (
                                            <>
                                                <Link href={`/wrapped/${userData.username}`} className={menuItemCls} onClick={() => setMenuOpen(false)}>
                                                    <Award className="w-3.5 h-3.5" /> {new Date().getFullYear()} Wrapped
                                                </Link>
                                                <Link href="/backlog-advisor" className={menuItemCls} onClick={() => setMenuOpen(false)}>
                                                    <Sparkles className="w-3.5 h-3.5" /> Backlog Advisor
                                                </Link>
                                            </>
                                        )}
                                        {!isOwnProfile && currentUsername && (
                                            <Link href={`/compare/${currentUsername}/${userData.username}`} className={menuItemCls} onClick={() => setMenuOpen(false)}>
                                                <Swords className="w-3.5 h-3.5" /> Compare Profiles
                                            </Link>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Identity stats — 4 clickable chips (replaces the 10-cell strip) */}
                <div className="flex flex-wrap items-center gap-2 mt-6">
                    <StatChip icon={Gamepad2} label="Games" value={stats?.games_count ?? 0} onClick={() => onOpenTab("collection")} />
                    <StatChip icon={Trophy} label="Achievements" value={stats?.achievements_count ?? 0} onClick={() => onOpenTab("achievements")} />
                    <StatChip
                        icon={Star}
                        label="Reputation"
                        value={reputation?.reputation ?? stats?.reputation ?? 0}
                        sub={reputation?.percentile ? `Top ${reputation.percentile}%` : null}
                        onClick={() => onOpenTab("stats")}
                    />
                    <StatChip icon={ListIcon} label="Lists" value={listsCount} onClick={() => onOpenTab("lists")} />
                </div>
            </div>
        </div>
    );
}
