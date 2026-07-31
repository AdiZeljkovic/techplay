"use client";

import Link from "next/link";
import useSWR from "swr";
import { Gamepad2, ListChecks, Award, Users, UserPlus, User as UserIcon } from "lucide-react";
import axios from "@/lib/axios";

const FEATURES = [
    { icon: Gamepad2, title: "Track Games", sub: "Log and organize your collection" },
    { icon: ListChecks, title: "Build Backlog", sub: "Save games and plan your next play" },
    { icon: Award, title: "Earn Achievements", sub: "Unlock badges and show your progress" },
    { icon: Users, title: "Join Community", sub: "Discuss, review and connect with players" },
];

interface LeaderEntry { username: string; name: string; avatar_url: string | null; value: number; }

const leaderFetcher = () =>
    axios.get("/leaderboard", { params: { type: "xp", period: "all" } }).then((r) => (r.data?.data ?? r.data ?? []) as LeaderEntry[]);

/** Bottom-of-page conversion band: platform features + a real top profile as social proof. */
export default function ProfileCtaBand() {
    const { data: leaders } = useSWR("cta-leader", leaderFetcher, { dedupingInterval: 600_000, revalidateOnFocus: false });
    const showcase = leaders?.[0];

    return (
        <section className="relative rounded-[var(--radius-panel)] bg-[var(--surface-1)] border border-[var(--line)] overflow-hidden p-6 md:p-10">
            <span className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-2">Build your gaming identity</p>
                    <h2 className="font-display text-[28px] font-black text-[var(--ink-hi)] leading-tight">
                        Your games. Your profile. <span className="text-[var(--accent)]">Your community.</span>
                    </h2>
                    <p className="mt-3 text-[14px] text-[var(--ink-mid)] max-w-lg">
                        Create a free TechPlay profile to personalize your experience and unlock powerful features.
                    </p>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                        {FEATURES.map((f) => (
                            <div key={f.title} className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
                                    <f.icon className="w-4 h-4 text-[var(--accent)]" />
                                </span>
                                <div>
                                    <p className="font-display text-[13px] font-bold text-[var(--ink-hi)] leading-tight">{f.title}</p>
                                    <p className="text-[11px] text-[var(--ink-low)]">{f.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Link
                        href="/register"
                        className="mt-7 inline-flex items-center gap-2 px-6 h-12 rounded-[var(--radius-card)] bg-[var(--accent)] text-white font-display text-[13px] font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors duration-300 shadow-[var(--glow-accent)]"
                    >
                        <UserPlus className="w-4 h-4" /> Create Your Profile
                    </Link>
                </div>

                {/* Social proof: the current #1 profile */}
                {showcase && (
                    <div className="lg:col-span-5">
                        <div className="rounded-[var(--radius-card)] bg-[var(--fill-1)] border border-[var(--line)] p-5">
                            <div className="flex items-center gap-3.5">
                                {showcase.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={showcase.avatar_url} alt={showcase.name} className="w-14 h-14 rounded-full object-cover border-2 border-[var(--accent)]/40" />
                                ) : (
                                    <span className="w-14 h-14 rounded-full bg-[var(--fill-2)] border border-[var(--line-strong)] flex items-center justify-center">
                                        <UserIcon className="w-6 h-6 text-[var(--ink-faint)]" />
                                    </span>
                                )}
                                <div className="min-w-0">
                                    <p className="font-display text-[15px] font-bold text-[var(--ink-hi)] truncate">{showcase.name || showcase.username}</p>
                                    <p className="text-[11px] text-[var(--ink-low)]">
                                        Level {Math.floor(showcase.value / 1000) + 1} · {showcase.value.toLocaleString()} XP
                                    </p>
                                </div>
                                <span className="ml-auto shrink-0 px-2.5 py-1 rounded-full bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] text-[var(--accent)] text-[9px] font-black uppercase tracking-widest">
                                    #1 Gamer
                                </span>
                            </div>
                            <Link
                                href={`/profile/${showcase.username}`}
                                className="mt-4 flex items-center justify-center h-11 rounded-[var(--radius-card)] bg-[var(--fill-2)] border border-[var(--line-strong)] font-display text-[11px] font-bold uppercase tracking-wider text-[var(--ink-hi)] hover:bg-[var(--fill-3)] transition-colors duration-300"
                            >
                                View profile
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
