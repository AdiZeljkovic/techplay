"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { UserPlus, Clock, Mail, Award, Calendar, Shield, ShieldCheck, Crown, Pen } from "lucide-react";
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
}

const roleConfig: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
    admin: { color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/40", icon: Crown, label: "Admin" },
    super_admin: { color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/40", icon: Crown, label: "Super Admin" },
    "editor-in-chief": { color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/40", icon: Crown, label: "Editor-in-Chief" },
    editor: { color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/40", icon: Pen, label: "Editor" },
    moderator: { color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/40", icon: ShieldCheck, label: "Moderator" },
    journalist: { color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/40", icon: Pen, label: "Journalist" },
};

export default function ProfileHero({
    userData,
    stats,
    nextRank,
    isOwnProfile,
    currentUser,
    friendStatus,
    loadingAction,
    onSendRequest,
    onOpenMessage,
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
        <div className="relative">
            {/* Cover Image */}
            <div className="relative h-48 md:h-64 overflow-hidden">
                {userData.cover_image ? (
                    <img
                        src={userData.cover_image}
                        alt="Profile cover"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[var(--bg-secondary)] via-[#001a4d] to-[var(--bg-elevated)]">
                        {/* Subtle pattern overlay */}
                        <div
                            className="absolute inset-0 opacity-10"
                            style={{
                                backgroundImage: `radial-gradient(circle at 25% 50%, rgba(252, 65, 0, 0.15) 0%, transparent 50%),
                                                  radial-gradient(circle at 75% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)`,
                            }}
                        />
                    </div>
                )}
                {/* Gradient fade at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
            </div>

            {/* Profile Info Overlay */}
            <div className="container mx-auto px-4 max-w-5xl relative -mt-20 md:-mt-24 z-10">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-5 md:gap-8">
                    {/* Avatar with animated ring */}
                    <div className="relative flex-shrink-0">
                        {/* Spinning ring */}
                        <div
                            className="absolute -inset-1.5 rounded-full"
                            style={{
                                background: "conic-gradient(from 0deg, #FC4100, #8b5cf6, #06b6d4, #FC4100)",
                                animation: "spin-ring 4s linear infinite",
                            }}
                        />
                        {/* Avatar */}
                        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-[var(--bg-elevated)] border-4 border-[var(--bg-primary)] flex items-center justify-center overflow-hidden shadow-2xl">
                            {userData.avatar_url ? (
                                <img src={userData.avatar_url} alt={userData.username} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-5xl font-bold text-[var(--accent)]">
                                    {userData.username?.charAt(0)?.toUpperCase() || "?"}
                                </span>
                            )}
                        </div>
                        {/* Level Badge */}
                        <div className="absolute -bottom-1 -right-1 md:bottom-1 md:right-1 z-20 bg-[var(--accent)] text-white font-bold w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-4 border-[var(--bg-primary)] shadow-lg text-lg">
                            {level}
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-center md:text-left pb-2 w-full">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                                    <div className="flex flex-col">
                                        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
                                            {userData.display_name || userData.username}
                                        </h1>
                                        {userData.display_name && (
                                            <span className="text-sm text-[var(--text-muted)] font-mono">@{userData.username}</span>
                                        )}
                                    </div>

                                    {/* Role Badge */}
                                    {config && (() => {
                                        const IconComponent = config.icon;
                                        return (
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 shadow-lg backdrop-blur-sm ${config.color} ${config.bg} ${config.border}`}>
                                                <IconComponent className="w-3.5 h-3.5" />
                                                {config.label}
                                            </span>
                                        );
                                    })()}

                                    {/* Supporter Badge */}
                                    {userData.active_support && (
                                        <span
                                            className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1 shadow-[0_0_15px_-3px_var(--glow)] h-fit"
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
                                <p className="text-[var(--text-muted)] mt-2 flex items-center justify-center md:justify-start gap-2 text-sm">
                                    <Calendar className="w-4 h-4" />
                                    Joined {format(new Date(userData.created_at), "MMMM yyyy")}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 justify-center flex-shrink-0">
                                {!isOwnProfile && (
                                    <>
                                        <Button variant="secondary" size="sm" onClick={onOpenMessage}>
                                            <Mail className="w-4 h-4 mr-2" />
                                            Message
                                        </Button>
                                        {friendStatus === "none" && (
                                            <Button onClick={onSendRequest} disabled={loadingAction} className="shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]">
                                                <UserPlus className="w-4 h-4 mr-2" />
                                                Add Friend
                                            </Button>
                                        )}
                                        {friendStatus === "pending" && (
                                            <Button variant="secondary" disabled>
                                                <Clock className="w-4 h-4 mr-2" />
                                                Sent
                                            </Button>
                                        )}
                                    </>
                                )}
                                {isOwnProfile && (
                                    <Link href="/settings">
                                        <Button variant="outline" size="sm">
                                            Edit Profile
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* XP Bar */}
                        <div className="mt-5 max-w-xl">
                            <div className="flex justify-between text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                                <span className="font-bold text-[var(--accent)]">{userData.rank?.name || "Unranked"}</span>
                                <span>{Math.max(0, nextRankMinXP - currentXP)} XP to {nextRankName}</span>
                            </div>
                            <div className="h-3 bg-[var(--bg-elevated)] rounded-full overflow-hidden border border-[var(--border)] relative">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${xpProgress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-[var(--accent)] to-purple-500 rounded-full shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
