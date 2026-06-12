"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { Shield, BookOpen, LogIn, TrendingUp, Award, MessageSquare, Clock } from "lucide-react";
import { format } from "date-fns";
import useSWR from "swr";
import axios from "@/lib/axios";

interface ForumStats {
    total_threads: number;
    total_posts: number;
    members: number;
}

const panelClass = "bg-white dark:bg-[#0B0E14]/80 backdrop-blur-md border border-zinc-200 dark:border-[#161B22] rounded-[20px] shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-colors duration-300 relative overflow-hidden";

function PanelHeader({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
    return (
        <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-tp-accent/10 border border-tp-accent/20 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-tp-accent" />
            </div>
            <h3 className="font-display text-[13px] font-bold text-zinc-900 dark:text-white uppercase tracking-[0.08em]">{title}</h3>
        </div>
    );
}

export default function ForumSidebar() {
    const { user } = useAuth();
    const { data: stats, isLoading } = useSWR<ForumStats>('/forum/stats', () => axios.get('/forum/stats').then(res => res.data));

    return (
        <div className="space-y-6 sticky top-[130px]">
            {/* User Profile Widget */}
            <div className={panelClass}>
                <div className="absolute top-0 left-[20%] w-[60%] h-[1px] bg-gradient-to-r from-transparent via-tp-accent/30 dark:via-tp-accent/40 to-transparent" />
                {user ? (
                    <div>
                        {/* Profile Header */}
                        <div className="relative p-6 text-center border-b border-zinc-200 dark:border-[#161B22]">
                            <div className="absolute -top-[60px] left-1/2 -translate-x-1/2 w-[200px] h-[140px] bg-tp-accent/5 dark:bg-tp-accent/10 blur-[60px] rounded-full pointer-events-none" />
                            <div className="relative inline-block mb-3">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-tp-accent/40 shadow-lg shadow-tp-accent/10">
                                    {user.avatar_url ? (
                                        <Image src={user.avatar_url} alt={user.username} width={80} height={80} className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-tp-accent text-white text-2xl font-bold font-display">
                                            {user.username?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>
                                {user.rank && (
                                    <div
                                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest whitespace-nowrap border shadow-lg"
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
                            <h3 className="font-display text-[17px] font-bold text-zinc-900 dark:text-white mt-4">{user.username}</h3>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#71717A] flex items-center justify-center gap-1.5 mt-1">
                                <Clock className="w-3 h-3" />
                                Joined {user.created_at ? format(new Date(user.created_at), "MMM yyyy") : 'Unknown'}
                            </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 divide-x divide-zinc-200 dark:divide-[#161B22]">
                            <div className="p-4 text-center">
                                <div className="flex items-center justify-center text-tp-accent mb-1">
                                    <Award className="w-4 h-4" />
                                </div>
                                <div className="font-display text-[20px] font-bold text-zinc-900 dark:text-white leading-none">{user.level || 1}</div>
                                <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-[#71717A] mt-1">Level</div>
                            </div>
                            <div className="p-4 text-center">
                                <div className="flex items-center justify-center text-tp-accent mb-1">
                                    <MessageSquare className="w-4 h-4" />
                                </div>
                                <div className="font-display text-[20px] font-bold text-zinc-900 dark:text-white leading-none">{user.posts_count || 0}</div>
                                <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-[#71717A] mt-1">Posts</div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-zinc-200 dark:border-[#161B22]">
                            <Link
                                href={`/profile/${user.username}`}
                                className="flex items-center justify-center w-full h-[42px] rounded-lg border border-zinc-200 dark:border-[#161B22] text-zinc-700 dark:text-[#A1A1AA] hover:border-tp-accent/40 hover:text-tp-accent text-[11px] font-bold uppercase tracking-wider transition-colors"
                            >
                                View Profile
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="relative p-6 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-tp-accent/10 border border-tp-accent/20 flex items-center justify-center mx-auto mb-5">
                            <LogIn className="w-6 h-6 text-tp-accent" />
                        </div>
                        <h3 className="font-display text-[17px] font-bold text-zinc-900 dark:text-white uppercase tracking-[0.04em] mb-2">Join the Community</h3>
                        <p className="text-[13px] text-zinc-600 dark:text-[#A1A1AA] leading-relaxed mb-6">
                            Log in to start posting, earn reputation, and unlock new ranks!
                        </p>
                        <div className="space-y-3">
                            <Link
                                href="/login"
                                className="flex items-center justify-center w-full h-[44px] rounded-lg bg-tp-accent hover:bg-tp-accent-hover text-white text-[11px] font-bold uppercase tracking-widest transition-colors shadow-lg shadow-tp-accent/20"
                            >
                                Log In
                            </Link>
                            <Link
                                href="/register"
                                className="flex items-center justify-center w-full h-[44px] rounded-lg border border-zinc-200 dark:border-[#161B22] text-zinc-700 dark:text-[#A1A1AA] hover:border-tp-accent/40 hover:text-tp-accent text-[11px] font-bold uppercase tracking-widest transition-colors"
                            >
                                Register
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Forum Stats Widget */}
            <div className={`${panelClass} p-5`}>
                <PanelHeader icon={TrendingUp} title="Forum Stats" />
                <div className="space-y-1">
                    {[
                        { label: "Total Threads", value: stats?.total_threads },
                        { label: "Total Posts", value: stats?.total_posts },
                        { label: "Members", value: stats?.members },
                    ].map((row, i, arr) => (
                        <div key={row.label} className={`flex items-center justify-between py-2.5 ${i !== arr.length - 1 ? "border-b border-zinc-200 dark:border-white/[0.04]" : ""}`}>
                            <span className="text-[13px] text-zinc-600 dark:text-[#A1A1AA]">{row.label}</span>
                            <span className="font-display text-[14px] font-bold text-zinc-900 dark:text-white">
                                {isLoading ? '...' : row.value?.toLocaleString() || '0'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Community Guidelines Widget */}
            <div className={`${panelClass} p-5`}>
                <PanelHeader icon={Shield} title="Guidelines" />
                <ul className="space-y-3 text-[13px] text-zinc-600 dark:text-[#A1A1AA] leading-relaxed">
                    <li className="flex gap-3">
                        <span className="font-display text-tp-accent font-bold shrink-0">01</span>
                        <span>Respect & Civil Discourse: No toxicity, harassment, or hate speech.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="font-display text-tp-accent font-bold shrink-0">02</span>
                        <span>Relevant Content: Keep discussions on topic in correct sub-forums.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="font-display text-tp-accent font-bold shrink-0">03</span>
                        <span>No Spam: Self-promotion is only allowed in designated areas.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="font-display text-tp-accent font-bold shrink-0">04</span>
                        <span>Safe Environment: No illegal content, NSFW material, or piracy.</span>
                    </li>
                </ul>
                <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-[#161B22]">
                    <Link href="/forum/rules" className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#71717A] hover:text-tp-accent transition-colors">
                        <BookOpen className="w-4 h-4" />
                        Read Full Rules
                    </Link>
                </div>
            </div>
        </div>
    );
}
