"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Shield, BookOpen, LogIn, UserPlus, TrendingUp, Award, Users, MessageSquare, Clock } from "lucide-react";
import { format } from "date-fns";

export default function ForumSidebar() {
    const { user } = useAuth();

    return (
        <div className="space-y-6 sticky top-24">
            {/* User Profile Widget */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-lg">
                {user ? (
                    <div>
                        {/* Profile Header */}
                        <div className="bg-gradient-to-br from-[var(--accent)]/10 to-purple-600/10 p-6 text-center border-b border-[var(--border)]">
                            <div className="relative inline-block mb-3">
                                <div className="w-20 h-20 rounded-full overflow-hidden ring-3 ring-[var(--accent)] shadow-lg shadow-[var(--accent)]/20">
                                    {user.avatar_url ? (
                                        <Image src={user.avatar_url} alt={user.username} width={80} height={80} className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--accent)] to-purple-600 text-white text-2xl font-bold">
                                            {user.username?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>
                                {user.rank && (
                                    <div
                                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap border shadow-lg"
                                        style={{
                                            backgroundColor: user.rank.color,
                                            borderColor: `${user.rank.color}80`,
                                            color: '#fff'
                                        }}
                                    >
                                        {user.rank.name}
                                    </div>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mt-4">{user.username}</h3>
                            <p className="text-sm text-[var(--text-muted)] flex items-center justify-center gap-1">
                                <Clock className="w-3 h-3" />
                                Joined {user.created_at ? format(new Date(user.created_at), "MMM yyyy") : 'Unknown'}
                            </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 divide-x divide-[var(--border)]">
                            <div className="p-4 text-center">
                                <div className="flex items-center justify-center gap-1 text-[var(--accent)] mb-1">
                                    <Award className="w-4 h-4" />
                                </div>
                                <div className="text-xl font-bold text-[var(--text-primary)]">{user.forum_reputation || 0}</div>
                                <div className="text-[10px] uppercase text-[var(--text-muted)]">Reputation</div>
                            </div>
                            <div className="p-4 text-center">
                                <div className="flex items-center justify-center gap-1 text-[var(--accent)] mb-1">
                                    <MessageSquare className="w-4 h-4" />
                                </div>
                                <div className="text-xl font-bold text-[var(--text-primary)]">0</div>
                                <div className="text-[10px] uppercase text-[var(--text-muted)]">Posts</div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-[var(--border)]">
                            <Link href={`/profile/${user.username}`}>
                                <Button className="w-full" variant="outline">
                                    View Profile
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-[var(--accent)]/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <LogIn className="w-8 h-8 text-[var(--accent)]" />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Join the Community</h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-6">
                            Log in to start posting, earn reputation, and unlock new ranks!
                        </p>
                        <div className="space-y-3">
                            <Link href="/login" className="block">
                                <Button className="w-full shadow-lg shadow-[var(--accent)]/20">
                                    <LogIn className="w-4 h-4 mr-2" />
                                    Log In
                                </Button>
                            </Link>
                            <Link href="/register" className="block">
                                <Button className="w-full" variant="outline">
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Register
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Forum Stats Widget */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-[var(--accent)]" />
                    <h3 className="font-bold text-[var(--text-primary)]">Forum Stats</h3>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">Total Threads</span>
                        <span className="font-bold text-[var(--text-primary)]">--</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">Total Posts</span>
                        <span className="font-bold text-[var(--text-primary)]">--</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">Members</span>
                        <span className="font-bold text-[var(--text-primary)]">--</span>
                    </div>
                </div>
            </div>

            {/* Community Guidelines Widget */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-[var(--accent)]" />
                    <h3 className="font-bold text-[var(--text-primary)]">Community Guidelines</h3>
                </div>
                <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                    <li className="flex gap-3">
                        <span className="text-[var(--accent)] font-bold shrink-0">1.</span>
                        <span>Be respectful to all members. No toxicity or harassment.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-[var(--accent)] font-bold shrink-0">2.</span>
                        <span>Keep discussions on topic. Use the correct sub-forum.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-[var(--accent)] font-bold shrink-0">3.</span>
                        <span>No spamming or self-promotion without permission.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-[var(--accent)] font-bold shrink-0">4.</span>
                        <span>Use search before posting. Avoid duplicate threads.</span>
                    </li>
                </ul>
                <div className="mt-5 pt-4 border-t border-[var(--border)]">
                    <Link href="/rules" className="flex items-center justify-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors font-medium">
                        <BookOpen className="w-4 h-4" />
                        Read Full Rules
                    </Link>
                </div>
            </div>
        </div>
    );
}
