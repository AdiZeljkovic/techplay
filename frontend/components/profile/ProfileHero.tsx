"use client";

import Link from "next/link";
import { UserPlus, Clock, Mail, Award, Calendar, ShieldCheck, Crown, Pen, Activity, Gamepad2, Cpu, Trophy } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import type { ProfileUser, ProfileStats, UserProfile } from "@/lib/types/profile";

interface ProfileHeroProps {
    userData: ProfileUser;
    stats: ProfileStats;
    nextRank: UserProfile["next_rank"];
    isOwnProfile: boolean;
    currentUser: any;
    friendStatus: "none" | "pending" | "accepted";
    loadingAction: boolean;
    onSendRequest: () => void;
    onOpenMessage: () => void;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const roleConfig: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
    admin: { color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/40", icon: Crown, label: "Admin" },
    super_admin: { color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/40", icon: Crown, label: "Super Admin" },
    "editor-in-chief": { color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/40", icon: Crown, label: "Editor-in-Chief" },
    editor: { color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/40", icon: Pen, label: "Editor" },
    moderator: { color: "text-tp-accent/80", bg: "bg-tp-accent/15", border: "border-tp-accent/40", icon: ShieldCheck, label: "Moderator" },
    journalist: { color: "text-tp-accent/70", bg: "bg-tp-accent/12", border: "border-tp-accent/30", icon: Pen, label: "Journalist" },
};

const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "ids", label: "IDs", icon: Gamepad2 },
    { id: "gear", label: "Gear", icon: Cpu },
    { id: "achievements", label: "Achievements", icon: Trophy },
];

export default function ProfileHero({
    userData,
    stats,
    nextRank,
    isOwnProfile,
    friendStatus,
    loadingAction,
    onSendRequest,
    onOpenMessage,
    activeTab,
    onTabChange,
}: ProfileHeroProps) {
    const currentXP = stats?.xp || 0;
    const level = stats?.level || 1;
    const currentRankMinXP = userData.rank?.min_xp || 0;
    const nextRankMinXP = nextRank?.min_xp || currentRankMinXP + 1000;
    const rankSpan = nextRankMinXP - currentRankMinXP;
    const progressInRank = Math.max(0, currentXP - currentRankMinXP);
    const xpProgress = Math.min(100, (progressInRank / rankSpan) * 100);
    const nextRankName = nextRank?.name || "Next Rank";
    const config = roleConfig[userData.role?.toLowerCase()];

    return (
        <div className="relative -mt-[120px] md:-mt-[116px]">
            {/* === IMMERSIVE COVER === */}
            <div className="relative h-[460px] md:h-[536px] overflow-hidden">
                {userData.cover_image ? (
                    <img
                        src={userData.cover_image}
                        alt="Profile cover"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#000a20] via-[#001540] to-[#001a4d]">
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundImage: `
                                    radial-gradient(ellipse at 20% 60%, rgba(252, 65, 0, 0.08) 0%, transparent 60%),
                                    radial-gradient(ellipse at 80% 30%, rgba(252, 65, 0, 0.04) 0%, transparent 60%),
                                    radial-gradient(ellipse at 50% 90%, rgba(212, 54, 0, 0.03) 0%, transparent 50%)
                                `,
                            }}
                        />
                        {/* Subtle grid overlay on default cover */}
                        <div className="absolute inset-0 profile-grid-bg opacity-50" />
                    </div>
                )}

                {/* Heavy gradient fade - bottom 70% */}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/70 to-transparent" />

                {/* === ACTION BUTTONS - top right === */}
                <div className="absolute top-[130px] right-4 md:top-[126px] md:right-6 z-20 flex gap-2">
                    {!isOwnProfile && (
                        <>
                            <button
                                onClick={onOpenMessage}
                                className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all flex items-center gap-2"
                            >
                                <Mail className="w-4 h-4" />
                                <span className="hidden sm:inline">Message</span>
                            </button>
                            {friendStatus === "none" && (
                                <button
                                    onClick={onSendRequest}
                                    disabled={loadingAction}
                                    className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-bold hover:bg-[var(--accent-hover)] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(252,65,0,0.3)]"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    <span className="hidden sm:inline">Add Friend</span>
                                </button>
                            )}
                            {friendStatus === "pending" && (
                                <button disabled className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white/60 text-sm font-medium flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Sent
                                </button>
                            )}
                        </>
                    )}
                    {isOwnProfile && (
                        <Link href="/settings">
                            <button className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all">
                                Edit Profile
                            </button>
                        </Link>
                    )}
                </div>

                {/* === USER INFO - overlaid at bottom === */}
                <div className="absolute bottom-14 md:bottom-16 left-0 right-0 z-10">
                    <div className="max-w-[1320px] mx-auto px-4 xl:px-0">
                        <div className="flex items-end gap-5 md:gap-7">
                            {/* Avatar with animated ring */}
                            <div className="relative flex-shrink-0">
                                <div
                                    className="absolute -inset-1.5 rounded-full opacity-80"
                                    style={{
                                        background: "conic-gradient(from 0deg, #FC4100, #d43600, #FF7A3D, #FC4100)",
                                        animation: "spin-ring 6s linear infinite",
                                    }}
                                />
                                <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full bg-[var(--bg-elevated)] border-[3px] border-[var(--bg-primary)] flex items-center justify-center overflow-hidden shadow-2xl">
                                    {userData.avatar_url ? (
                                        <img src={userData.avatar_url} alt={userData.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl md:text-5xl font-bold text-[var(--accent)]">
                                            {userData.username?.charAt(0)?.toUpperCase() || "?"}
                                        </span>
                                    )}
                                </div>
                                {/* Level Badge */}
                                <div className="absolute -bottom-1 -right-1 z-20 bg-gradient-to-br from-[var(--accent)] to-[#d43600] text-white font-black w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center border-[3px] border-[var(--bg-primary)] shadow-[0_0_15px_rgba(252,65,0,0.4)] text-base md:text-lg">
                                    {level}
                                </div>
                            </div>

                            {/* Name + Badges + XP */}
                            <div className="flex-1 min-w-0 pb-1">
                                <div className="flex items-center gap-3 flex-wrap mb-1">
                                    <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight drop-shadow-lg truncate">
                                        {userData.display_name || userData.username}
                                    </h1>

                                    {config && (() => {
                                        const IconComponent = config.icon;
                                        return (
                                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border flex items-center gap-1.5 backdrop-blur-sm shadow-lg ${config.color} ${config.bg} ${config.border}`}>
                                                <IconComponent className="w-3 h-3" />
                                                {config.label}
                                            </span>
                                        );
                                    })()}

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
                                            <Award className="w-3 h-3" />
                                            {userData.active_support.tier.name}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 text-sm text-white/60 mb-3">
                                    {userData.display_name && (
                                        <span className="font-mono text-white/40">@{userData.username}</span>
                                    )}
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Joined {format(new Date(userData.created_at), "MMM yyyy")}
                                    </span>
                                </div>

                                {/* XP Bar */}
                                <div className="max-w-md">
                                    <div className="flex justify-between text-[11px] font-bold text-white/70 mb-1 uppercase tracking-wider">
                                        <span className="text-[var(--accent)]">{userData.rank?.name || "Unranked"}</span>
                                        <span>{Math.max(0, nextRankMinXP - currentXP)} XP to {nextRankName}</span>
                                    </div>
                                    <div className="h-2.5 bg-black/40 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
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
                </div>

                {/* === TAB NAVIGATION - glass bar at bottom edge === */}
                <div className="absolute bottom-0 left-0 right-0 z-20">
                    <div className="bg-black/30 backdrop-blur-xl border-t border-white/10">
                        <div className="max-w-[1320px] mx-auto px-4 xl:px-0">
                            <div className="flex items-center gap-0 overflow-x-auto no-scrollbar">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => onTabChange(tab.id)}
                                        className={`flex items-center gap-2 px-5 md:px-6 py-3 text-sm font-semibold transition-all whitespace-nowrap border-b-2 ${
                                            activeTab === tab.id
                                                ? "border-[var(--accent)] text-[var(--accent)] bg-white/5"
                                                : "border-transparent text-white/50 hover:text-white/80 hover:bg-white/5"
                                        }`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
