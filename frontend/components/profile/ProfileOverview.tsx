"use client";

import ProfileArticles from "./ProfileArticles";
import ProfileActivity from "./ProfileActivity";
import type { ProfileUser, ProfileStats, RecentArticle } from "@/lib/types/profile";

interface ProfileOverviewProps {
    userData: ProfileUser;
    stats: ProfileStats;
    isStaff: boolean;
    recentArticles?: RecentArticle[];
}

export default function ProfileOverview({ userData, stats, isStaff, recentArticles }: ProfileOverviewProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Sidebar: About & Mini Stats */}
            <div className="space-y-6">
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-4">About</h3>
                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                        {userData.bio || "This user hasn't written a bio yet."}
                    </p>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-4">Stats</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--text-muted)]">Threads Created</span>
                            <span className="font-mono">{stats.threads_count || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--text-muted)]">Forum Posts</span>
                            <span className="font-mono">{stats.posts_count || 0}</span>
                        </div>
                        {isStaff ? (
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--text-muted)]">Articles Published</span>
                                <span className="font-mono text-[var(--accent)]">{stats.reviews_count || 0}</span>
                            </div>
                        ) : (
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--text-muted)]">Achievements</span>
                                <span className="font-mono text-[var(--accent)]">{stats.achievements_count || 0}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm pt-2 border-t border-[var(--border)] mt-2">
                            <span className="text-[var(--text-muted)]">Global Rank</span>
                            <span className="font-bold text-white">{userData.rank?.name || "Rookie"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Feed */}
            <div className="md:col-span-2 space-y-6">
                <h3 className="font-bold text-xl text-[var(--text-primary)]">
                    {isStaff ? "Published Articles" : "Recent Activity"}
                </h3>
                {isStaff ? (
                    <ProfileArticles articles={recentArticles || []} />
                ) : (
                    <ProfileActivity posts={userData.posts || []} />
                )}
            </div>
        </div>
    );
}
