"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import { Gift, Clock, Users, Trophy, Check, ExternalLink, Share2, Copy, Loader2, Zap, Award, Star, Flame, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Leaderboard from "@/components/giveaway/Leaderboard";
import PriveeLoginCard from "./components/PriveeLoginCard";

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
    requires_privee_auth: boolean;
}

interface PriveeEntry {
    id: number;
    privee_email: string | null;
    privee_display_name: string | null;
    entered_at: string;
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
const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function GiveawayClient({ slug }: GiveawayClientProps) {
    const { user, isAuthenticated } = useAuth();
    const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
    const [entry, setEntry] = useState<Entry | null>(null);
    const [priveeEntry, setPriveeEntry] = useState<PriveeEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [entering, setEntering] = useState(false);
    const [completingTask, setCompletingTask] = useState<number | null>(null);
    const [claimingBonus, setClaimingBonus] = useState(false);
    const [copied, setCopied] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);

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

    const fetchEntry = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await axios.get(`/giveaways/${slug}/my-entry`);
            setEntry(res.data.data);
        } catch (error) {
            console.error("Failed to fetch entry:", error);
        }
    }, [slug, isAuthenticated]);

    const fetchPriveeEntry = useCallback(async () => {
        try {
            const res = await axios.get(`/giveaways/${slug}/privee/entry`);
            setPriveeEntry(res.data.entry);
        } catch (error) {
            // No session — user hasn't logged in with Privee yet
        }
    }, [slug]);

    useEffect(() => { fetchGiveaway(); }, [fetchGiveaway]);
    useEffect(() => {
        if (!giveaway) return;
        if (giveaway.requires_privee_auth) {
            fetchPriveeEntry();
        } else {
            fetchEntry();
        }
    }, [giveaway, fetchEntry, fetchPriveeEntry]);

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
            setTimeout(() => { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); }, 500);
        }
    }, [giveaway?.winner]);

    useEffect(() => {
        if (timeRemaining <= 0) return;
        const interval = setInterval(() => { setTimeRemaining((prev) => Math.max(0, prev - 1)); }, 1000);
        return () => clearInterval(interval);
    }, [timeRemaining]);

    const formatTime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return { days, hours, mins, secs };
    };

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

    const handleCompleteTask = async (taskId: number, url: string | null) => {
        if (url) window.open(url, "_blank");
        if (!isAuthenticated || !entry) return;
        setCompletingTask(taskId);
        try {
            const res = await axios.post(`/giveaways/${slug}/tasks/${taskId}/complete`);
            setEntry(res.data.data);
            confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 }, colors: ['#FC4100', '#f7931e', '#fdc830'] });
        } catch (error) {
            console.error("Failed to complete task:", error);
        } finally {
            setCompletingTask(null);
        }
    };

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
    const requiredTasks = giveaway.tasks.filter(t => t.is_required);
    const optionalTasks = giveaway.tasks.filter(t => !t.is_required);
    const sortedTasks = [...requiredTasks, ...optionalTasks];
    const completedTotal = giveaway.tasks.filter(t => entry?.completed_task_ids.includes(t.id)).length;
    const completedRequired = requiredTasks.filter(t => entry?.completed_task_ids.includes(t.id)).length;
    const nextMilestone = MILESTONE_DAYS.find(m => m > (entry?.streak_days ?? 0));
    const streakProgress = nextMilestone ? ((entry?.streak_days ?? 0) / nextMilestone) * 100 : 100;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-72 h-72 bg-[var(--accent)]/5 rounded-full blur-[80px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-500/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Hero Section - Horizontal Split */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent)]/8 via-transparent to-transparent" />

                <div className="relative max-w-6xl mx-auto px-4 py-8 md:py-12">
                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                        {/* Prize Image */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="w-full max-w-[240px] md:max-w-none md:w-[280px] lg:w-[320px] flex-shrink-0"
                        >
                            {giveaway.prize.image ? (
                                <div className="relative aspect-square">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/15 to-purple-500/15 rounded-2xl blur-xl" />
                                    <div className="relative w-full h-full glow-card rounded-2xl bg-[var(--bg-card)] border border-white/[0.06] p-4 flex items-center justify-center">
                                        <Image
                                            src={giveaway.prize.image}
                                            alt={giveaway.prize.name}
                                            fill
                                            className="object-contain drop-shadow-2xl p-3"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="aspect-square glow-card rounded-2xl bg-[var(--bg-card)] border border-white/[0.06] flex items-center justify-center">
                                    <Gift className="w-20 h-20 text-[var(--text-muted)]" />
                                </div>
                            )}
                        </motion.div>

                        {/* Hero Content */}
                        <div className="flex-1 text-center md:text-left">
                            {/* Status Badge */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-4"
                            >
                                {giveaway.winner ? (
                                    <>
                                        <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                                        <span className="text-yellow-400 font-semibold text-sm">Winner Announced!</span>
                                    </>
                                ) : giveaway.timing.has_ended ? (
                                    <>
                                        <Clock className="w-3.5 h-3.5 text-red-400" />
                                        <span className="text-red-400 font-semibold text-sm">Giveaway Ended</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-3.5 h-3.5 text-green-400" />
                                        <span className="text-green-400 font-semibold text-sm">Active Giveaway</span>
                                    </>
                                )}
                            </motion.div>

                            {/* Title */}
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white leading-tight"
                            >
                                {giveaway.title}
                            </motion.h1>

                            {/* Prize Name + Value */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="inline-flex items-center gap-2.5 px-4 py-2 glow-card rounded-xl bg-[var(--bg-card)] border border-white/[0.06] mb-5"
                            >
                                <Award className="w-5 h-5 text-[var(--accent)]" />
                                <span className="text-lg font-bold text-white">{giveaway.prize.name}</span>
                                {giveaway.prize.value && (
                                    <>
                                        <span className="text-white/20">|</span>
                                        <span className="text-base font-bold text-[var(--accent)]">&euro;{giveaway.prize.value.toLocaleString()}</span>
                                    </>
                                )}
                            </motion.div>

                            {/* Countdown + Dates */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="mb-5 space-y-3"
                            >
                                {/* Countdown timer (only when active & time remaining) */}
                                {!giveaway.timing.has_ended && timeRemaining > 0 && (
                                    <>
                                        <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold">Time Remaining</div>
                                        <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3">
                                            {[
                                                { label: "Days", value: time.days },
                                                { label: "Hrs", value: time.hours },
                                                { label: "Min", value: time.mins },
                                                { label: "Sec", value: time.secs },
                                            ].map((item) => (
                                                <div key={item.label} className="glow-card rounded-xl bg-[var(--bg-card)] border border-white/[0.06] p-3 md:p-4 min-w-[56px] md:min-w-[68px] text-center">
                                                    <div className="text-2xl md:text-3xl font-bold text-[var(--accent)] leading-none">
                                                        {String(item.value).padStart(2, "0")}
                                                    </div>
                                                    <div className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] mt-1">
                                                        {item.label}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* Start / End dates */}
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-sm">
                                    {giveaway.timing.starts_at && (
                                        <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                                            <CalendarDays className="w-3.5 h-3.5" />
                                            <span>Started: <span className="text-white font-medium">{new Date(giveaway.timing.starts_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>
                                        </div>
                                    )}
                                    {giveaway.timing.ends_at && (
                                        <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{giveaway.timing.has_ended ? 'Ended' : 'Ends'}: <span className={`font-medium ${giveaway.timing.has_ended ? 'text-red-400' : 'text-white'}`}>{new Date(giveaway.timing.ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Participants */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]"
                            >
                                <Users className="w-4 h-4 text-[var(--accent)]" />
                                <span className="font-bold text-white">{giveaway.stats.total_entries}</span>
                                <span>participants</span>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Winner Announcement */}
            <AnimatePresence>
                {giveaway.winner && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="max-w-2xl mx-auto px-4 mb-8"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/15 to-orange-500/15 rounded-2xl blur-xl" />
                            <div className="relative glow-card rounded-2xl bg-[var(--bg-card)] border-2 border-yellow-500/30 p-6 text-center">
                                <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-3 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                                <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                                    We Have a Winner!
                                </h2>
                                <div className="inline-flex items-center gap-3 bg-[var(--bg-elevated)] px-6 py-3 rounded-xl border border-yellow-500/30">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                        {giveaway.winner.username[0].toUpperCase()}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Winner</div>
                                        <div className="text-xl font-bold text-[var(--accent)]">@{giveaway.winner.username}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 pb-16">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Entry CTA — Privee giveaway */}
                        {giveaway.requires_privee_auth && giveaway.timing.is_active && (
                            priveeEntry ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glow-card rounded-2xl bg-[var(--bg-card)] border border-green-500/30 p-6 text-center"
                                >
                                    <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
                                        <Check className="w-7 h-7 text-green-400" />
                                    </div>
                                    <h2 className="text-xl font-bold mb-1 text-green-400">You&apos;re in!</h2>
                                    <p className="text-sm text-white/50">
                                        Entered as <span className="text-white font-semibold">{priveeEntry.privee_display_name || priveeEntry.privee_email}</span>
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glow-card rounded-2xl bg-[var(--bg-card)] border border-white/[0.06] p-6"
                                >
                                    <PriveeLoginCard slug={slug} onSuccess={setPriveeEntry} />
                                </motion.div>
                            )
                        )}

                        {/* Entry CTA — Standard TechPlay giveaway */}
                        {!giveaway.requires_privee_auth && (
                            !isAuthenticated ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glow-card rounded-2xl bg-[var(--bg-card)] border border-white/[0.06] p-6 text-center"
                                >
                                    <Gift className="w-12 h-12 text-[var(--accent)] mx-auto mb-3" />
                                    <h2 className="text-xl font-bold mb-2">Ready to win?</h2>
                                    <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-md mx-auto">
                                        Sign in to participate and complete tasks to boost your chances!
                                    </p>
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--accent)] to-orange-600 text-white font-bold rounded-lg hover:shadow-[0_0_20px_rgba(252,65,0,0.4)] transition-all duration-300"
                                    >
                                        Login / Register
                                    </Link>
                                </motion.div>
                            ) : !isEntered && giveaway.timing.is_active ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glow-card rounded-2xl bg-[var(--bg-card)] border border-white/[0.06] p-6 text-center"
                                >
                                    <Zap className="w-12 h-12 text-[var(--accent)] mx-auto mb-3" />
                                    <h2 className="text-xl font-bold mb-2">Join the giveaway</h2>
                                    <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-md mx-auto">
                                        Click below to enter and start earning points by completing tasks!
                                    </p>
                                    <button
                                        onClick={handleEnter}
                                        disabled={entering}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--accent)] to-orange-600 text-white font-bold rounded-lg hover:shadow-[0_0_20px_rgba(252,65,0,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {entering ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" /> Entering...</>
                                        ) : (
                                            <><Gift className="w-5 h-5" /> Enter giveaway</>
                                        )}
                                    </button>
                                </motion.div>
                            ) : null
                        )}

                        {/* Tasks Section */}
                        {giveaway.tasks.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between mb-4 border-l-4 border-[var(--accent)] pl-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-white uppercase tracking-wide flex items-center gap-2">
                                            <Star className="w-5 h-5 text-[var(--accent)]" />
                                            Earn Points
                                        </h2>
                                        {entry && (
                                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                                {completedTotal}/{giveaway.tasks.length} completed
                                                {requiredTasks.length > 0 && (
                                                    <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                                        {completedRequired}/{requiredTasks.length} req
                                                    </span>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {sortedTasks.map((task, idx) => {
                                    const isCompleted = entry?.completed_task_ids.includes(task.id);
                                    const isCompleting = completingTask === task.id;
                                    const showSeparator = requiredTasks.length > 0 && optionalTasks.length > 0 && idx === requiredTasks.length;

                                    return (
                                        <div key={task.id}>
                                            {showSeparator && (
                                                <div className="flex items-center gap-3 py-2 mb-3">
                                                    <div className="flex-1 h-px bg-white/[0.06]" />
                                                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-semibold">Bonus Tasks</span>
                                                    <div className="flex-1 h-px bg-white/[0.06]" />
                                                </div>
                                            )}

                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                            >
                                                <div className={`glow-card flex items-center gap-3 rounded-xl bg-[var(--bg-card)] border p-3 md:p-4 transition-all duration-300 ${
                                                    isCompleted
                                                        ? 'border-green-500/30 bg-green-500/[0.03]'
                                                        : 'border-white/[0.06] hover:border-white/[0.12]'
                                                }`}>
                                                    {/* Left accent bar */}
                                                    <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                                                        isCompleted ? 'bg-green-500' : 'bg-[var(--accent)]'
                                                    }`} />

                                                    {/* Icon */}
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                                                        isCompleted
                                                            ? 'bg-green-500/15 text-green-400'
                                                            : 'bg-[var(--accent)]/10'
                                                    }`}>
                                                        {isCompleted ? <Check className="w-5 h-5" /> : <span>{task.icon}</span>}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <h3 className="font-semibold text-white text-sm">{task.title}</h3>
                                                            {task.is_required && (
                                                                <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Req</span>
                                                            )}
                                                            {task.is_repeatable && (
                                                                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Daily</span>
                                                            )}
                                                        </div>
                                                        {task.description && (
                                                            <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">{task.description}</p>
                                                        )}
                                                    </div>

                                                    {/* Points + Button */}
                                                    <div className="flex items-center gap-3 flex-shrink-0">
                                                        <span className="text-lg font-bold text-[var(--accent)]">+{task.points}</span>
                                                        <button
                                                            onClick={() => handleCompleteTask(task.id, task.url)}
                                                            disabled={isCompleted || isCompleting || !giveaway.timing.is_active || !isEntered}
                                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                                                                isCompleted
                                                                    ? 'bg-green-500/15 text-green-400 cursor-default'
                                                                    : 'bg-gradient-to-r from-[var(--accent)] to-orange-600 text-white hover:shadow-[0_0_15px_rgba(252,65,0,0.3)] disabled:opacity-40 disabled:cursor-not-allowed'
                                                            }`}
                                                        >
                                                            {isCompleting ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : task.is_repeatable && isCompleted ? (
                                                                <><Clock className="w-3.5 h-3.5" /> Tomorrow</>
                                                            ) : isCompleted ? (
                                                                <><Check className="w-3.5 h-3.5" /> Done</>
                                                            ) : (
                                                                <><ExternalLink className="w-3.5 h-3.5" /> Start</>
                                                            )}
                                                        </button>
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
                            <div className="space-y-3">
                                <div className="flex items-center justify-between mb-4 border-l-4 border-[var(--accent)] pl-4">
                                    <h2 className="text-xl font-bold text-white uppercase tracking-wide flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-yellow-400" />
                                        Prize Tiers
                                    </h2>
                                </div>

                                {giveaway.prize_tiers.map((tier, idx) => {
                                    const qualifies = entry && entry.total_points >= tier.min_points;
                                    return (
                                        <motion.div
                                            key={tier.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                        >
                                            <div className={`glow-card flex items-center gap-3 rounded-xl bg-[var(--bg-card)] border p-3 md:p-4 transition-all duration-300 ${
                                                qualifies
                                                    ? 'border-green-500/30 bg-green-500/[0.03]'
                                                    : 'border-white/[0.06]'
                                            }`}>
                                                <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                                                    qualifies ? 'bg-green-500' : 'bg-yellow-500/30'
                                                }`} />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-white text-sm">{tier.tier_name}</h3>
                                                    {tier.prize_description && (
                                                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{tier.prize_description}</p>
                                                    )}
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <div className="text-xs text-[var(--text-muted)]">
                                                        {tier.winner_count} {tier.winner_count === 1 ? 'winner' : 'winners'}
                                                    </div>
                                                    <div className={`text-xs font-semibold ${qualifies ? 'text-green-400' : 'text-[var(--text-muted)]'}`}>
                                                        {tier.min_points > 0 ? `Min ${tier.min_points} pts` : 'No minimum'}
                                                    </div>
                                                    {qualifies && (
                                                        <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Qualified</span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Description */}
                        {giveaway.description && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="mb-4 border-l-4 border-[var(--accent)] pl-4">
                                    <h2 className="text-xl font-bold text-white uppercase tracking-wide flex items-center gap-2">
                                        <Gift className="w-5 h-5 text-[var(--accent)]" />
                                        About This Giveaway
                                    </h2>
                                </div>
                                <div className="glow-card rounded-2xl bg-[var(--bg-card)] border border-white/[0.06] p-6">
                                    <div
                                        className="prose prose-invert prose-sm max-w-none text-[var(--text-secondary)] prose-headings:text-white prose-a:text-[var(--accent)] prose-strong:text-white prose-p:leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: giveaway.description }}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Rules */}
                        {giveaway.rules && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="mb-4 border-l-4 border-[var(--accent)] pl-4">
                                    <h2 className="text-xl font-bold text-white uppercase tracking-wide flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-[var(--accent)]" />
                                        Rules & Terms
                                    </h2>
                                </div>
                                <div className="glow-card rounded-2xl bg-[var(--bg-card)] border border-white/[0.06] p-6">
                                    <p className="text-[var(--text-secondary)] text-sm whitespace-pre-wrap leading-relaxed">
                                        {giveaway.rules}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Entry Card */}
                        {entry && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="glow-card rounded-2xl bg-[var(--bg-card)] border border-white/[0.06] sticky top-[140px] overflow-hidden"
                            >
                                {/* Header */}
                                <div className="px-5 py-3 bg-[var(--accent)]/10 border-b border-white/[0.06] flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-[var(--accent)]" />
                                    <span className="font-bold text-sm uppercase tracking-wider text-white">Your Entry</span>
                                </div>

                                {/* Points */}
                                <div className="text-center px-5 py-5">
                                    <div className="text-5xl font-bold bg-gradient-to-r from-[var(--accent)] to-orange-400 bg-clip-text text-transparent">
                                        {entry.total_points}
                                    </div>
                                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mt-1">Total Points</div>
                                </div>

                                {/* Win Chance - SVG Ring */}
                                <div className="px-5 py-4 border-t border-white/[0.06]">
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-16 h-16 flex-shrink-0">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
                                                <circle cx="30" cy="30" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                                                <motion.circle
                                                    cx="30" cy="30" r={RING_RADIUS} fill="none"
                                                    stroke="var(--accent)"
                                                    strokeWidth="4"
                                                    strokeLinecap="round"
                                                    strokeDasharray={RING_CIRCUMFERENCE}
                                                    initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
                                                    animate={{ strokeDashoffset: RING_CIRCUMFERENCE * (1 - Math.min(entry.win_chance, 100) / 100) }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-xs font-bold text-[var(--accent)]">{entry.win_chance.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-white">Win Chance</div>
                                            <div className="text-[11px] text-[var(--text-muted)]">Based on points vs pool</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Daily Streak */}
                                {giveaway.timing.is_active && (
                                    <div className="px-5 py-4 border-t border-white/[0.06]">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Flame className="w-4 h-4 text-orange-400" />
                                                <span className="text-sm font-semibold text-white">Daily Streak</span>
                                            </div>
                                            <span className="text-base font-bold text-orange-400">{entry.streak_days}d</span>
                                        </div>

                                        {nextMilestone && (
                                            <div className="mb-3">
                                                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-1.5">
                                                    <span>Next: {nextMilestone}-day streak</span>
                                                    <span className="text-orange-400 font-semibold">+{STREAK_MILESTONES[nextMilestone]} pts</span>
                                                </div>
                                                <div className="relative h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${streakProgress}%` }}
                                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleClaimDailyBonus}
                                            disabled={!entry.can_claim_daily_bonus || claimingBonus}
                                            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                                entry.can_claim_daily_bonus
                                                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                                                    : 'bg-white/[0.04] text-[var(--text-muted)] cursor-default'
                                            }`}
                                        >
                                            {claimingBonus ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : entry.can_claim_daily_bonus ? (
                                                <><Flame className="w-4 h-4" /> Claim Daily Bonus</>
                                            ) : (
                                                <><Check className="w-4 h-4" /> Claimed Today</>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* Referral */}
                                <div className="px-5 py-4 border-t border-white/[0.06]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Share2 className="w-4 h-4 text-[var(--accent)]" />
                                        <span className="text-sm font-semibold text-white">Invite Friends</span>
                                    </div>
                                    <p className="text-[11px] text-[var(--text-muted)] mb-2">Share your link to earn bonus points</p>
                                    <button
                                        onClick={handleCopyReferral}
                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 glass rounded-lg text-sm hover:border-[var(--accent)]/50 transition-all duration-300"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                        <span className="font-medium">{copied ? "Copied!" : "Copy Referral Link"}</span>
                                    </button>
                                    {entry.referral_count > 0 && (
                                        <div className="mt-2 text-center text-xs">
                                            <span className="font-bold text-[var(--accent)]">{entry.referral_count}</span>
                                            <span className="text-[var(--text-muted)] ml-1">
                                                {entry.referral_count === 1 ? 'friend referred' : 'friends referred'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Social Share */}
                                <div className="px-5 py-4 border-t border-white/[0.06]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Share2 className="w-4 h-4 text-[var(--accent)]" />
                                        <span className="text-sm font-semibold text-white">Share</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <a
                                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just entered to win ${giveaway.prize.name} on TechPlay! \u{1F3AE}`)}&url=${encodeURIComponent(entry.referral_url)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 glass rounded-lg text-sm font-medium hover:border-[var(--accent)]/50 transition-all"
                                        >
                                            X / Twitter
                                        </a>
                                        <a
                                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(entry.referral_url)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 glass rounded-lg text-sm font-medium hover:border-[var(--accent)]/50 transition-all"
                                        >
                                            Facebook
                                        </a>
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
