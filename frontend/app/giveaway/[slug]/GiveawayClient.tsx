"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import { Gift, Clock, Users, Trophy, Check, ExternalLink, Share2, Copy, Loader2 } from "lucide-react";

interface Task {
    id: number;
    type: string;
    title: string;
    description: string | null;
    points: number;
    url: string | null;
    icon: string;
    is_required: boolean;
    is_repeatable: boolean;
}

interface Giveaway {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    rules: string | null;
    featured_image: string | null;
    prize: {
        name: string;
        value: number | null;
        image: string | null;
    };
    timing: {
        starts_at: string;
        ends_at: string;
        is_active: boolean;
        has_ended: boolean;
        time_remaining: number | null;
    };
    stats: {
        total_entries: number;
        total_points_pool: number;
    };
    tasks: Task[];
    winner: {
        id: number;
        username: string;
        avatar: string | null;
    } | null;
    status: string;
}

interface Entry {
    id: number;
    total_points: number;
    referral_code: string;
    referral_url: string;
    referral_count: number;
    win_chance: number;
    completed_task_ids: number[];
}

interface GiveawayClientProps {
    slug: string;
}

export default function GiveawayClient({ slug }: GiveawayClientProps) {
    const { user, isAuthenticated } = useAuth();
    const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
    const [entry, setEntry] = useState<Entry | null>(null);
    const [loading, setLoading] = useState(true);
    const [entering, setEntering] = useState(false);
    const [completingTask, setCompletingTask] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);

    // Fetch giveaway data
    const fetchGiveaway = useCallback(async () => {
        try {
            const res = await axios.get(`/giveaways/${slug}`);
            setGiveaway(res.data.data);
            setTimeRemaining(res.data.data.timing.time_remaining || 0);
        } catch (error) {
            console.error("Failed to fetch giveaway:", error);
        } finally {
            setLoading(false);
        }
    }, [slug]);

    // Fetch user entry
    const fetchEntry = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await axios.get(`/giveaways/${slug}/my-entry`);
            setEntry(res.data.data);
        } catch (error) {
            console.error("Failed to fetch entry:", error);
        }
    }, [slug, isAuthenticated]);

    useEffect(() => {
        fetchGiveaway();
    }, [fetchGiveaway]);

    useEffect(() => {
        fetchEntry();
    }, [fetchEntry]);

    // Countdown timer
    useEffect(() => {
        if (timeRemaining <= 0) return;

        const interval = setInterval(() => {
            setTimeRemaining((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(interval);
    }, [timeRemaining]);

    // Format countdown
    const formatTime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return { days, hours, mins, secs };
    };

    // Enter giveaway
    const handleEnter = async () => {
        if (!isAuthenticated) return;
        setEntering(true);
        try {
            const res = await axios.post(`/giveaways/${slug}/enter`);
            setEntry(res.data.data);
        } catch (error) {
            console.error("Failed to enter:", error);
        } finally {
            setEntering(false);
        }
    };

    // Complete task
    const handleCompleteTask = async (taskId: number, url: string | null) => {
        if (url) {
            window.open(url, "_blank");
        }

        if (!isAuthenticated || !entry) return;

        setCompletingTask(taskId);
        try {
            const res = await axios.post(`/giveaways/${slug}/tasks/${taskId}/complete`);
            setEntry(res.data.data);
        } catch (error) {
            console.error("Failed to complete task:", error);
        } finally {
            setCompletingTask(null);
        }
    };

    // Copy referral link
    const handleCopyReferral = () => {
        if (!entry) return;
        navigator.clipboard.writeText(entry.referral_url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    if (!giveaway) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="text-center">
                    <Gift className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Giveaway Not Found</h1>
                    <p className="text-[var(--text-secondary)] mt-2">This giveaway may have ended or doesn't exist.</p>
                </div>
            </div>
        );
    }

    const time = formatTime(timeRemaining);
    const isEntered = !!entry;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent)]/20 via-transparent to-transparent" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--accent)]/10 rounded-full blur-3xl" />

                <div className="relative max-w-5xl mx-auto px-4 py-16 text-center">
                    {/* Prize Image */}
                    {giveaway.prize.image && (
                        <div className="relative w-64 h-64 mx-auto mb-8">
                            <Image
                                src={giveaway.prize.image}
                                alt={giveaway.prize.name}
                                fill
                                className="object-contain drop-shadow-2xl"
                            />
                        </div>
                    )}

                    {/* Status Badge */}
                    {giveaway.winner ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-semibold mb-4">
                            <Trophy className="w-4 h-4" />
                            Winner Announced!
                        </div>
                    ) : giveaway.timing.has_ended ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-full text-sm font-semibold mb-4">
                            <Clock className="w-4 h-4" />
                            Giveaway Ended
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold mb-4">
                            <Gift className="w-4 h-4" />
                            Active Giveaway
                        </div>
                    )}

                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
                        {giveaway.title}
                    </h1>

                    {/* Prize Name & Value */}
                    <div className="flex items-center justify-center gap-4 text-2xl font-bold text-[var(--accent)] mb-8">
                        <span>{giveaway.prize.name}</span>
                        {giveaway.prize.value && (
                            <span className="text-[var(--text-secondary)]">
                                (€{giveaway.prize.value})
                            </span>
                        )}
                    </div>

                    {/* Countdown Timer */}
                    {!giveaway.timing.has_ended && (
                        <div className="flex items-center justify-center gap-4 mb-8">
                            {[
                                { label: "Days", value: time.days },
                                { label: "Hours", value: time.hours },
                                { label: "Minutes", value: time.mins },
                                { label: "Seconds", value: time.secs },
                            ].map((item) => (
                                <div key={item.label} className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-4 min-w-[80px]">
                                    <div className="text-3xl font-bold text-[var(--accent)]">
                                        {String(item.value).padStart(2, "0")}
                                    </div>
                                    <div className="text-xs text-[var(--text-muted)] uppercase">
                                        {item.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-center gap-8 text-[var(--text-secondary)]">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            <span className="font-semibold">{giveaway.stats.total_entries}</span>
                            <span>Entries</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Winner Announcement */}
            {giveaway.winner && (
                <div className="max-w-2xl mx-auto px-4 -mt-8 mb-12">
                    <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-8 text-center">
                        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                            🎉 Congratulations!
                        </h2>
                        <p className="text-[var(--text-secondary)] mb-4">The winner is:</p>
                        <div className="inline-flex items-center gap-3 bg-[var(--bg-elevated)] px-6 py-3 rounded-xl">
                            <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold text-lg">
                                {giveaway.winner.username[0].toUpperCase()}
                            </div>
                            <span className="text-xl font-bold text-[var(--accent)]">
                                @{giveaway.winner.username}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 pb-16">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Tasks */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Entry Section */}
                        {!isAuthenticated ? (
                            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 text-center">
                                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                                    Login to Enter
                                </h2>
                                <p className="text-[var(--text-secondary)] mb-6">
                                    Create an account or login to participate in this giveaway.
                                </p>
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white font-semibold rounded-xl hover:bg-[var(--accent-hover)] transition-colors"
                                >
                                    Login / Register
                                </Link>
                            </div>
                        ) : !isEntered && giveaway.timing.is_active ? (
                            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 text-center">
                                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                                    Ready to Enter?
                                </h2>
                                <p className="text-[var(--text-secondary)] mb-6">
                                    Complete tasks below to earn points and increase your chances!
                                </p>
                                <button
                                    onClick={handleEnter}
                                    disabled={entering}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white font-semibold rounded-xl hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
                                >
                                    {entering ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Gift className="w-5 h-5" />
                                    )}
                                    Enter Giveaway
                                </button>
                            </div>
                        ) : null}

                        {/* Tasks */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">
                                Complete Tasks to Earn Points
                            </h2>

                            {giveaway.tasks.map((task) => {
                                const isCompleted = entry?.completed_task_ids.includes(task.id);
                                const isCompleting = completingTask === task.id;

                                return (
                                    <div
                                        key={task.id}
                                        className={`bg-[var(--bg-elevated)] border rounded-xl p-4 transition-all ${isCompleted
                                                ? "border-green-500/50 bg-green-500/5"
                                                : "border-[var(--border)] hover:border-[var(--accent)]/50"
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Icon */}
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isCompleted ? "bg-green-500/20" : "bg-[var(--bg-primary)]"
                                                }`}>
                                                {isCompleted ? (
                                                    <Check className="w-6 h-6 text-green-400" />
                                                ) : (
                                                    task.icon
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-[var(--text-primary)]">
                                                        {task.title}
                                                    </h3>
                                                    {task.is_required && (
                                                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                                                            Required
                                                        </span>
                                                    )}
                                                    {task.is_repeatable && (
                                                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                                                            Daily
                                                        </span>
                                                    )}
                                                </div>
                                                {task.description && (
                                                    <p className="text-sm text-[var(--text-secondary)]">
                                                        {task.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Points & Action */}
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="font-bold text-[var(--accent)]">
                                                        +{task.points}
                                                    </div>
                                                    <div className="text-xs text-[var(--text-muted)]">
                                                        points
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleCompleteTask(task.id, task.url)}
                                                    disabled={isCompleted || isCompleting || !giveaway.timing.is_active || !isEntered}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isCompleted
                                                            ? "bg-green-500/20 text-green-400 cursor-default"
                                                            : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                                                        }`}
                                                >
                                                    {isCompleting ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : isCompleted ? (
                                                        <>
                                                            <Check className="w-4 h-4" />
                                                            Done
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ExternalLink className="w-4 h-4" />
                                                            Go
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Description */}
                        {giveaway.description && (
                            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6">
                                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                                    About This Giveaway
                                </h2>
                                <div
                                    className="prose prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: giveaway.description }}
                                />
                            </div>
                        )}

                        {/* Rules */}
                        {giveaway.rules && (
                            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6">
                                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                                    Rules & Terms
                                </h2>
                                <p className="text-[var(--text-secondary)] whitespace-pre-wrap">
                                    {giveaway.rules}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Entry Status */}
                    <div className="space-y-6">
                        {/* Your Entry */}
                        {entry && (
                            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 sticky top-4">
                                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">
                                    Your Entry
                                </h2>

                                {/* Points */}
                                <div className="text-center mb-6">
                                    <div className="text-5xl font-bold text-[var(--accent)]">
                                        {entry.total_points}
                                    </div>
                                    <div className="text-[var(--text-secondary)]">
                                        Total Points
                                    </div>
                                </div>

                                {/* Win Chance */}
                                <div className="bg-[var(--bg-primary)] rounded-xl p-4 mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[var(--text-secondary)]">Win Chance</span>
                                        <span className="font-bold text-[var(--accent)]">
                                            {entry.win_chance}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(entry.win_chance, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Referral */}
                                <div className="border-t border-[var(--border)] pt-6">
                                    <h3 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                                        <Share2 className="w-4 h-4" />
                                        Invite Friends
                                    </h3>
                                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                                        Share your referral link to earn bonus points!
                                    </p>

                                    <button
                                        onClick={handleCopyReferral}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl hover:border-[var(--accent)] transition-colors"
                                    >
                                        <Copy className="w-4 h-4" />
                                        {copied ? "Copied!" : "Copy Referral Link"}
                                    </button>

                                    {entry.referral_count > 0 && (
                                        <div className="mt-4 text-center text-[var(--text-secondary)]">
                                            <span className="font-bold text-[var(--accent)]">
                                                {entry.referral_count}
                                            </span>{" "}
                                            friends referred
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
