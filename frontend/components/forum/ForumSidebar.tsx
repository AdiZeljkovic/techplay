"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Shield, BookOpen, LogIn, UserPlus } from "lucide-react";
import { format } from "date-fns";

export default function ForumSidebar() {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            {/* User Profile Widget */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
                {user ? (
                    <div className="text-center">
                        <div className="relative inline-block mb-4">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--accent)] mx-auto bg-[var(--bg-secondary)] flex items-center justify-center">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-bold text-[var(--accent)] uppercase">
                                        {user.username?.charAt(0) || '?'}
                                    </span>
                                )}
                            </div>
                            {user.rank && (
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 min-w-max">
                                    <span style={{ color: user.rank.color }}>{user.rank.name}</span>
                                </div>
                            )}
                        </div>

                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{user.username}</h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-4">
                            Joined {user.created_at ? format(new Date(user.created_at), "MMM yyyy") : 'Unknown'}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-center text-sm py-3 border-t border-[var(--border)]">
                            <div>
                                <div className="font-bold text-[var(--text-primary)]">{user.forum_reputation || 0}</div>
                                <div className="text-[var(--text-muted)] text-xs">Reputation</div>
                            </div>
                            <div>
                                <div className="font-bold text-[var(--text-primary)]">0</div>
                                <div className="text-[var(--text-muted)] text-xs">Posts</div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <Link href={`/profile/${user.username}`}>
                                <Button className="w-full" variant="outline">
                                    View Profile
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--accent)]">
                            <LogIn className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Join the Community</h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-6">
                            Log in or register to start posting, earn reputation, and unlock new ranks!
                        </p>
                        <div className="space-y-3">
                            <Link href="/login" className="block">
                                <Button className="w-full">
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

            {/* Forum Rules Widget */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-[var(--accent)]" />
                    <h3 className="font-bold text-[var(--text-primary)]">Community Guidelines</h3>
                </div>
                <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                    <li className="flex gap-3">
                        <span className="text-[var(--accent)] font-bold">1.</span>
                        <span>Be respectful to all members. No toxicity or harassment.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-[var(--accent)] font-bold">2.</span>
                        <span>Keep discussions on topic. Use the correct sub-forum.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-[var(--accent)] font-bold">3.</span>
                        <span>No spamming or self-promotion without permission.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-[var(--accent)] font-bold">4.</span>
                        <span>Use search before posting. Avoid duplicate threads.</span>
                    </li>
                </ul>
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <Link href="/rules" className="flex items-center justify-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                        <BookOpen className="w-4 h-4" />
                        Read Full Rules
                    </Link>
                </div>
            </div>
        </div>
    );
}
