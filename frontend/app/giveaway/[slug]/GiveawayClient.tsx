"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import {
    Gift, Clock, Users, Trophy, Check, Share2, Loader2, Zap, Award,
    CalendarDays, ChevronDown, Copy, Flame, Target, Star, Link2, UserPlus,
    CalendarCheck, MessageCircle, Repeat2, ThumbsUp, Facebook, Instagram,
    Youtube, Twitter, type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";
import Panel from "@/components/ui/Panel";
import Readout from "@/components/ui/Readout";
import Meter from "@/components/ui/Meter";

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

/**
 * The house backdrop, and the house palette.
 *
 * This page used to carry a gold-and-orange "prize" theme of its own — twenty-one
 * off-token colours and twelve gradients, none of which appear anywhere else on
 * the site. A reader arriving from /giveaways, which is crimson on near-black
 * like everything else, landed somewhere that looked like a different product.
 * Every colour here now comes from a token, and the greens left are --success
 * used for state, which is what that token is for.
 */
const HOUSE_BACKDROP = "/images/page-hero.webp";
const HOUSE_CONFETTI = ["#DC143C", "#FF4D6A", "#FFFFFF"];

/** The pill the hub uses for its four figures. Same shape, same material. */
const STAT_PILL =
    "inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm";

/**
 * What a task actually is.
 *
 * `giveaway_tasks.type` is an enum of twelve — like a Facebook page, subscribe
 * on YouTube, join the Discord, check in daily — and the API has been sending
 * it all along. The page ignored it completely: every task, whatever it was,
 * came out as an editor-chosen emoji above the word START. So a reader looking
 * at the list could not tell a Discord join from an Instagram follow without
 * reading the title, and if the title was unhelpful they could not tell at all.
 *
 * The type is the one part of a task that cannot be typed in wrong, so it is
 * what the row leads with: the right glyph, the platform named, and a button
 * that says the verb — Follow, Subscribe, Join — instead of a generic START.
 *
 * Deliberately no brand colours. Facebook blue and YouTube red next to each
 * other is precisely the pile of foreign palettes this page was just dug out
 * of; the glyph carries the identity and the accent stays the house crimson.
 */
const TASK_KINDS: Record<string, { icon: LucideIcon; what: string; verb: string }> = {
    facebook_like:     { icon: ThumbsUp,      what: "Facebook",  verb: "Like" },
    facebook_share:    { icon: Facebook,      what: "Facebook",  verb: "Share" },
    instagram_follow:  { icon: Instagram,     what: "Instagram", verb: "Follow" },
    youtube_subscribe: { icon: Youtube,       what: "YouTube",   verb: "Subscribe" },
    twitter_follow:    { icon: Twitter,       what: "X",         verb: "Follow" },
    twitter_retweet:   { icon: Repeat2,       what: "X",         verb: "Repost" },
    discord_join:      { icon: MessageCircle, what: "Discord",   verb: "Join" },
    forum_post:        { icon: MessageCircle, what: "Forum",     verb: "Post" },
    visit_url:         { icon: Link2,         what: "Link",      verb: "Open" },
    share_giveaway:    { icon: Share2,        what: "Share",     verb: "Share" },
    daily_visit:       { icon: CalendarCheck, what: "Every day", verb: "Check in" },
    referral:          { icon: UserPlus,      what: "Invite",    verb: "Invite" },
    custom:            { icon: Star,          what: "Bonus",     verb: "Start" },
};

const FALLBACK_KIND = { icon: Star, what: "Task", verb: "Start" };

/**
 * A fold, drawn on the same matte sheet as Panel.
 *
 * Panel's own header is a title, not a control, so About and Rules build their
 * header here rather than fighting it — but from the same tokens, so it sits in
 * the same family as everything around it.
 */
function Fold({
    title, icon, open, onToggle, children,
}: {
    title: string;
    icon: React.ReactNode;
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <section
            className="relative rounded-[var(--radius-panel)] border overflow-hidden"
            style={{ background: "var(--surface-1)", borderColor: "var(--line)" }}
        >
            <button
                onClick={onToggle}
                aria-expanded={open}
                className="w-full flex items-center justify-between gap-4 px-5 py-3.5 text-left hover:bg-white/[0.02] transition-colors duration-200"
            >
                <h2 className="flex items-center gap-2.5 font-display text-[11px] font-bold uppercase tracking-[0.15em] text-white/55">
                    {icon}
                    {title}
                </h2>
                <ChevronDown
                    className={`w-4 h-4 text-white/30 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                    >
                        <div className="px-5 pb-5 pt-4 border-t border-[var(--line)]">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

export default function GiveawayClient({ slug }: GiveawayClientProps) {
    const { user, isAuthenticated } = useAuth();
    const [giveaway, setGiveaway]           = useState<Giveaway | null>(null);
    const [entry, setEntry]                 = useState<Entry | null>(null);
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
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg ?? "That did not go through. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [slug]);

    const fetchEntry = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await axios.get(`/giveaways/${slug}/my-entry`);
            setEntry(res.data.data);
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg ?? "That did not go through. Please try again.");
        }
    }, [slug, isAuthenticated]);


    useEffect(() => { fetchGiveaway(); }, [fetchGiveaway]);
    useEffect(() => {
        if (giveaway) fetchEntry();
    }, [giveaway, fetchEntry]);

    useEffect(() => {
        if (giveaway?.winner) {
            const duration = 3000;
            const end = Date.now() + duration;
            (function frame() {
                confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors: HOUSE_CONFETTI });
                confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: HOUSE_CONFETTI });
                if (Date.now() < end) requestAnimationFrame(frame);
            }());
            setTimeout(() => { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: HOUSE_CONFETTI }); }, 500);
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
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg ?? "That did not go through. Please try again.");
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
            confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 }, colors: HOUSE_CONFETTI });
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg ?? "That did not go through. Please try again.");
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
            confetti({ particleCount: 20, spread: 50, origin: { y: 0.6 }, colors: HOUSE_CONFETTI });
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg ?? "That did not go through. Please try again.");
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
            <main className="min-h-screen bg-[var(--surface-0)]">
                <div className="h-[320px] w-full border-b border-white/[0.07] bg-[var(--surface-1)] animate-pulse" />
                <div className="container-page max-w-3xl py-6 space-y-4">
                    {[132, 220, 96, 96].map((h, i) => (
                        <div
                            key={i}
                            className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] animate-pulse"
                            style={{ height: h }}
                        />
                    ))}
                </div>
            </main>
        );
    }

    // ── Giveaway not found ────────────────────────────────────────────────────
    if (!giveaway) {
        return (
            <main className="min-h-screen bg-[var(--surface-0)] flex items-center justify-center px-4">
                <div className="text-center max-w-sm tp-fade-up">
                    <span className="w-14 h-14 rounded-[var(--radius-panel)] bg-[var(--surface-1)] border border-[var(--line)] flex items-center justify-center mx-auto mb-5">
                        <Gift className="w-6 h-6 text-white/25" />
                    </span>
                    <h1 className="font-display text-[20px] font-black uppercase tracking-tight text-white mb-2">
                        Giveaway not found
                    </h1>
                    <p className="text-[12.5px] text-white/50 leading-relaxed">
                        This giveaway may have ended, or it never existed.
                    </p>
                    <Link
                        href="/giveaways"
                        className="btn-command inline-flex items-center gap-2 mt-5 h-10 px-5 bg-[var(--accent)] text-white font-display text-[11px] font-black uppercase tracking-[0.1em] hover:bg-[var(--accent-hover)] transition-colors duration-200"
                    >
                        All giveaways
                    </Link>
                </div>
            </main>
        );
    }

    const time             = formatTime(timeRemaining);
    const isEntered        = !!entry;
    const requiredTasks    = giveaway.tasks.filter(t => t.is_required);
    const optionalTasks    = giveaway.tasks.filter(t => !t.is_required);
    const completedTotal   = giveaway.tasks.filter(t => entry?.completed_task_ids.includes(t.id)).length;
    const completedRequired = requiredTasks.filter(t => entry?.completed_task_ids.includes(t.id)).length;
    /* Required first, otherwise the editor's order. The old page split them
       into two headed grids; with the Required chip on the row itself, the
       headings said a second time what the row already says. */
    const orderedTasks     = [...requiredTasks, ...optionalTasks];
    const pointsOnOffer    = giveaway.tasks.reduce((sum, t) => sum + t.points, 0);
    const pointsEarned     = giveaway.tasks
        .filter(t => entry?.completed_task_ids.includes(t.id))
        .reduce((sum, t) => sum + t.points, 0);
    const nextMilestone    = MILESTONE_DAYS.find(m => m > (entry?.streak_days ?? 0));
    const heroBgImage      = giveaway.featured_image || giveaway.prize.image;
    /* The thumbnail only earns its place when it is a different picture from
       the backdrop. Most giveaways are set up with one image and no separate
       prize shot — test giveaway #7 is — and floating a sharp copy of the
       backdrop on top of its own blur looks like a mistake, because it is. */
    const prizeImage       = giveaway.prize.image && giveaway.prize.image !== heroBgImage
        ? giveaway.prize.image
        : null;

    // ── One task, as a row you can read at a glance ───────────────────────────
    const TaskRow = ({ task }: { task: Task }) => {
        const kind         = TASK_KINDS[task.type] ?? FALLBACK_KIND;
        const KindIcon     = kind.icon;
        const isCompleted  = entry?.completed_task_ids.includes(task.id);
        const isCompleting = completingTask === task.id;

        return (
            <li
                className="flex items-center gap-3.5 px-4 sm:px-5 py-3.5 transition-colors duration-200"
                style={isCompleted ? { background: "color-mix(in srgb, var(--success) 4%, transparent)" } : undefined}
            >
                <span
                    className="w-10 h-10 shrink-0 rounded-[var(--radius-inner)] flex items-center justify-center"
                    style={{
                        background: isCompleted
                            ? "color-mix(in srgb, var(--success) 14%, transparent)"
                            : "var(--accent-soft)",
                    }}
                >
                    {isCompleted
                        ? <Check className="w-[18px] h-[18px]" style={{ color: "var(--success)" }} />
                        : <KindIcon className="w-[18px] h-[18px] text-[var(--accent-ink)]" strokeWidth={1.9} />}
                </span>

                <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2 min-w-0">
                        <span className="text-[13px] font-bold text-white truncate">{task.title}</span>
                        {task.is_required && (
                            <span className="shrink-0 font-display text-[8.5px] font-black uppercase tracking-[0.12em] px-1.5 h-[17px] inline-flex items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)]">
                                Required
                            </span>
                        )}
                        {task.is_repeatable && (
                            <span className="shrink-0 font-display text-[8.5px] font-black uppercase tracking-[0.12em] px-1.5 h-[17px] inline-flex items-center rounded-full bg-[var(--fill-2)] text-white/55">
                                Daily
                            </span>
                        )}
                    </span>
                    {/* The platform is the part that cannot be typed in wrong,
                        so it leads — the editor's own words follow it. */}
                    <span className="block mt-0.5 text-[11.5px] text-white/45 truncate">
                        {kind.what}{task.description ? ` · ${task.description}` : ""}
                    </span>
                </span>

                <span
                    className="shrink-0 font-display text-[15px] font-black tabular-nums leading-none"
                    style={{ color: isCompleted ? "var(--success)" : "var(--accent-ink)" }}
                >
                    +{task.points}
                </span>

                {isCompleted ? (
                    <span
                        className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-[var(--radius-inner)] font-display text-[10px] font-black uppercase tracking-[0.1em]"
                        style={{
                            background: "color-mix(in srgb, var(--success) 12%, transparent)",
                            color: "var(--success)",
                        }}
                    >
                        {task.is_repeatable
                            ? <><Clock className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Tomorrow</span></>
                            : <><Check className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Done</span></>}
                    </span>
                ) : (
                    <button
                        onClick={() => handleCompleteTask(task.id, task.url)}
                        disabled={isCompleting || !giveaway.timing.is_active || !isEntered}
                        className="btn-command h-9 shrink-0 inline-flex items-center justify-center gap-1.5 min-w-[86px] px-3.5 bg-[var(--accent)] text-white font-display text-[10px] font-black uppercase tracking-[0.1em] hover:bg-[var(--accent-hover)] transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {isCompleting
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : kind.verb}
                    </button>
                )}
            </li>
        );
    };

    return (
        <main className="min-h-screen bg-[var(--surface-0)]">

            {/* ── hero — the treatment every other page on this site opens with ── */}
            <section className="relative overflow-hidden border-b border-white/[0.07] bg-[var(--surface-0)]">
                {heroBgImage ? (
                    <Image src={heroBgImage} alt="" aria-hidden fill priority sizes="100vw" className="object-cover object-center" />
                ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={HOUSE_BACKDROP} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover object-center" />
                )}
                <span aria-hidden className="absolute inset-0 bg-[radial-gradient(58%_120%_at_50%_45%,rgba(5,7,10,0.82),rgba(5,7,10,0.55)_72%)]" />
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--surface-0)] to-transparent" />

                <div className="relative z-10 container-page py-9 md:py-12">

                    {/* status + share */}
                    <div className="flex items-center justify-between gap-4">
                        {giveaway.winner ? (
                            <span className={STAT_PILL}>
                                <Trophy className="w-3.5 h-3.5 text-[var(--accent)]" />
                                <span className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white">Winner drawn</span>
                            </span>
                        ) : giveaway.timing.has_ended ? (
                            <span className={STAT_PILL}>
                                <span className="w-1.5 h-1.5 rounded-full bg-white/35" />
                                <span className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/60">Closed</span>
                            </span>
                        ) : (
                            <span className={STAT_PILL}>
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                                <span className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white">Live now</span>
                            </span>
                        )}

                        <button
                            onClick={() => {
                                if (typeof navigator !== "undefined" && navigator.share) {
                                    navigator.share({ title: giveaway.title, url: window.location.href });
                                } else {
                                    navigator.clipboard.writeText(window.location.href);
                                    toast.success("Link copied.");
                                }
                            }}
                            className={`${STAT_PILL} text-white/55 hover:text-white transition-colors duration-200`}
                        >
                            <Share2 className="w-3.5 h-3.5" />
                            <span className="font-display text-[9.5px] font-black uppercase tracking-[0.12em]">Share</span>
                        </button>
                    </div>

                    <div className="mt-7 flex flex-col items-center text-center tp-fade-up">
                        {prizeImage && (
                            <span className="relative block w-24 h-24 md:w-28 md:h-28 mb-5 rounded-[var(--radius-panel)] border border-white/[0.1] bg-black/45 backdrop-blur-sm overflow-hidden">
                                <Image src={prizeImage} alt={giveaway.prize.name} fill sizes="112px" className="object-contain p-3" />
                            </span>
                        )}

                        <h1 className="font-display font-black uppercase tracking-tight leading-[0.95] text-white text-[30px] sm:text-[38px] md:text-[52px] max-w-3xl text-balance">
                            {giveaway.title}
                        </h1>

                        {(giveaway.prize.name || giveaway.prize.value) && (
                            <span className={`${STAT_PILL} mt-4`}>
                                <Award className="w-3.5 h-3.5 text-[var(--accent)]" />
                                <span className="font-display text-[11.5px] font-bold text-white">{giveaway.prize.name}</span>
                                {giveaway.prize.value && (
                                    <>
                                        <span aria-hidden className="w-px h-3.5 bg-white/15" />
                                        <span className="font-display text-[11.5px] font-black tabular-nums text-[var(--accent-ink)]">
                                            &euro;{giveaway.prize.value.toLocaleString()}
                                        </span>
                                    </>
                                )}
                            </span>
                        )}

                        {/* countdown — the hub's cells, at hero size */}
                        {!giveaway.timing.has_ended && timeRemaining > 0 && (
                            <div className="mt-7 flex items-center justify-center gap-2 sm:gap-2.5">
                                {[
                                    { label: "Days", value: time.days },
                                    { label: "Hrs",  value: time.hours },
                                    { label: "Mins", value: time.mins },
                                    { label: "Secs", value: time.secs },
                                ].map((cell) => (
                                    <span
                                        key={cell.label}
                                        className="flex flex-col items-center justify-center min-w-[64px] sm:min-w-[78px] px-3 py-3 rounded-[var(--radius-card)] bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm"
                                    >
                                        <span className="font-display text-[26px] sm:text-[32px] font-black tabular-nums text-white leading-none">
                                            {String(cell.value).padStart(2, "0")}
                                        </span>
                                        <span className="mt-1.5 font-display text-[8.5px] font-bold uppercase tracking-[0.14em] text-white/50">
                                            {cell.label}
                                        </span>
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                            <span className={STAT_PILL}>
                                <Users className="w-3.5 h-3.5 text-[var(--accent)]" />
                                <span className="font-display text-[12px] font-black tabular-nums text-white leading-none">
                                    {giveaway.stats.total_entries.toLocaleString()}
                                </span>
                                <span className="font-display text-[9px] font-bold uppercase tracking-[0.12em] text-white/50">Taking part</span>
                            </span>
                            {giveaway.timing.ends_at && (
                                <span className={STAT_PILL}>
                                    <CalendarDays className="w-3.5 h-3.5 text-[var(--accent)]" />
                                    <span className="font-display text-[12px] font-black tabular-nums text-white leading-none">
                                        {new Date(giveaway.timing.ends_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                    <span className="font-display text-[9px] font-bold uppercase tracking-[0.12em] text-white/50">
                                        {giveaway.timing.has_ended ? "Ended" : "Closes"}
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <div className="container-page max-w-3xl py-6 space-y-4">

                {/* ── winner ── */}
                {giveaway.winner && (
                    <Panel material="lit" crown title="We have a winner">
                        <div className="flex items-center gap-4">
                            <span className="w-12 h-12 shrink-0 rounded-full overflow-hidden bg-[var(--fill-2)] flex items-center justify-center">
                                {giveaway.winner.avatar ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={giveaway.winner.avatar} alt="" aria-hidden className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-display text-[17px] font-black text-white">
                                        {giveaway.winner.username?.[0]?.toUpperCase() ?? "?"}
                                    </span>
                                )}
                            </span>
                            <span className="min-w-0">
                                <span className="block font-display text-[9px] font-bold uppercase tracking-[0.18em] text-white/50">
                                    Drawn at random
                                </span>
                                <span className="block mt-0.5 font-display text-[19px] font-black text-[var(--accent-ink)] truncate">
                                    @{giveaway.winner.username}
                                </span>
                            </span>
                            <Trophy className="w-6 h-6 ml-auto shrink-0 text-[var(--accent)]" />
                        </div>
                    </Panel>
                )}

                {/* ── your entry — the panel that went missing with the leaderboard ──
                    Removed on 2 March 2026 as collateral in "remove leaderboard,
                    center layout to single column": the rail went, and with it the
                    only place that showed a member their points, their odds, their
                    streak, their referral link and the daily bonus button. The
                    endpoints stayed live the whole time, so for six months the
                    daily bonus was a feature nobody could reach. ── */}
                {entry && (
                    <Panel material="lit" title="Your entry" meta={
                        <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                            {user?.username ? `@${user.username}` : "Entered"}
                        </span>
                    }>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <Readout label="Points" value={entry.total_points} icon={<Zap className="w-3 h-3 text-[var(--accent)]" />} animate />
                            <Readout label="Win chance" value={entry.win_chance.toFixed(1)} unit="%" icon={<Target className="w-3 h-3 text-[var(--accent)]" />} />
                            <Readout label="Referrals" value={entry.referral_count} icon={<Users className="w-3 h-3 text-[var(--accent)]" />} />
                            <Readout label="Streak" value={entry.streak_days} unit="d" icon={<Flame className="w-3 h-3 text-[var(--accent)]" />} />
                        </div>

                        {nextMilestone && (
                            <Meter
                                className="mt-5"
                                value={entry.streak_days}
                                max={nextMilestone}
                                showCount
                                label={`${nextMilestone} days running = +${STREAK_MILESTONES[nextMilestone]} pts`}
                            />
                        )}

                        {entry.can_claim_daily_bonus && giveaway.timing.is_active && (
                            <button
                                onClick={handleClaimDailyBonus}
                                disabled={claimingBonus}
                                className="btn-command mt-5 w-full h-11 inline-flex items-center justify-center gap-2 bg-[var(--accent)] text-white font-display text-[11px] font-black uppercase tracking-[0.1em] hover:bg-[var(--accent-hover)] transition-colors duration-200 disabled:opacity-40"
                            >
                                {claimingBonus
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Claiming</>
                                    : <><Flame className="w-4 h-4" /> Claim today&apos;s bonus</>}
                            </button>
                        )}

                        <div className="mt-5 pt-5 border-t border-[var(--line)]">
                            <p className="font-display text-[9px] font-bold uppercase tracking-[0.18em] text-white/50">
                                Your referral link
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="flex-1 min-w-0 h-10 px-3 flex items-center rounded-[var(--radius-inner)] bg-[var(--surface-1)] border border-[var(--line)] text-[11.5px] text-white/55 truncate">
                                    {entry.referral_url}
                                </span>
                                <button
                                    onClick={handleCopyReferral}
                                    className="btn-command h-10 shrink-0 inline-flex items-center gap-1.5 px-4 bg-[var(--accent)] text-white font-display text-[10.5px] font-black uppercase tracking-[0.1em] hover:bg-[var(--accent-hover)] transition-colors duration-200"
                                >
                                    {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                                </button>
                            </div>
                            <p className="mt-2 text-[11.5px] text-white/45 leading-relaxed">
                                Everyone who enters through your link earns you points.
                            </p>
                        </div>
                    </Panel>
                )}

                {/* ── the way in ── */}
                {!isAuthenticated ? (
                    <Panel material="instrument">
                        <div className="text-center py-2">
                            <span className="w-12 h-12 rounded-[var(--radius-panel)] bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center justify-center mx-auto mb-4">
                                <Gift className="w-5 h-5 text-[var(--accent)]" />
                            </span>
                            <h2 className="font-display text-[17px] font-black uppercase tracking-tight text-white">Sign in to enter</h2>
                            <p className="mt-1.5 text-[12.5px] text-white/50 max-w-sm mx-auto leading-relaxed">
                                Entries are tied to your account, so the draw knows who to hand the prize to.
                            </p>
                            <Link
                                href="/login"
                                className="btn-command mt-5 inline-flex items-center gap-2 h-11 px-6 bg-[var(--accent)] text-white font-display text-[11px] font-black uppercase tracking-[0.1em] hover:bg-[var(--accent-hover)] transition-colors duration-200"
                            >
                                <Zap className="w-4 h-4" /> Sign in
                            </Link>
                        </div>
                    </Panel>
                ) : !isEntered && giveaway.timing.is_active ? (
                    <Panel material="lit">
                        <div className="text-center py-2">
                            <span className="w-12 h-12 rounded-[var(--radius-panel)] bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center justify-center mx-auto mb-4">
                                <Zap className="w-5 h-5 text-[var(--accent)]" />
                            </span>
                            <h2 className="font-display text-[17px] font-black uppercase tracking-tight text-white">Join this giveaway</h2>
                            <p className="mt-1.5 text-[12.5px] text-white/50 max-w-sm mx-auto leading-relaxed">
                                One click puts you in the draw. The tasks after that are optional, and raise your odds.
                            </p>
                            <button
                                onClick={handleEnter}
                                disabled={entering}
                                className="btn-command mt-5 inline-flex items-center gap-2 h-11 px-6 bg-[var(--accent)] text-white font-display text-[11px] font-black uppercase tracking-[0.1em] hover:bg-[var(--accent-hover)] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {entering
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Entering</>
                                    : <><Gift className="w-4 h-4" /> Enter giveaway</>}
                            </button>
                        </div>
                    </Panel>
                ) : null}

                {/* ── tasks ──
                    One column, not two. A giveaway usually has a handful of
                    tasks, and a two-column grid of tall cards left a half-empty
                    row whenever that number was odd — with a single task it was
                    a lone card beside an empty half-panel. A list fills the
                    width at any count and reads the way a to-do list reads. ── */}
                {giveaway.tasks.length > 0 && (
                    <Panel
                        material="instrument"
                        title="Earn points"
                        padding="none"
                        meta={
                            <span className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">
                                {entry
                                    ? <><span className="tabular-nums text-white">{completedTotal}</span> / {giveaway.tasks.length} done</>
                                    : <>Up to <span className="tabular-nums text-[var(--accent-ink)]">{pointsOnOffer}</span> pts</>}
                            </span>
                        }
                    >
                        {/* What is still on the table, said once at the top. */}
                        <div className="px-4 sm:px-5 py-3.5 border-b border-[var(--line)]">
                            {entry ? (
                                <Meter
                                    value={pointsEarned}
                                    max={pointsOnOffer}
                                    segmentLimit={0}
                                    showCount
                                    label={
                                        pointsEarned >= pointsOnOffer
                                            ? "Every point claimed"
                                            : `${pointsOnOffer - pointsEarned} points still up for grabs`
                                    }
                                />
                            ) : (
                                <p className="text-[11.5px] text-white/50 leading-relaxed">
                                    {isAuthenticated
                                        ? "Enter the giveaway above, then work through these to raise your odds."
                                        : "Sign in and enter to start collecting these."}
                                </p>
                            )}
                            {entry && requiredTasks.length > 0 && completedRequired < requiredTasks.length && (
                                <p className="mt-2 text-[11.5px] text-white/50">
                                    <span className="text-[var(--accent-ink)] font-bold">
                                        {requiredTasks.length - completedRequired}
                                    </span>{" "}
                                    required {requiredTasks.length - completedRequired === 1 ? "task is" : "tasks are"} still open.
                                </p>
                            )}
                        </div>

                        <ul className="divide-y divide-[var(--line)]">
                            {orderedTasks.map((task) => <TaskRow key={task.id} task={task} />)}
                        </ul>
                    </Panel>
                )}

                {/* ── prize tiers ── */}
                {giveaway.prize_tiers && giveaway.prize_tiers.length > 0 && (
                    <Panel material="instrument" title="Prize tiers" padding="none">
                        <ul className="divide-y divide-[var(--line)]">
                            {giveaway.prize_tiers.map((tier, idx) => {
                                const qualifies = !!entry && entry.total_points >= tier.min_points;

                                return (
                                    <li key={tier.id} className="flex items-center gap-4 px-5 py-3.5">
                                        <span
                                            className="w-9 h-9 shrink-0 rounded-[var(--radius-inner)] flex items-center justify-center font-display text-[13px] font-black tabular-nums"
                                            style={{
                                                background: qualifies
                                                    ? "color-mix(in srgb, var(--success) 14%, transparent)"
                                                    : "var(--fill-2)",
                                                color: qualifies ? "var(--success)" : "rgba(255,255,255,0.6)",
                                            }}
                                        >
                                            {idx + 1}
                                        </span>

                                        <span className="flex-1 min-w-0">
                                            <span className="block text-[13px] font-bold text-white truncate">{tier.tier_name}</span>
                                            {tier.prize_description && (
                                                <span className="block mt-0.5 text-[11.5px] text-white/50 truncate">{tier.prize_description}</span>
                                            )}
                                        </span>

                                        <span className="shrink-0 text-right">
                                            <span className="block text-[11.5px] text-white/50">
                                                {tier.winner_count} {tier.winner_count === 1 ? "winner" : "winners"}
                                            </span>
                                            <span
                                                className="block mt-0.5 font-display text-[10px] font-black uppercase tracking-[0.1em]"
                                                style={{ color: qualifies ? "var(--success)" : "rgba(255,255,255,0.45)" }}
                                            >
                                                {qualifies
                                                    ? "Qualified"
                                                    : tier.min_points > 0 ? `${tier.min_points} pts min` : "No minimum"}
                                            </span>
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </Panel>
                )}

                {/* ── about ── */}
                {giveaway.description && (
                    <Fold
                        title="About this giveaway"
                        icon={<Gift className="w-3.5 h-3.5 text-[var(--accent)]" />}
                        open={descOpen}
                        onToggle={() => setDescOpen(!descOpen)}
                    >
                        <div
                            className="prose prose-invert prose-sm max-w-none text-white/60 prose-headings:text-white prose-a:text-[var(--accent-ink)] prose-strong:text-white prose-p:leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: giveaway.description }}
                        />
                    </Fold>
                )}

                {/* ── rules ── */}
                {giveaway.rules && (
                    <Fold
                        title="Rules & terms"
                        icon={<Trophy className="w-3.5 h-3.5 text-[var(--accent)]" />}
                        open={rulesOpen}
                        onToggle={() => setRulesOpen(!rulesOpen)}
                    >
                        <p className="text-[12.5px] text-white/60 whitespace-pre-wrap leading-relaxed">
                            {giveaway.rules}
                        </p>
                    </Fold>
                )}

            </div>
        </main>
    );
}
