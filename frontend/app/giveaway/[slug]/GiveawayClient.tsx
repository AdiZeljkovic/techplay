"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import { Gift, Clock, Users, Trophy, Check, ExternalLink, Share2, Copy, Loader2, Zap, Award, Star, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Leaderboard from "@/components/giveaway/Leaderboard";

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

interface PrizeTier {
    id: number;
    tier_name: string;
    prize_description: string | null;
    winner_count: number;
    min_points: number;
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
    prize_tiers: PrizeTier[];
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
    streak_days: number;
    last_visit_date: string | null;
    can_claim_daily_bonus: boolean;
}

interface GiveawayClientProps {
    slug: string;
}

const STREAK_MILESTONES: Record<number, number> = { 3: 5, 7: 10, 14: 20, 30: 50 };
const MILESTONE_DAYS = [3, 7, 14, 30];

export default function GiveawayClient({ slug }: GiveawayClientProps) {
    const { user, isAuthenticated } = useAuth();
    const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
    const [entry, setEntry] = useState<Entry | null>(null);
    const [loading, setLoading] = useState(true);
    const [entering, setEntering] = useState(false);
    const [completingTask, setCompletingTask] = useState<number | null>(null);
    const [claimingBonus, setClaimingBonus] = useState(false);
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

    // Confetti animation when winner is announced
    useEffect(() => {
        if (giveaway?.winner) {
            const duration = 3000;
            const end = Date.now() + duration;
            const colors = ['#ff6b35', '#f7931e', '#fdc830', '#37ecba', '#8b5cf6'];

            (function frame() {
                confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors });
                confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors });
                if (Date.now() < end) requestAnimationFrame(frame);
            }());

            setTimeout(() => {
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            }, 500);
        }
    }, [giveaway?.winner]);

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
        if (url) window.open(url, "_blank");
        if (!isAuthenticated || !entry) return;

        setCompletingTask(taskId);
        try {
            const res = await axios.post(`/giveaways/${slug}/tasks/${taskId}/complete`);
            setEntry(res.data.data);
            // Mini confetti burst on task completion
            confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 }, colors: ['#FC4100', '#f7931e', '#fdc830'] });
        } catch (error) {
            console.error("Failed to complete task:", error);
        } finally {
            setCompletingTask(null);
        }
    };

    // Claim daily bonus
    const handleClaimDailyBonus = async () => {
        if (!isAuthenticated || !entry) return;
        setClaimingBonus(true);
        try {
            const res = await axios.post(`/giveaways/${slug}/daily-bonus`);
            setEntry(res.data.data);
            confetti({ particleCount: 20, spread: 50, origin: { y: 0.6 }, colors: ['#f97316', '#eab308', '#fbbf24'] });
        } catch (error) {
            console.error("Failed to claim daily bonus:", error);
        } finally {
            setClaimingBonus(false);
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
                    <p className="text-[var(--text-secondary)] mt-2">This giveaway may have ended or doesn&apos;t exist.</p>
                </div>
            </div>
        );
    }

    const time = formatTime(timeRemaining);
    const isEntered = !!entry;

    // Task grouping: required first, then optional
    const requiredTasks = giveaway.tasks.filter(t => t.is_required);
    const optionalTasks = giveaway.tasks.filter(t => !t.is_required);
    const sortedTasks = [...requiredTasks, ...optionalTasks];
    const completedTotal = giveaway.tasks.filter(t => entry?.completed_task_ids.includes(t.id)).length;
    const completedRequired = requiredTasks.filter(t => entry?.completed_task_ids.includes(t.id)).length;

    // Streak milestone
    const nextMilestone = MILESTONE_DAYS.find(m => m > (entry?.streak_days ?? 0));
    const streakProgress = nextMilestone ? ((entry?.streak_days ?? 0) / nextMilestone) * 100 : 100;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--accent)]/5 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Hero Section */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent)]/10 via-transparent to-transparent" />

                <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-20">
                    <div className="text-center mb-12">
                        {/* Status Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 glass"
                        >
                            {giveaway.winner ? (
                                <>
                                    <Trophy className="w-4 h-4 text-yellow-400" />
                                    <span className="text-yellow-400 font-semibold">Winner Announced!</span>
                                </>
                            ) : giveaway.timing.has_ended ? (
                                <>
                                    <Clock className="w-4 h-4 text-red-400" />
                                    <span className="text-red-400 font-semibold">Giveaway Ended</span>
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 text-green-400" />
                                    <span className="text-green-400 font-semibold">Active Giveaway</span>
                                </>
                            )}
                        </motion.div>

                        {/* Title */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-[var(--text-secondary)] to-white bg-clip-text text-transparent"
                        >
                            {giveaway.title}
                        </motion.h1>

                        {/* Prize Display */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="relative mb-12"
                        >
                            {giveaway.prize.image && (
                                <div className="relative w-full max-w-md mx-auto aspect-square mb-6">
                                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/20 to-purple-500/20 rounded-3xl blur-2xl" />
                                    <div className="relative w-full h-full glass-card rounded-3xl p-8 flex items-center justify-center">
                                        <Image
                                            src={giveaway.prize.image}
                                            alt={giveaway.prize.name}
                                            fill
                                            className="object-contain drop-shadow-2xl p-4"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="inline-flex items-center gap-3 px-6 py-3 glass-card rounded-2xl">
                                <Award className="w-6 h-6 text-[var(--accent)]" />
                                <span className="text-2xl font-bold text-white">{giveaway.prize.name}</span>
                                {giveaway.prize.value && (
                                    <>
                                        <span className="text-[var(--text-muted)]">&bull;</span>
                                        <span className="text-xl font-semibold text-[var(--accent)]">&euro;{giveaway.prize.value.toLocaleString()}</span>
                                    </>
                                )}
                            </div>
                        </motion.div>

                        {/* Countdown Timer */}
                        {!giveaway.timing.has_ended && timeRemaining > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="mb-8"
                            >
                                <h3 className="text-sm uppercase tracking-wider text-[var(--text-muted)] mb-4">Time Remaining</h3>
                                <div className="flex items-center justify-center gap-3 md:gap-4">
                                    {[
                                        { label: "Days", value: time.days },
                                        { label: "Hours", value: time.hours },
                                        { label: "Minutes", value: time.mins },
                                        { label: "Seconds", value: time.secs },
                                    ].map((item, idx) => (
                                        <motion.div
                                            key={item.label}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.4 + idx * 0.1 }}
                                            className="relative group"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            <div className="relative glass-card rounded-2xl p-4 md:p-6 min-w-[70px] md:min-w-[90px]">
                                                <div className="text-3xl md:text-4xl font-bold text-[var(--accent)] mb-1">
                                                    {String(item.value).padStart(2, "0")}
                                                </div>
                                                <div className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                                                    {item.label}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Stats */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full"
                        >
                            <Users className="w-4 h-4 text-[var(--accent)]" />
                            <span className="font-bold text-white">{giveaway.stats.total_entries}</span>
                            <span className="text-[var(--text-muted)]">Participants</span>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Winner Announcement */}
            <AnimatePresence>
                {giveaway.winner && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="max-w-2xl mx-auto px-4 mb-12"
                    >
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition-opacity" />
                            <div className="relative glass-card rounded-3xl p-8 text-center border-2 border-yellow-500/30">
                                <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                                    We Have a Winner!
                                </h2>
                                <div className="inline-flex items-center gap-4 bg-[var(--bg-elevated)] px-8 py-4 rounded-2xl border border-[var(--accent)]">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--accent)] to-orange-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                        {giveaway.winner.username[0].toUpperCase()}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Winner</div>
                                        <div className="text-2xl font-bold text-[var(--accent)]">
                                            @{giveaway.winner.username}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 pb-16">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Tasks */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Entry CTA */}
                        {!isAuthenticated ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card rounded-3xl p-8 text-center relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative">
                                    <Gift className="w-16 h-16 text-[var(--accent)] mx-auto mb-4" />
                                    <h2 className="text-2xl font-bold mb-3">Ready to Win?</h2>
                                    <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                                        Sign in to participate and complete tasks to boost your chances of winning!
                                    </p>
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[var(--accent)] to-orange-600 text-white font-bold rounded-xl hover:shadow-[0_0_30px_rgba(252,65,0,0.5)] transition-all duration-300 transform hover:scale-105"
                                    >
                                        Login / Register
                                    </Link>
                                </div>
                            </motion.div>
                        ) : !isEntered && giveaway.timing.is_active ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card rounded-3xl p-8 text-center relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative">
                                    <Zap className="w-16 h-16 text-[var(--accent)] mx-auto mb-4" />
                                    <h2 className="text-2xl font-bold mb-3">Join the Giveaway</h2>
                                    <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                                        Click below to enter and start earning points by completing tasks!
                                    </p>
                                    <button
                                        onClick={handleEnter}
                                        disabled={entering}
                                        className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[var(--accent)] to-orange-600 text-white font-bold rounded-xl hover:shadow-[0_0_30px_rgba(252,65,0,0.5)] transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {entering ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Entering...
                                            </>
                                        ) : (
                                            <>
                                                <Gift className="w-5 h-5" />
                                                Enter Giveaway
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ) : null}

                        {/* Tasks Section */}
                        {giveaway.tasks.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-purple-500/20 flex items-center justify-center">
                                            <Star className="w-5 h-5 text-[var(--accent)]" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold">Earn Points</h2>
                                            {entry && (
                                                <p className="text-sm text-[var(--text-muted)]">
                                                    Completed {completedTotal} of {giveaway.tasks.length} tasks
                                                    {requiredTasks.length > 0 && (
                                                        <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md font-semibold">
                                                            {completedRequired}/{requiredTasks.length} required
                                                        </span>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {sortedTasks.map((task, idx) => {
                                    const isCompleted = entry?.completed_task_ids.includes(task.id);
                                    const isCompleting = completingTask === task.id;
                                    const showSeparator = requiredTasks.length > 0 && optionalTasks.length > 0 && idx === requiredTasks.length;

                                    return (
                                        <div key={task.id}>
                                            {/* Separator between required and optional */}
                                            {showSeparator && (
                                                <div className="flex items-center gap-3 py-3 mb-4">
                                                    <div className="flex-1 h-px bg-[var(--border)]" />
                                                    <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Bonus Tasks</span>
                                                    <div className="flex-1 h-px bg-[var(--border)]" />
                                                </div>
                                            )}

                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="group relative"
                                            >
                                                <div className={`absolute inset-0 rounded-2xl blur-xl transition-opacity duration-300 ${
                                                    isCompleted
                                                        ? 'bg-green-500/20 opacity-50'
                                                        : 'bg-[var(--accent)]/10 opacity-0 group-hover:opacity-100'
                                                }`} />
                                                <div className={`relative glass-card rounded-2xl p-5 transition-all duration-300 ${
                                                    isCompleted
                                                        ? 'border-green-500/50 bg-green-500/5'
                                                        : 'border-[var(--border)] group-hover:border-[var(--accent)]/50'
                                                }`}>
                                                    <div className="flex items-center gap-4">
                                                        {/* Icon */}
                                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 ${
                                                            isCompleted
                                                                ? 'bg-green-500/20 text-green-400'
                                                                : 'bg-gradient-to-br from-[var(--accent)]/20 to-purple-500/20 group-hover:scale-110'
                                                        }`}>
                                                            {isCompleted ? (
                                                                <Check className="w-7 h-7" />
                                                            ) : (
                                                                <span>{task.icon}</span>
                                                            )}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                                <h3 className="font-bold text-white">{task.title}</h3>
                                                                {task.is_required && (
                                                                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md font-semibold">
                                                                        Required
                                                                    </span>
                                                                )}
                                                                {task.is_repeatable && (
                                                                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md font-semibold">
                                                                        Daily
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {task.description && (
                                                                <p className="text-sm text-[var(--text-muted)]">{task.description}</p>
                                                            )}
                                                        </div>

                                                        {/* Points & Button */}
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-right">
                                                                <div className="text-2xl font-bold text-[var(--accent)]">+{task.points}</div>
                                                                <div className="text-xs text-[var(--text-muted)]">points</div>
                                                            </div>

                                                            <button
                                                                onClick={() => handleCompleteTask(task.id, task.url)}
                                                                disabled={isCompleted || isCompleting || !giveaway.timing.is_active || !isEntered}
                                                                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap ${
                                                                    isCompleted
                                                                        ? 'bg-green-500/20 text-green-400 cursor-default'
                                                                        : 'bg-gradient-to-r from-[var(--accent)] to-orange-600 text-white hover:shadow-[0_0_20px_rgba(252,65,0,0.4)] disabled:opacity-40 disabled:cursor-not-allowed'
                                                                }`}
                                                            >
                                                                {isCompleting ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : task.is_repeatable && isCompleted ? (
                                                                    <>
                                                                        <Clock className="w-4 h-4" />
                                                                        Tomorrow
                                                                    </>
                                                                ) : isCompleted ? (
                                                                    <>
                                                                        <Check className="w-4 h-4" />
                                                                        Done
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <ExternalLink className="w-4 h-4" />
                                                                        Start
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Prize Tiers */}
                        {giveaway.prize_tiers && giveaway.prize_tiers.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                                        <Trophy className="w-5 h-5 text-yellow-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold">Prize Tiers</h2>
                                </div>

                                {giveaway.prize_tiers.map((tier, idx) => {
                                    const qualifies = entry && entry.total_points >= tier.min_points;
                                    return (
                                        <motion.div
                                            key={tier.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="relative group"
                                        >
                                            {qualifies && (
                                                <div className="absolute inset-0 rounded-2xl bg-[var(--accent)]/10 blur-xl opacity-60" />
                                            )}
                                            <div className={`relative glass-card rounded-2xl p-5 transition-all duration-300 ${
                                                qualifies
                                                    ? 'border-[var(--accent)]/50 bg-[var(--accent)]/5'
                                                    : 'border-[var(--border)]'
                                            }`}>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-bold text-white text-lg">{tier.tier_name}</h3>
                                                        {tier.prize_description && (
                                                            <p className="text-sm text-[var(--text-secondary)] mt-1">{tier.prize_description}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right flex-shrink-0 ml-4">
                                                        <div className="text-sm text-[var(--text-muted)]">
                                                            {tier.winner_count} {tier.winner_count === 1 ? 'winner' : 'winners'}
                                                        </div>
                                                        <div className={`text-sm font-semibold ${qualifies ? 'text-green-400' : 'text-[var(--text-muted)]'}`}>
                                                            {tier.min_points > 0 ? `Min ${tier.min_points} pts` : 'No minimum'}
                                                        </div>
                                                        {qualifies && (
                                                            <span className="text-xs text-green-400 font-bold">Qualified!</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Description */}
                        {giveaway.description && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card rounded-3xl p-8"
                            >
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-purple-500/20 flex items-center justify-center">
                                        <Gift className="w-5 h-5 text-[var(--accent)]" />
                                    </div>
                                    About This Giveaway
                                </h2>
                                <div
                                    className="prose prose-invert max-w-none text-[var(--text-secondary)]"
                                    dangerouslySetInnerHTML={{ __html: giveaway.description }}
                                />
                            </motion.div>
                        )}

                        {/* Rules */}
                        {giveaway.rules && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card rounded-3xl p-8"
                            >
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-purple-500/20 flex items-center justify-center">
                                        <Trophy className="w-5 h-5 text-[var(--accent)]" />
                                    </div>
                                    Rules & Terms
                                </h2>
                                <p className="text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                                    {giveaway.rules}
                                </p>
                            </motion.div>
                        )}
                    </div>

                    {/* Right Column - Entry Status & Leaderboard */}
                    <div className="space-y-6">
                        {/* Your Entry Card */}
                        {entry && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="glass-card rounded-3xl p-6 sticky top-4 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative">
                                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-[var(--accent)]" />
                                        Your Entry
                                    </h2>

                                    {/* Points Display */}
                                    <div className="text-center mb-4">
                                        <div className="relative inline-block">
                                            <div className="absolute inset-0 bg-[var(--accent)]/20 rounded-full blur-2xl" />
                                            <div className="relative text-6xl font-bold bg-gradient-to-r from-[var(--accent)] to-orange-400 bg-clip-text text-transparent">
                                                {entry.total_points}
                                            </div>
                                        </div>
                                        <div className="text-[var(--text-muted)] mt-2">Total Points</div>
                                    </div>

                                    <div className="h-px bg-[var(--border)] mb-4" />

                                    {/* Win Chance */}
                                    <div className="bg-[var(--bg-primary)]/50 rounded-2xl p-4 mb-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[var(--text-secondary)] font-medium">Win Chance</span>
                                            <span className="text-2xl font-bold text-[var(--accent)]">
                                                {entry.win_chance.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="relative h-3 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(entry.win_chance, 100)}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--accent)] to-orange-500 rounded-full shadow-[0_0_10px_rgba(252,65,0,0.5)]"
                                            />
                                        </div>
                                    </div>

                                    {/* Daily Bonus & Streak */}
                                    {giveaway.timing.is_active && (
                                        <div className="bg-[var(--bg-primary)]/50 rounded-2xl p-4 mb-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Flame className="w-5 h-5 text-orange-400" />
                                                    <span className="text-[var(--text-secondary)] font-medium">Daily Streak</span>
                                                </div>
                                                <span className="text-xl font-bold text-orange-400">
                                                    {entry.streak_days}d
                                                </span>
                                            </div>

                                            {/* Streak milestone progress */}
                                            {nextMilestone && (
                                                <div className="mb-3">
                                                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1.5">
                                                        <span>Next: {nextMilestone}-day streak</span>
                                                        <span className="text-orange-400 font-semibold">+{STREAK_MILESTONES[nextMilestone]} pts</span>
                                                    </div>
                                                    <div className="relative h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${streakProgress}%` }}
                                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Claim button */}
                                            <button
                                                onClick={handleClaimDailyBonus}
                                                disabled={!entry.can_claim_daily_bonus || claimingBonus}
                                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                                                    entry.can_claim_daily_bonus
                                                        ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]'
                                                        : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-default'
                                                }`}
                                            >
                                                {claimingBonus ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : entry.can_claim_daily_bonus ? (
                                                    <>
                                                        <Flame className="w-4 h-4" />
                                                        Claim Daily Bonus
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="w-4 h-4" />
                                                        Claimed Today
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* Referral Section */}
                                    <div className="border-t border-[var(--border)] pt-4">
                                        <h3 className="font-bold mb-2 flex items-center gap-2">
                                            <Share2 className="w-4 h-4 text-[var(--accent)]" />
                                            Invite Friends
                                        </h3>
                                        <p className="text-sm text-[var(--text-muted)] mb-3">
                                            Share your link to earn bonus points!
                                        </p>

                                        <button
                                            onClick={handleCopyReferral}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 glass rounded-xl hover:border-[var(--accent)] transition-all duration-300 group/btn"
                                        >
                                            <Copy className="w-4 h-4 group-hover/btn:text-[var(--accent)] transition-colors" />
                                            <span className="font-medium">
                                                {copied ? "Copied!" : "Copy Referral Link"}
                                            </span>
                                        </button>

                                        {entry.referral_count > 0 && (
                                            <div className="mt-3 text-center">
                                                <span className="text-2xl font-bold text-[var(--accent)]">{entry.referral_count}</span>
                                                <span className="text-[var(--text-muted)] ml-2">
                                                    {entry.referral_count === 1 ? 'friend referred' : 'friends referred'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Social Share */}
                                    <div className="border-t border-[var(--border)] pt-4 mt-4">
                                        <h3 className="font-bold mb-3 flex items-center gap-2">
                                            <Share2 className="w-4 h-4 text-[var(--accent)]" />
                                            Share
                                        </h3>
                                        <div className="flex gap-2">
                                            <a
                                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just entered to win ${giveaway.prize.name} on TechPlay! \u{1F3AE}`)}&url=${encodeURIComponent(entry.referral_url)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 glass rounded-xl hover:border-[var(--accent)] transition-all text-sm font-medium"
                                            >
                                                X / Twitter
                                            </a>
                                            <a
                                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(entry.referral_url)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 glass rounded-xl hover:border-[var(--accent)] transition-all text-sm font-medium"
                                            >
                                                Facebook
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Leaderboard */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Leaderboard slug={slug} />
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
