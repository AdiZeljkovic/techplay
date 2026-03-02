"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import { Gift, Users, Trophy, Check, ExternalLink, Share2, Loader2, Zap, Award, Star, CalendarDays, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
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
    const [giveaway, setGiveaway]           = useState<Giveaway | null>(null);
    const [entry, setEntry]                 = useState<Entry | null>(null);
    const [priveeEntry, setPriveeEntry]     = useState<PriveeEntry | null>(null);
    const [loading, setLoading]             = useState(true);
    const [entering, setEntering]           = useState(false);
    const [completingTask, setCompletingTask] = useState<number | null>(null);
    const [claimingBonus, setClaimingBonus] = useState(false);
    const [copied, setCopied]               = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [descOpen, setDescOpen]           = useState(true);
    const [rulesOpen, setRulesOpen]         = useState(false);

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
        const days  = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins  = Math.floor((seconds % 3600) / 60);
        const secs  = seconds % 60;
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

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <div className="relative w-full min-h-[60vh] bg-gradient-to-b from-white/[0.04] to-[var(--bg-primary)] animate-pulse" />
                <div className="max-w-6xl mx-auto px-4 py-10">
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            {[160, 72, 72, 72].map((h, i) => (
                                <div key={i} className="rounded-2xl bg-white/[0.04] animate-pulse" style={{ height: h }} />
                            ))}
                        </div>
                        <div className="h-80 rounded-2xl bg-white/[0.04] animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    // ── Giveaway not found ────────────────────────────────────────────────────
    if (!giveaway) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-sm"
                >
                    <div className="w-24 h-24 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-6">
                        <Gift className="w-12 h-12 text-white/20" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Giveaway Not Found</h1>
                    <p className="text-white/40 text-sm leading-relaxed">This giveaway may have ended or doesn&apos;t exist.</p>
                    <Link href="/" className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-bold hover:bg-[var(--accent-hover)] transition-colors">
                        Back to Home
                    </Link>
                </motion.div>
            </div>
        );
    }

    const time             = formatTime(timeRemaining);
    const isEntered        = !!entry;
    const requiredTasks    = giveaway.tasks.filter(t => t.is_required);
    const optionalTasks    = giveaway.tasks.filter(t => !t.is_required);
    const completedTotal   = giveaway.tasks.filter(t => entry?.completed_task_ids.includes(t.id)).length;
    const completedRequired = requiredTasks.filter(t => entry?.completed_task_ids.includes(t.id)).length;
    const nextMilestone    = MILESTONE_DAYS.find(m => m > (entry?.streak_days ?? 0));
    const streakProgress   = nextMilestone ? ((entry?.streak_days ?? 0) / nextMilestone) * 100 : 100;
    const heroBgImage      = giveaway.featured_image || giveaway.prize.image;

    // ── Reusable task card renderer ───────────────────────────────────────────
    const TaskCard = ({ task, idx }: { task: Task; idx: number }) => {
        const isCompleted  = entry?.completed_task_ids.includes(task.id);
        const isCompleting = completingTask === task.id;
        return (
            <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.98 }}
                className={`relative rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-300 ${
                    isCompleted
                        ? 'border-green-500/25 bg-green-500/[0.03] shadow-[0_0_20px_rgba(16,185,129,0.04)]'
                        : task.is_required
                            ? 'border-red-500/15 bg-white/[0.02] hover:border-red-500/25 hover:bg-white/[0.03]'
                            : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.10] hover:bg-white/[0.03]'
                }`}
            >
                {/* Top accent bar */}
                <div className={`absolute top-0 inset-x-0 h-[2px] rounded-t-2xl ${
                    isCompleted
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                        : task.is_required
                            ? 'bg-gradient-to-r from-red-500 to-orange-500'
                            : 'bg-gradient-to-r from-[var(--accent)]/40 to-orange-500/30'
                }`} />

                {/* Icon + badges */}
                <div className="flex items-start justify-between pt-1">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                        isCompleted ? 'bg-green-500/12' : 'bg-[var(--accent)]/8'
                    }`}>
                        {isCompleted ? <Check className="w-7 h-7 text-green-400" /> : <span>{task.icon}</span>}
                    </div>
                    <div className="flex gap-1.5 flex-wrap justify-end">
                        {task.is_required && (
                            <span className="text-[10px] bg-red-500/12 text-red-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                Required
                            </span>
                        )}
                        {task.is_repeatable && (
                            <span className="text-[10px] bg-blue-500/12 text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                Daily
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h3 className="font-bold text-white text-sm leading-snug">{task.title}</h3>
                    {task.description && (
                        <p className="text-xs text-white/35 mt-1 leading-relaxed line-clamp-2">{task.description}</p>
                    )}
                </div>

                {/* Footer: points + button */}
                <div className="flex items-center justify-between">
                    <span className={`text-2xl font-black ${isCompleted ? 'text-green-400' : 'text-[var(--accent)]'}`}>
                        +{task.points}
                    </span>
                    <button
                        onClick={() => handleCompleteTask(task.id, task.url)}
                        disabled={isCompleted || isCompleting || !giveaway.timing.is_active || !isEntered}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                            isCompleted
                                ? 'bg-green-500/10 text-green-400 cursor-default'
                                : 'bg-gradient-to-r from-[var(--accent)] to-orange-500 text-white shadow-lg shadow-[var(--accent)]/15 hover:shadow-[var(--accent)]/25 disabled:opacity-30 disabled:cursor-not-allowed'
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
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">

            {/* ══════════════════════════════════════════════════════════════
                CINEMATIC HERO
            ══════════════════════════════════════════════════════════════ */}
            <section className="relative w-full min-h-[65vh] flex flex-col justify-end overflow-hidden">

                {/* Background image — blurred */}
                {heroBgImage && (
                    <div className="absolute inset-0">
                        <Image
                            src={heroBgImage}
                            alt=""
                            fill
                            priority
                            className="object-cover"
                            style={{ transform: 'scale(1.08)' }}
                        />
                    </div>
                )}

                {/* Fallback orbs when no image */}
                {!heroBgImage && (
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-[var(--accent)]/10 rounded-full blur-[120px]" />
                        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-500/8 rounded-full blur-[100px]" />
                        <div className="absolute top-0 right-1/4 w-64 h-64 bg-blue-500/6 rounded-full blur-[80px]" />
                    </div>
                )}

                {/* Overlay layers */}
                <div className="absolute inset-0 bg-black/65" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-[var(--bg-primary)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_55%,rgba(252,65,0,0.07),transparent)]" />

                {/* Content */}
                <div className="relative z-10 w-full max-w-4xl mx-auto px-4 pt-10 pb-14 text-center">

                    {/* Top row: status badge + share */}
                    <div className="flex items-center justify-between mb-10">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-sm"
                        >
                            {giveaway.winner ? (
                                <><Trophy className="w-3.5 h-3.5 text-yellow-400" /><span className="text-yellow-400 font-semibold">Winner Announced</span></>
                            ) : giveaway.timing.has_ended ? (
                                <><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-red-400 font-semibold">Ended</span></>
                            ) : (
                                <><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /><span className="text-green-400 font-semibold">Live Giveaway</span></>
                            )}
                        </motion.div>

                        <motion.button
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                            onClick={() => {
                                if (typeof navigator !== 'undefined' && navigator.share) {
                                    navigator.share({ title: giveaway.title, url: window.location.href });
                                } else {
                                    navigator.clipboard.writeText(window.location.href);
                                }
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/60 hover:text-white text-sm transition-colors"
                        >
                            <Share2 className="w-3.5 h-3.5" /> Share
                        </motion.button>
                    </div>

                    {/* Floating prize image */}
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="flex justify-center mb-8"
                    >
                        <div className="relative">
                            <div className="absolute -inset-6 rounded-3xl bg-[var(--accent)]/12 blur-2xl" />
                            <div className="absolute -inset-3 rounded-2xl bg-[var(--accent)]/6 blur-xl animate-pulse" />
                            <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md overflow-hidden flex items-center justify-center shadow-2xl">
                                {giveaway.prize.image ? (
                                    <Image
                                        src={giveaway.prize.image}
                                        alt={giveaway.prize.name}
                                        fill
                                        className="object-contain p-4 drop-shadow-2xl"
                                    />
                                ) : (
                                    <Gift className="w-16 h-16 text-[var(--accent)]" />
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none mb-5 drop-shadow-2xl"
                    >
                        {giveaway.title}
                    </motion.h1>

                    {/* Prize badge */}
                    {(giveaway.prize.name || giveaway.prize.value) && (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                            className="flex justify-center mb-8"
                        >
                            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
                                <Award className="w-4 h-4 text-[var(--accent)]" />
                                <span className="text-sm font-bold text-white">{giveaway.prize.name}</span>
                                {giveaway.prize.value && (
                                    <>
                                        <div className="w-px h-4 bg-white/20" />
                                        <span className="text-sm font-black text-[var(--accent)]">&euro;{giveaway.prize.value.toLocaleString()}</span>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Countdown timer */}
                    {!giveaway.timing.has_ended && timeRemaining > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.4 }}
                            className="mb-8"
                        >
                            <div className="text-[9px] uppercase tracking-[0.2em] text-white/35 font-bold mb-3">Time Remaining</div>
                            <div className="flex justify-center gap-2 sm:gap-3">
                                {[
                                    { label: 'Days', value: time.days },
                                    { label: 'Hrs',  value: time.hours },
                                    { label: 'Min',  value: time.mins },
                                    { label: 'Sec',  value: time.secs },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="flex flex-col items-center min-w-[72px] sm:min-w-[88px] md:min-w-[100px] px-3 py-4 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10"
                                    >
                                        <motion.span
                                            key={item.value}
                                            initial={{ scale: 1.1, opacity: 0.7 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ duration: 0.15 }}
                                            className="text-3xl sm:text-4xl md:text-5xl font-black text-white tabular-nums leading-none"
                                        >
                                            {String(item.value).padStart(2, '0')}
                                        </motion.span>
                                        <span className="text-[9px] uppercase tracking-widest text-white/35 mt-2 font-bold">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Stats row */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                        className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/50"
                    >
                        <span className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-[var(--accent)]" />
                            <span className="font-bold text-white">{giveaway.stats.total_entries.toLocaleString()}</span>
                            <span>participants</span>
                        </span>
                        {giveaway.timing.ends_at && (
                            <span className="flex items-center gap-1.5">
                                <CalendarDays className="w-4 h-4" />
                                <span>{giveaway.timing.has_ended ? 'Ended' : 'Ends'}:</span>
                                <span className={`font-semibold ml-1 ${giveaway.timing.has_ended ? 'text-red-400' : 'text-white'}`}>
                                    {new Date(giveaway.timing.ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </span>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════
                WINNER ANNOUNCEMENT
            ══════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {giveaway.winner && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="max-w-2xl mx-auto px-4 pt-8 pb-2"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/15 to-orange-500/15 rounded-2xl blur-xl" />
                            <div className="relative rounded-2xl bg-[var(--bg-card)] border-2 border-yellow-500/30 p-6 text-center shadow-2xl">
                                <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-3 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]" />
                                <h2 className="text-2xl font-black mb-4 bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                                    We Have a Winner!
                                </h2>
                                <div className="inline-flex items-center gap-3 bg-white/[0.05] px-6 py-3 rounded-xl border border-yellow-500/20">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                                        {giveaway.winner.username?.[0]?.toUpperCase() ?? "?"}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[10px] text-white/40 uppercase tracking-widest">Winner</div>
                                        <div className="text-xl font-black text-[var(--accent)]">@{giveaway.winner.username}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════════════
                MAIN CONTENT GRID
            ══════════════════════════════════════════════════════════════ */}
            <div className="max-w-3xl mx-auto px-4 pt-8 pb-20">
                <div className="space-y-6">

                        {/* Entry CTA — Privee giveaway */}
                        {giveaway.requires_privee_auth && giveaway.timing.is_active && (
                            priveeEntry ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative rounded-2xl border border-green-500/25 bg-green-500/[0.04] p-8 text-center overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06),transparent_70%)]" />
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center mx-auto mb-4">
                                            <Check className="w-8 h-8 text-green-400" />
                                        </div>
                                        <h2 className="text-2xl font-black text-green-400 mb-2">You&apos;re in!</h2>
                                        <p className="text-sm text-white/50">
                                            Entered as <span className="text-white font-bold">{priveeEntry.privee_display_name || priveeEntry.privee_email}</span>
                                        </p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-2xl border border-[var(--accent)]/20 bg-white/[0.02] p-6 shadow-[0_0_40px_rgba(252,65,0,0.06)]"
                                >
                                    <PriveeLoginCard slug={slug} onSuccess={setPriveeEntry} />
                                </motion.div>
                            )
                        )}

                        {/* Entry CTA — Standard giveaway */}
                        {!giveaway.requires_privee_auth && (
                            !isAuthenticated ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(252,65,0,0.05),transparent_60%)]" />
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mx-auto mb-5">
                                            <Gift className="w-8 h-8 text-[var(--accent)]" />
                                        </div>
                                        <h2 className="text-2xl font-black text-white mb-2">Ready to win?</h2>
                                        <p className="text-sm text-white/40 mb-6 max-w-sm mx-auto leading-relaxed">
                                            Sign in to enter and complete tasks to boost your winning chances!
                                        </p>
                                        <Link
                                            href="/login"
                                            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[var(--accent)] to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-[var(--accent)]/20 hover:shadow-[var(--accent)]/30 hover:scale-[1.02] transition-all duration-300"
                                        >
                                            <Zap className="w-4 h-4" />
                                            Login to Enter
                                        </Link>
                                    </div>
                                </motion.div>
                            ) : !isEntered && giveaway.timing.is_active ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(252,65,0,0.05),transparent_60%)]" />
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mx-auto mb-5">
                                            <Zap className="w-8 h-8 text-[var(--accent)]" />
                                        </div>
                                        <h2 className="text-2xl font-black text-white mb-2">Join the giveaway</h2>
                                        <p className="text-sm text-white/40 mb-6 max-w-sm mx-auto leading-relaxed">
                                            Click to enter and start earning points by completing tasks!
                                        </p>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleEnter}
                                            disabled={entering}
                                            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[var(--accent)] to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-[var(--accent)]/20 hover:shadow-[var(--accent)]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {entering ? (
                                                <><Loader2 className="w-5 h-5 animate-spin" /> Entering...</>
                                            ) : (
                                                <><Gift className="w-5 h-5" /> Enter Giveaway</>
                                            )}
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ) : null
                        )}

                        {/* Tasks Section */}
                        {giveaway.tasks.length > 0 && (
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1 h-6 rounded-full bg-[var(--accent)]" />
                                        <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                                            <Star className="w-4 h-4 text-[var(--accent)]" />
                                            Earn Points
                                        </h2>
                                    </div>
                                    {entry && (
                                        <div className="flex items-center gap-2 text-xs text-white/40">
                                            <span className="font-bold text-white">{completedTotal}</span>
                                            <span>/ {giveaway.tasks.length} completed</span>
                                            {requiredTasks.length > 0 && (
                                                <span className="bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px]">
                                                    {completedRequired}/{requiredTasks.length} req
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Required tasks grid */}
                                {requiredTasks.length > 0 && (
                                    <div>
                                        {optionalTasks.length > 0 && (
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Required</span>
                                            </div>
                                        )}
                                        <div className="grid md:grid-cols-2 gap-3">
                                            {requiredTasks.map((task, idx) => (
                                                <TaskCard key={task.id} task={task} idx={idx} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Bonus tasks */}
                                {optionalTasks.length > 0 && (
                                    <div>
                                        {requiredTasks.length > 0 && (
                                            <div className="flex items-center gap-3 my-4">
                                                <div className="flex-1 h-px bg-white/[0.05]" />
                                                <span className="text-[10px] text-white/25 uppercase tracking-widest font-bold flex items-center gap-1.5">
                                                    <Zap className="w-3 h-3 text-[var(--accent)]/60" />
                                                    Bonus Tasks
                                                </span>
                                                <div className="flex-1 h-px bg-white/[0.05]" />
                                            </div>
                                        )}
                                        <div className="grid md:grid-cols-2 gap-3">
                                            {optionalTasks.map((task, idx) => (
                                                <TaskCard key={task.id} task={task} idx={requiredTasks.length + idx} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Prize Tiers */}
                        {giveaway.prize_tiers && giveaway.prize_tiers.length > 0 && (
                            <section className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-6 rounded-full bg-yellow-500" />
                                    <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-yellow-400" />
                                        Prize Tiers
                                    </h2>
                                </div>

                                {giveaway.prize_tiers.map((tier, idx) => {
                                    const qualifies = entry && entry.total_points >= tier.min_points;
                                    const rankStyles = [
                                        'from-yellow-400 to-amber-500',
                                        'from-slate-300 to-slate-500',
                                        'from-orange-600 to-amber-700',
                                    ];
                                    return (
                                        <motion.div
                                            key={tier.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={`flex items-center gap-4 rounded-2xl border p-4 transition-all duration-300 ${
                                                qualifies
                                                    ? 'border-green-500/25 bg-green-500/[0.04] shadow-[0_0_20px_rgba(16,185,129,0.04)]'
                                                    : 'border-white/[0.06] bg-white/[0.02]'
                                            }`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white flex-shrink-0 bg-gradient-to-br ${rankStyles[idx] ?? 'from-white/10 to-white/5'}`}>
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-white text-sm">{tier.tier_name}</h3>
                                                {tier.prize_description && (
                                                    <p className="text-xs text-white/40 mt-0.5">{tier.prize_description}</p>
                                                )}
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <div className="text-xs text-white/40">
                                                    {tier.winner_count} {tier.winner_count === 1 ? 'winner' : 'winners'}
                                                </div>
                                                <div className={`text-xs font-bold mt-0.5 ${qualifies ? 'text-green-400' : 'text-white/30'}`}>
                                                    {tier.min_points > 0 ? `${tier.min_points} pts min` : 'No minimum'}
                                                </div>
                                                {qualifies && (
                                                    <span className="text-[10px] text-green-400 font-black uppercase tracking-wider">✓ Qualified</span>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </section>
                        )}

                        {/* About — accordion */}
                        {giveaway.description && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
                            >
                                <button
                                    onClick={() => setDescOpen(!descOpen)}
                                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/[0.02] transition-colors"
                                >
                                    <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                        <Gift className="w-4 h-4 text-[var(--accent)]" />
                                        About This Giveaway
                                    </h2>
                                    <motion.div animate={{ rotate: descOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
                                        <ChevronDown className="w-5 h-5 text-white/30" />
                                    </motion.div>
                                </button>
                                <AnimatePresence initial={false}>
                                    {descOpen && (
                                        <motion.div
                                            key="desc"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <div className="px-6 pb-6 border-t border-white/[0.05]">
                                                <div
                                                    className="prose prose-invert prose-sm max-w-none text-white/50 prose-headings:text-white prose-a:text-[var(--accent)] prose-strong:text-white prose-p:leading-relaxed pt-4"
                                                    dangerouslySetInnerHTML={{ __html: giveaway.description }}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {/* Rules — accordion */}
                        {giveaway.rules && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
                            >
                                <button
                                    onClick={() => setRulesOpen(!rulesOpen)}
                                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/[0.02] transition-colors"
                                >
                                    <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-[var(--accent)]" />
                                        Rules & Terms
                                    </h2>
                                    <motion.div animate={{ rotate: rulesOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
                                        <ChevronDown className="w-5 h-5 text-white/30" />
                                    </motion.div>
                                </button>
                                <AnimatePresence initial={false}>
                                    {rulesOpen && (
                                        <motion.div
                                            key="rules"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <div className="px-6 pb-6 border-t border-white/[0.05]">
                                                <p className="text-white/50 text-sm whitespace-pre-wrap leading-relaxed pt-4">
                                                    {giveaway.rules}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}

                </div>
            </div>
        </div>
    );
}
