"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
    Calendar, MapPin, Crown, Pen, ShieldCheck, Award, CheckCircle2,
    UserPlus, Clock, Mail,
} from "lucide-react";
import ReputationPowerCard from "./dashboard/ReputationPowerCard";
import type { ProfileUser, ProfileStats, UserProfile, ReputationData } from "@/lib/types/profile";

interface ProfileHeaderProps {
    userData: ProfileUser;
    stats: ProfileStats;
    nextRank: UserProfile["next_rank"];
    isOwnProfile: boolean;
    friendStatus: "none" | "pending" | "accepted";
    loadingAction: boolean;
    onSendRequest: () => void;
    onOpenMessage: () => void;
    reputation?: ReputationData;
}

const roleConfig: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
    admin: { color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/40", icon: Crown, label: "Admin" },
    super_admin: { color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/40", icon: Crown, label: "Super Admin" },
    "editor-in-chief": { color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/40", icon: Crown, label: "Editor-in-Chief" },
    editor: { color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/40", icon: Pen, label: "Editor" },
    moderator: { color: "text-tp-accent/80", bg: "bg-tp-accent/15", border: "border-tp-accent/40", icon: ShieldCheck, label: "Moderator" },
    journalist: { color: "text-tp-accent/70", bg: "bg-tp-accent/12", border: "border-tp-accent/30", icon: Pen, label: "Journalist" },
};

export default function ProfileHeader({
    userData,
    stats,
    nextRank,
    isOwnProfile,
    friendStatus,
    loadingAction,
    onSendRequest,
    onOpenMessage,
    reputation,
}: ProfileHeaderProps) {
    const currentXP = stats?.xp || 0;
    const level = stats?.level || 1;
    const currentRankMinXP = userData.rank?.min_xp || 0;
    const nextRankMinXP = nextRank?.min_xp || currentRankMinXP + 1000;
    const rankSpan = Math.max(1, nextRankMinXP - currentRankMinXP);
    const progressInRank = Math.max(0, currentXP - currentRankMinXP);
    const xpProgress = Math.min(100, (progressInRank / rankSpan) * 100);
    const nextRankName = nextRank?.name || "Next Tier";
    const config = roleConfig[userData.role?.toLowerCase()];
    const isStaffRole = !!config;

    return (
        <div className="relative -mt-[120px] md:-mt-[116px]">
            {/* === COVER === */}
            <div className="relative h-[420px] md:h-[460px] overflow-hidden">
                {userData.cover_image ? (
                    <img src={userData.cover_image} alt="Profile cover" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0a0f1f] via-[#0d1228] to-[#120a1e]">
                        <div className="absolute inset-0 profile-grid-bg opacity-50" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/85 to-[var(--bg-primary)]/20" />

                {/* Action buttons - top right */}
                <div className="absolute top-[132px] right-4 md:right-6 z-20 flex gap-2">
                    {!isOwnProfile && (
                        <>
                            <button onClick={onOpenMessage} className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all flex items-center gap-2">
                                <Mail className="w-4 h-4" /> <span className="hidden sm:inline">Message</span>
                            </button>
                            {friendStatus === "none" && (
                                <button onClick={onSendRequest} disabled={loadingAction} className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-bold hover:bg-[var(--accent-hover)] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(252,65,0,0.3)]">
                                    <UserPlus className="w-4 h-4" /> <span className="hidden sm:inline">Add Friend</span>
                                </button>
                            )}
                            {friendStatus === "pending" && (
                                <button disabled className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white/60 text-sm font-medium flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Sent
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* === IDENTITY ROW (overlapping the cover) === */}
            <div className="relative z-10 max-w-[1320px] mx-auto px-4 xl:px-0 -mt-[200px] md:-mt-[230px]">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Left: avatar + identity */}
                    <div className="flex items-end gap-5 md:gap-7 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div
                                className="absolute -inset-1.5 rounded-full opacity-80"
                                style={{ background: "conic-gradient(from 0deg, #FC4100, #d43600, #FF7A3D, #FC4100)", animation: "spin-ring 6s linear infinite" }}
                            />
                            <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full bg-[var(--bg-elevated)] border-[3px] border-[var(--bg-primary)] flex items-center justify-center overflow-hidden shadow-2xl">
                                {userData.avatar_url ? (
                                    <img src={userData.avatar_url} alt={userData.username} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl md:text-5xl font-bold text-[var(--accent)]">{userData.username?.charAt(0)?.toUpperCase() || "?"}</span>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 z-20 bg-gradient-to-br from-[var(--accent)] to-[#d43600] text-white font-black w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center border-[3px] border-[var(--bg-primary)] shadow-[0_0_15px_rgba(252,65,0,0.4)] text-base md:text-lg">
                                {level}
                            </div>
                        </div>

                        {/* Identity */}
                        <div className="flex-1 min-w-0 pb-1">
                            <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                                <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight drop-shadow-lg truncate">
                                    {userData.display_name || userData.username}
                                </h1>
                                {config && (() => {
                                    const Icon = config.icon;
                                    return (
                                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border flex items-center gap-1.5 backdrop-blur-sm shadow-lg ${config.color} ${config.bg} ${config.border}`}>
                                            <Icon className="w-3 h-3" /> {config.label}
                                        </span>
                                    );
                                })()}
                                {isStaffRole && <CheckCircle2 className="w-5 h-5 text-[var(--accent)] drop-shadow" />}
                                {userData.active_support && (
                                    <span
                                        className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border flex items-center gap-1 shadow-[0_0_15px_-3px_var(--glow)]"
                                        style={{
                                            color: userData.active_support.tier.color || "#F59E0B",
                                            borderColor: `${userData.active_support.tier.color || "#F59E0B"}40`,
                                            backgroundColor: `${userData.active_support.tier.color || "#F59E0B"}10`,
                                            "--glow": userData.active_support.tier.color || "#F59E0B",
                                        } as any}
                                    >
                                        <Award className="w-3 h-3" /> {userData.active_support.tier.name}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-3 flex-wrap text-sm text-white/55 mb-2">
                                <span className="font-mono text-white/45">@{userData.username}</span>
                                {userData.location && (
                                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {userData.location}</span>
                                )}
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" /> Member since {format(new Date(userData.created_at), "MMMM yyyy")}
                                </span>
                            </div>

                            {userData.tagline && (
                                <p className="text-[13px] font-semibold text-[var(--accent)]/90 mb-2">{userData.tagline}</p>
                            )}

                            {userData.bio ? (
                                <p className="text-[13px] text-white/60 leading-relaxed max-w-2xl line-clamp-3">{userData.bio}</p>
                            ) : isOwnProfile ? (
                                <p className="text-[13px] text-white/25 italic">No bio yet.</p>
                            ) : null}

                            {isOwnProfile && (
                                <Link href="/settings" className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-bold uppercase tracking-wider text-white/40 hover:text-[var(--accent)] transition-colors">
                                    <Pen className="w-3 h-3" /> Edit Bio
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Right: Reputation & Power card */}
                    <ReputationPowerCard stats={stats} userData={userData} reputation={reputation} />
                </div>

                {/* === LEVEL / TIER PROGRESS BAR === */}
                <div className="mt-6 rounded-2xl bg-[var(--bg-card)] border border-white/[0.06] px-5 py-4 flex items-center gap-5">
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20">
                            <span className="text-[8px] font-bold uppercase tracking-wider text-white/40 leading-none">Level</span>
                            <span className="text-lg font-black text-[var(--accent)] leading-none mt-0.5">{level}</span>
                        </div>
                        {userData.rank?.name && (
                            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/70 hidden sm:inline">{userData.rank.name}</span>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-white/45 mb-1.5">
                            <span>{currentXP.toLocaleString()} / {nextRankMinXP.toLocaleString()} XP</span>
                            <span>{Math.max(0, nextRankMinXP - currentXP).toLocaleString()} XP to <span className="text-[var(--accent)]">{nextRankName}</span></span>
                        </div>
                        <div className="h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/10">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${xpProgress}%` }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-[var(--accent)] via-[#ff6b35] to-[#FF7A3D] rounded-full shadow-[0_0_12px_rgba(252,65,0,0.5)]"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
