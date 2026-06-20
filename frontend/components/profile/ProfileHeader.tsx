"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
    Calendar, MapPin, Crown, Pen, ShieldCheck, Award, CheckCircle2,
    UserPlus, Clock, Mail, Shield, Hexagon, Sparkles, Share2,
} from "lucide-react";
import toast from "react-hot-toast";
import ReputationPowerCard from "./dashboard/ReputationPowerCard";
import HexBadge from "./dashboard/HexBadge";
import GiveRecognitionButton from "./GiveRecognitionButton";
import type { ProfileUser, ProfileStats, UserProfile, ReputationData, CustomizationData } from "@/lib/types/profile";

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
    customization?: CustomizationData;
}

const roleConfig: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
    admin: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/50", icon: ShieldCheck, label: "Admin" },
    super_admin: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/50", icon: Crown, label: "Super Admin" },
    "editor-in-chief": { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/50", icon: Crown, label: "Editor-in-Chief" },
    editor: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/50", icon: Pen, label: "Editor" },
    moderator: { color: "text-tp-accent/80", bg: "bg-tp-accent/10", border: "border-tp-accent/50", icon: ShieldCheck, label: "Moderator" },
    journalist: { color: "text-tp-accent/70", bg: "bg-tp-accent/10", border: "border-tp-accent/40", icon: Pen, label: "Journalist" },
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
    customization,
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
    const frame = customization?.equipped?.frame;
    const badge = customization?.equipped?.badge;
    const tierColor = reputation?.tier_color ?? "#CD7F32";

    // Action buttons live in the Reputation & Power card footer.
    const cardFooter = isOwnProfile ? (
        <>
            <Link href="/settings" className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-white text-[11px] font-bold uppercase tracking-wider transition-colors">
                <Pen className="w-3.5 h-3.5" /> Edit Profile
            </Link>
            <Link href="?customize=1" scroll={false} className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[11px] font-bold uppercase tracking-wider transition-colors shadow-[0_0_20px_rgba(252,65,0,0.3)]">
                <Sparkles className="w-3.5 h-3.5" /> Customize Profile
            </Link>
        </>
    ) : (
        <>
            <button onClick={onOpenMessage} className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-white text-[11px] font-bold uppercase tracking-wider transition-colors">
                <Mail className="w-3.5 h-3.5" /> Message
            </button>
            {friendStatus === "pending" ? (
                <button disabled className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/[0.07] border border-white/10 text-white/50 text-[11px] font-bold uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" /> Sent
                </button>
            ) : (
                <button onClick={onSendRequest} disabled={loadingAction} className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[11px] font-bold uppercase tracking-wider transition-colors shadow-[0_0_20px_rgba(252,65,0,0.3)]">
                    <UserPlus className="w-3.5 h-3.5" /> Add Friend
                </button>
            )}
        </>
    );

    return (
        <div className="relative -mt-[120px] md:-mt-[116px]">
            {/* === COVER BANNER (background) === */}
            <div className="absolute inset-0 overflow-hidden">
                {userData.cover_image ? (
                    <img src={userData.cover_image} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0a0f1f] via-[#0d1228] to-[#120a1e]">
                        <div className="absolute inset-0 profile-grid-bg opacity-40" />
                    </div>
                )}
                {/* Readability overlays: darken left + bottom */}
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-primary)] via-[var(--bg-primary)]/80 to-[var(--bg-primary)]/30" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-[var(--bg-primary)]/40" />
            </div>

            {/* === CONTENT === */}
            <div className="relative z-10 max-w-[1320px] mx-auto px-4 xl:px-0 pt-[150px] md:pt-[156px] pb-7">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5 items-stretch">
                    {/* LEFT COLUMN: identity + level bar */}
                    <div className="flex flex-col gap-5 min-w-0">
                        <div className="flex items-start gap-5 md:gap-6">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                <div
                                    className="absolute -inset-1.5 rounded-full"
                                    style={{ background: frame?.value ?? "var(--accent)", boxShadow: "0 0 28px rgba(252,65,0,0.55)" }}
                                />
                                <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full bg-[var(--bg-elevated)] border-[4px] border-[var(--bg-primary)] flex items-center justify-center overflow-hidden shadow-2xl">
                                    {userData.avatar_url ? (
                                        <img src={userData.avatar_url} alt={userData.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl md:text-5xl font-bold text-[var(--accent)]">{userData.username?.charAt(0)?.toUpperCase() || "?"}</span>
                                    )}
                                </div>
                                {/* Level badge */}
                                <div className="absolute -bottom-1 -right-1 z-20 w-11 h-11 md:w-12 md:h-12 rounded-full bg-[var(--bg-primary)] border-[3px] border-[var(--accent)] flex items-center justify-center shadow-[0_0_15px_rgba(252,65,0,0.5)]">
                                    <span className="text-lg md:text-xl font-black text-[var(--accent)] leading-none">{level}</span>
                                </div>
                            </div>

                            {/* Identity */}
                            <div className="flex-1 min-w-0 pt-1">
                                <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                                    <h1 className="text-2xl md:text-[34px] font-black text-white tracking-tight drop-shadow-lg leading-none">
                                        {userData.display_name || userData.username}
                                    </h1>
                                    {config && (() => {
                                        const Icon = config.icon;
                                        return (
                                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${config.color} ${config.bg} ${config.border}`}>
                                                <Icon className="w-3 h-3" /> {config.label}
                                            </span>
                                        );
                                    })()}
                                    {isStaffRole && <CheckCircle2 className="w-5 h-5 text-[var(--accent)] fill-[var(--accent)]/20 drop-shadow" />}
                                    {badge && (
                                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border flex items-center gap-1.5"
                                            style={{ color: badge.value ?? "#fff", borderColor: `${badge.value ?? "#fff"}55`, backgroundColor: `${badge.value ?? "#fff"}1A` }}>
                                            <Award className="w-3 h-3" /> {badge.name}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 flex-wrap text-[13px] text-white/55 mb-1">
                                    <span className="font-mono text-white/45">@{userData.username}</span>
                                    {userData.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {userData.location}</span>}
                                </div>
                                <div className="flex items-center gap-1.5 text-[13px] text-white/45 mb-3">
                                    <Calendar className="w-3.5 h-3.5" /> Member since {format(new Date(userData.created_at), "MMMM yyyy")}
                                </div>

                                {userData.tagline && (
                                    <p className="text-[14px] font-semibold text-white/90 mb-1.5">{userData.tagline}</p>
                                )}
                                {userData.bio ? (
                                    <p className="text-[13px] text-white/55 leading-relaxed max-w-xl line-clamp-3">{userData.bio}</p>
                                ) : isOwnProfile ? (
                                    <p className="text-[13px] text-white/25 italic">No bio yet.</p>
                                ) : null}

                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                    {isOwnProfile && (
                                        <Link href="/settings" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white text-[12px] font-semibold transition-colors">
                                            <Pen className="w-3.5 h-3.5" /> Edit Bio
                                        </Link>
                                    )}
                                    {isOwnProfile && (
                                        <Link href="/backlog-advisor" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-tp-accent/30 bg-tp-accent/5 hover:bg-tp-accent/10 text-tp-accent text-[12px] font-semibold transition-colors">
                                            <Sparkles className="w-3.5 h-3.5" /> Backlog Advisor
                                        </Link>
                                    )}
                                    {/* Give Recognition — only for other profiles */}
                                    {!isOwnProfile && (
                                        <GiveRecognitionButton username={userData.username} />
                                    )}
                                    {/* Share profile */}
                                    <button
                                        onClick={() => {
                                            const url = `${window.location.origin}/profile/${userData.username}`;
                                            navigator.clipboard.writeText(url).then(() => toast.success("Profile link copied!"));
                                        }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white text-[12px] font-semibold transition-colors"
                                    >
                                        <Share2 className="w-3.5 h-3.5" /> Share
                                    </button>
                                    {/* Wrapped — for own profile */}
                                    {isOwnProfile && (
                                        <Link href={`/wrapped/${userData.username}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white text-[12px] font-semibold transition-colors">
                                            <Award className="w-3.5 h-3.5" /> {new Date().getFullYear()} Wrapped
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* === LEVEL / TIER BAR === */}
                        <div className="mt-auto rounded-2xl bg-black/45 backdrop-blur-md border border-white/[0.08] px-4 md:px-5 py-4 flex items-center gap-4 md:gap-5">
                            {/* Level */}
                            <div className="flex flex-col items-center justify-center shrink-0 pr-4 md:pr-5 border-r border-white/10">
                                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/40 leading-none">Level</span>
                                <span className="text-3xl md:text-4xl font-black text-[var(--accent)] leading-none mt-1">{level}</span>
                            </div>

                            {/* Current tier */}
                            <div className="hidden sm:flex items-center gap-2 shrink-0">
                                <HexBadge size={40} color={tierColor}><Hexagon className="w-4 h-4" fill="currentColor" /></HexBadge>
                                <span className="text-[12px] font-black uppercase tracking-[0.1em] text-white">{userData.rank?.name || "Bronze"} Tier</span>
                            </div>

                            {/* Progress */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-end mb-1.5">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/45">{Math.max(0, nextRankMinXP - currentXP).toLocaleString()} XP to</span>
                                </div>
                                <div className="h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/10">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${xpProgress}%` }}
                                        transition={{ duration: 1.2, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-[var(--accent)] via-[#ff6b35] to-[#FF7A3D] rounded-full shadow-[0_0_12px_rgba(252,65,0,0.5)]"
                                    />
                                </div>
                                <div className="flex justify-between mt-1.5">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">{currentXP.toLocaleString()} / {nextRankMinXP.toLocaleString()} XP</span>
                                    <span className="text-[12px] font-black uppercase tracking-[0.1em] text-white/80">{nextRankName}</span>
                                </div>
                            </div>

                            {/* Next tier shield */}
                            <Shield className="hidden md:block w-9 h-9 text-white/25 shrink-0" />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Reputation & Power card */}
                    <ReputationPowerCard stats={stats} userData={userData} reputation={reputation} footer={cardFooter} />
                </div>
            </div>
        </div>
    );
}
