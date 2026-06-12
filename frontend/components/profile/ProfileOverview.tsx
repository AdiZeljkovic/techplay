"use client";

import Link from "next/link";
import { Trophy, ChevronRight, Calendar, Shield, Pen, Activity } from "lucide-react";
import { format } from "date-fns";
import ProfileArticles from "./ProfileArticles";
import ProfileActivity from "./ProfileActivity";
import type { ProfileUser, ProfileStats, RecentArticle } from "@/lib/types/profile";

interface Achievement {
    id: number;
    name: string;
    description: string;
    points: number;
    icon_path?: string;
    is_unlocked: boolean;
    unlocked_at?: string | null;
}

interface ProfileOverviewProps {
    userData: ProfileUser;
    stats: ProfileStats;
    isStaff: boolean;
    recentArticles?: RecentArticle[];
    achievements: Achievement[];
}

export default function ProfileOverview({ userData, stats, isStaff, recentArticles, achievements }: ProfileOverviewProps) {
    const recentUnlocked = (achievements || [])
        .filter((a) => a.is_unlocked)
        .sort((a, b) => new Date(b.unlocked_at || "").getTime() - new Date(a.unlocked_at || "").getTime())
        .slice(0, 5);

    return (
        <div className="space-y-8">
            {/* === GAMER CARD === */}
            <div className="glow-card rounded-2xl bg-[var(--bg-card)] border border-white/[0.06] overflow-hidden">
                <div className="relative p-6 md:p-8">
                    {/* Subtle accent glow in corner */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--accent)]/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative">
                        {/* Bio */}
                        {userData.bio ? (
                            <p className="text-[var(--text-secondary)] leading-relaxed text-[15px] mb-6 max-w-2xl">
                                {userData.bio}
                            </p>
                        ) : (
                            <p className="text-white/20 italic text-sm mb-6">No bio written yet.</p>
                        )}

                        {/* Info chips */}
                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm">
                                <Shield className="w-3.5 h-3.5 text-[var(--accent)]" />
                                <span className="text-white/40 text-xs uppercase tracking-wider">Rank</span>
                                <span className="font-bold text-white text-xs">{userData.rank?.name || "Rookie"}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm">
                                <Calendar className="w-3.5 h-3.5 text-tp-accent" />
                                <span className="text-white/40 text-xs uppercase tracking-wider">Member Since</span>
                                <span className="font-bold text-white text-xs">
                                    {format(new Date(userData.created_at), "MMMM yyyy")}
                                </span>
                            </div>
                            {isStaff && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm">
                                    <Pen className="w-3.5 h-3.5 text-tp-accent/70" />
                                    <span className="text-white/40 text-xs uppercase tracking-wider">Articles</span>
                                    <span className="font-bold text-white text-xs">{stats.reviews_count || 0}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* === ACHIEVEMENT SPOTLIGHT === */}
            {recentUnlocked.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="profile-section-header text-white">
                            <Trophy className="w-5 h-5 text-yellow-400" />
                            Achievement Spotlight
                        </h3>
                        <Link
                            href="#"
                            className="text-xs text-white/40 hover:text-[var(--accent)] transition-colors flex items-center gap-1 uppercase tracking-wider font-semibold"
                            onClick={(e) => e.preventDefault()}
                        >
                            View All <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory">
                        {recentUnlocked.map((ach) => (
                            <div
                                key={ach.id}
                                className="snap-start flex-shrink-0 w-[200px] md:w-[220px] glow-card rounded-xl bg-[var(--bg-card)] border border-white/[0.06] p-4 flex flex-col items-center text-center group"
                            >
                                <div className="w-14 h-14 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    {ach.icon_path ? (
                                        <img src={ach.icon_path} alt={ach.name} className="w-9 h-9 object-contain" />
                                    ) : (
                                        <Trophy className="w-7 h-7 text-[var(--accent)]" />
                                    )}
                                </div>
                                <h4 className="font-bold text-sm text-white mb-1 line-clamp-1">{ach.name}</h4>
                                <span className="text-[11px] font-mono font-bold text-[var(--accent)]">
                                    +{ach.points} XP
                                </span>
                                {ach.unlocked_at && (
                                    <span className="text-[10px] text-white/30 mt-1">
                                        {format(new Date(ach.unlocked_at), "MMM d, yyyy")}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* === CONTENT SECTION === */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="profile-section-header text-white">
                        <Activity className="w-5 h-5 text-tp-accent" />
                        {isStaff ? "Published Articles" : "Recent Activity"}
                    </h3>
                </div>

                {isStaff ? (
                    <ProfileArticles articles={recentArticles || []} />
                ) : (
                    <ProfileActivity posts={userData.posts || []} />
                )}
            </div>
        </div>
    );
}
