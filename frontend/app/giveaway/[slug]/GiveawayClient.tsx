"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import {
    Gift, Clock, Users, Trophy, Check, Share2, Loader2, Zap,
    CalendarDays, ChevronDown, Copy, Flame, Target, Star, Link2,
    CalendarCheck, MessageCircle, Repeat2, ThumbsUp, Facebook, Instagram,
    Youtube, Twitter, Tag, ArrowRight, Crown, type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";
import Panel from "@/components/ui/Panel";
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

/**
 * The chrome that sits on top of the artwork.
 *
 * The hub's pill is a white film at 5% — right over a dark backdrop, invisible
 * over a bright one. Now that the hero shows the picture instead of drowning
 * it, everything laid over it needs its own darkness to stay readable against
 * neon, sky or headlights.
 */
const HERO_GLASS =
    "inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-black/55 border border-white/[0.12] backdrop-blur-sm";

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
const TASK_KINDS: Record<string, { icon: LucideIcon; what: string; cta: string }> = {
    facebook_like:     { icon: ThumbsUp,      what: "Follow our Facebook page",   cta: "Like now" },
    facebook_share:    { icon: Facebook,      what: "Share us on Facebook",       cta: "Share now" },
    instagram_follow:  { icon: Instagram,     what: "Follow us on Instagram",     cta: "Follow" },
    youtube_subscribe: { icon: Youtube,       what: "Subscribe on YouTube",       cta: "Subscribe" },
    twitter_follow:    { icon: Twitter,       what: "Follow us on X",             cta: "Follow" },
    twitter_retweet:   { icon: Repeat2,       what: "Repost us on X",             cta: "Repost" },
    discord_join:      { icon: MessageCircle, what: "Be part of our community",   cta: "Join" },
    forum_post:        { icon: MessageCircle, what: "Post once in the forum",     cta: "Post" },
    visit_url:         { icon: Link2,         what: "Open the link",              cta: "Open" },
    share_giveaway:    { icon: Share2,        what: "Share this giveaway",        cta: "Share" },
    daily_visit:       { icon: CalendarCheck, what: "Visit daily to keep your streak", cta: "Check in" },
    referral:          { icon: Users,         what: "Get points for each friend", cta: "Invite" },
    custom:            { icon: Star,          what: "Bonus task",                 cta: "Start" },
};

const FALLBACK_KIND = { icon: Star, what: "Bonus task", cta: "Start" };

/**
 * Where an invite actually gets sent.
 *
 * WhatsApp and Viber first because this is a Bosnian audience and that is
 * where a link between two people travels; Telegram and Discord carry the
 * gaming half of it. Discord has no share intent of its own — nobody publishes
 * one — so Copy is what serves it, which is why Copy is not tucked away.
 *
 * Named in text rather than drawn as glyphs on purpose: lucide has no WhatsApp,
 * Viber or Telegram mark, and standing in with a generic speech bubble for
 * three different apps tells the reader less than the word does.
 */
const SHARE_TARGETS: { label: string; href: (url: string, text: string) => string }[] = [
    { label: "WhatsApp", href: (u, t) => `https://wa.me/?text=${encodeURIComponent(`${t} ${u}`)}` },
    { label: "Viber",    href: (u, t) => `viber://forward?text=${encodeURIComponent(`${t} ${u}`)}` },
    { label: "Telegram", href: (u, t) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
    { label: "Facebook", href: (u)    => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
    { label: "X",        href: (u, t) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}` },
];

/**
 * The head every big section on this page wears.
 *
 * An eyebrow naming the section, a sentence saying what it is for, and a
 * right-hand slot for the figures that belong to it. Panel's own `title` is a
 * label — right for a prize-tier list, too quiet for the three panels that are
 * asking the reader to do something.
 */
function SectionHead({
    eyebrow, icon, title, sub, right,
}: {
    eyebrow: string;
    icon: React.ReactNode;
    title: string;
    sub?: string;
    right?: React.ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 mb-5">
            <div className="min-w-0">
                <p className="flex items-center gap-2 font-display text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent-ink)]">
                    {icon} {eyebrow}
                </p>
                <h2 className="mt-2 font-display text-[22px] sm:text-[26px] font-black tracking-tight text-white leading-none text-balance">
                    {title}
                </h2>
                {sub && <p className="mt-1.5 text-[12.5px] text-white/50 leading-relaxed">{sub}</p>}
            </div>
            {right && <div className="shrink-0">{right}</div>}
        </div>
    );
}

/**
 * A fold, drawn on the same matte sheet as Panel.
 *
 * Panel's own header is a title, not a control, so About and Rules build their
 * header here rather than fighting it — but from the same tokens, so it sits in
 * the same family as everything around it.
 */
function Fold({
    title, sub, icon, open, onToggle, children,
}: {
    title: string;
    sub?: string;
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
                <span className="flex items-start gap-3 min-w-0">
                    <span className="mt-0.5 shrink-0">{icon}</span>
                    <span className="min-w-0">
                        <span className="block font-display text-[11px] font-bold uppercase tracking-[0.15em] text-white/70">
                            {title}
                        </span>
                        {sub && <span className="block mt-1 text-[11.5px] text-white/45 truncate">{sub}</span>}
                    </span>
                </span>
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
    const { isAuthenticated } = useAuth();
    const [giveaway, setGiveaway]           = useState<Giveaway | null>(null);
    const [entry, setEntry]                 = useState<Entry | null>(null);
    const [loading, setLoading]             = useState(true);
    const [entering, setEntering]           = useState(false);
    const [completingTask, setCompletingTask] = useState<number | null>(null);
    const [claimingBonus, setClaimingBonus] = useState(false);
    const [copied, setCopied]               = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    /* null = nobody has touched it, so the default below decides. */
    const [descOpen, setDescOpen]           = useState<boolean | null>(null);
    const [rulesOpen, setRulesOpen]         = useState(false);
    /* Read after mount, never during render: navigator.share does not exist on
       the server, and a button that appears only on the client has to appear
       after hydration or React rebuilds the tree around it. */
    const [canNativeShare, setCanNativeShare] = useState(false);

    useEffect(() => {
        setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    }, []);

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


    /*
     * The invite code, caught on the way in.
     *
     * getReferralUrl() has always produced …/giveaway/{slug}?ref=CODE, and the
     * enter endpoint has always accepted a referral_code — but nothing on this
     * page ever read the parameter or sent it, so no referral has ever been
     * registered and no referrer has ever been paid. The link was decoration.
     *
     * Parked in localStorage rather than held in state because it has to
     * survive a round trip through sign-in: whoever follows a friend's link is
     * usually signed out, and after /login they come back without the query
     * string. Keyed per giveaway so two invites do not overwrite each other.
     * Reading and writing it is wrapped — a private window throws here.
     */
    const refKey = `giveaway-ref:${slug}`;

    useEffect(() => {
        const code = new URLSearchParams(window.location.search).get("ref");
        if (!code) return;
        try { localStorage.setItem(refKey, code); } catch { /* storage refused */ }
    }, [refKey]);

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
            let referralCode: string | null = null;
            try { referralCode = localStorage.getItem(refKey); } catch { /* storage refused */ }

            const res = await axios.post(
                `/giveaways/${slug}/enter`,
                referralCode ? { referral_code: referralCode } : {},
            );
            setEntry(res.data.data);

            // Spent. The server refuses a code that is your own, and a second
            // entry cannot be referred anyway, so keeping it only risks
            // attaching it to the wrong giveaway later.
            try { localStorage.removeItem(refKey); } catch { /* storage refused */ }
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
    /* The referral task is a rate, not a chore. enter() pays its points once
       per person who arrives on your link, so it can never be "completed" —
       which is why it stays out of every counter. It does belong in the list,
       because inviting is one of the best ways to score and hiding it hid
       that; its button jumps to the invite panel instead of reporting itself
       done, and the server refuses it either way. */
    const referralTask     = giveaway.tasks.find(t => t.type === "referral") ?? null;
    const scoredTasks      = giveaway.tasks.filter(t => t.type !== "referral");
    const requiredTasks    = scoredTasks.filter(t => t.is_required);
    const completedTotal   = scoredTasks.filter(t => entry?.completed_task_ids.includes(t.id)).length;
    const completedRequired = requiredTasks.filter(t => entry?.completed_task_ids.includes(t.id)).length;
    /* Required first, otherwise the editor's order. */
    const orderedTasks     = [
        ...giveaway.tasks.filter(t => t.is_required),
        ...giveaway.tasks.filter(t => !t.is_required),
    ];
    const pointsOnOffer    = scoredTasks.reduce((sum, t) => sum + t.points, 0);
    const pointsEarned     = scoredTasks
        .filter(t => entry?.completed_task_ids.includes(t.id))
        .reduce((sum, t) => sum + t.points, 0);
    const aboutOpen        = descOpen ?? !isEntered;
    const shareText        = `I'm in to win ${giveaway.prize.name || giveaway.title} on TechPlay — enter with me:`;

    /* The phone's own share sheet, which reaches every app on the device
       rather than the five this page can name. Cancelling it rejects, and a
       cancelled share is not an error worth telling anyone about. */
    const handleNativeShare = () => {
        if (!entry) return;
        navigator
            .share({ title: giveaway.title, text: shareText, url: entry.referral_url })
            .catch(() => { /* dismissed */ });
    };

    const nextMilestone    = MILESTONE_DAYS.find(m => m > (entry?.streak_days ?? 0));
    const streakTarget     = nextMilestone ?? MILESTONE_DAYS[MILESTONE_DAYS.length - 1];
    const heroBgImage      = giveaway.featured_image || giveaway.prize.image;

    /*
     * When the editor has uploaded a designed banner, that banner is the
     * headline — GTA 6's carries its own lettering, its own tagline and its own
     * lighting — and printing our H1 on top of it prints the title twice. So
     * the heading goes to screen readers only in that case, and stays visible
     * whenever the hero falls back to a prize photo or the house art, which are
     * pictures rather than titles.
     *
     * The trade: a featured image with no lettering on it leaves the hero
     * without a visible title. That is the editor's call at upload time, and it
     * is the right way round — a banner is commissioned, a fallback is not.
     */
    const titleIsInArt = !!giveaway.featured_image;

    const scrollToInvite = () => {
        document.getElementById("invite")?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    // ── One task, as the mockup draws it: what, what it pays, and one button ──
    const TaskCard = ({ task }: { task: Task }) => {
        const kind         = TASK_KINDS[task.type] ?? FALLBACK_KIND;
        const KindIcon     = kind.icon;
        const isReferral   = task.type === "referral";
        const isCompleted  = !isReferral && entry?.completed_task_ids.includes(task.id);
        const isCompleting = completingTask === task.id;

        return (
            <div
                className="flex flex-col rounded-[var(--radius-panel)] border p-4 transition-colors duration-200"
                style={{
                    background: isCompleted
                        ? "color-mix(in srgb, var(--success) 6%, var(--surface-1))"
                        : "var(--surface-1)",
                    borderColor: isCompleted
                        ? "color-mix(in srgb, var(--success) 30%, transparent)"
                        : "var(--line)",
                }}
            >
                <div className="flex items-start justify-between gap-3">
                    <span
                        className="w-11 h-11 shrink-0 rounded-[var(--radius-card)] flex items-center justify-center border"
                        style={{
                            background: isCompleted
                                ? "color-mix(in srgb, var(--success) 14%, transparent)"
                                : "var(--accent-soft)",
                            borderColor: isCompleted
                                ? "color-mix(in srgb, var(--success) 30%, transparent)"
                                : "color-mix(in srgb, var(--accent) 28%, transparent)",
                        }}
                    >
                        {isCompleted
                            ? <Check className="w-[19px] h-[19px]" style={{ color: "var(--success)" }} />
                            : <KindIcon className="w-[19px] h-[19px] text-[var(--accent-ink)]" strokeWidth={1.9} />}
                    </span>

                    <span
                        className="shrink-0 font-display text-[10.5px] font-black uppercase tracking-[0.08em] tabular-nums"
                        style={{ color: isCompleted ? "var(--success)" : "var(--accent-ink)" }}
                    >
                        +{task.points} {task.points === 1 ? "Point" : "Points"}
                    </span>
                </div>

                <h3 className="mt-3.5 text-[13.5px] font-bold text-white leading-snug">{task.title}</h3>

                {/* The type's own words when the editor left the field empty —
                    which is the usual case, and a blank line under every title
                    made the cards look unfinished. */}
                <p className="mt-1 flex-1 text-[11.5px] text-white/45 leading-relaxed line-clamp-2">
                    {task.description || kind.what}
                </p>

                {(task.is_required || task.is_repeatable) && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {task.is_required && (
                            <span className="font-display text-[8.5px] font-black uppercase tracking-[0.12em] px-2 h-[18px] inline-flex items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)]">
                                Required
                            </span>
                        )}
                        {task.is_repeatable && (
                            <span className="font-display text-[8.5px] font-black uppercase tracking-[0.12em] px-2 h-[18px] inline-flex items-center rounded-full bg-[var(--fill-2)] text-white/55">
                                Daily
                            </span>
                        )}
                    </div>
                )}

                <div className="mt-4">
                    {isCompleted ? (
                        <span
                            className="w-full h-10 inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-inner)] font-display text-[10.5px] font-black uppercase tracking-[0.1em]"
                            style={{
                                background: "color-mix(in srgb, var(--success) 12%, transparent)",
                                color: "var(--success)",
                            }}
                        >
                            {task.is_repeatable
                                ? <><Clock className="w-3.5 h-3.5" /> Come back tomorrow</>
                                : <><Check className="w-3.5 h-3.5" /> Done</>}
                        </span>
                    ) : (
                        <button
                            onClick={() => (isReferral ? scrollToInvite() : handleCompleteTask(task.id, task.url))}
                            disabled={isCompleting || !giveaway.timing.is_active || (!isReferral && !isEntered)}
                            className="btn-command w-full h-10 inline-flex items-center justify-center gap-1.5 bg-[var(--accent)] text-white font-display text-[10.5px] font-black uppercase tracking-[0.1em] hover:bg-[var(--accent-hover)] transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            {isCompleting
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <>{kind.cta} <ArrowRight className="w-3.5 h-3.5" /></>}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    // ── One figure, drawn as the mockup draws it ──────────────────────────────
    const StatTile = ({
        icon, label, value, unit, hint,
    }: { icon: React.ReactNode; label: string; value: string | number; unit?: string; hint: string }) => (
        <div className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] p-4">
            <div className="flex items-start gap-3">
                <span className="w-11 h-11 shrink-0 rounded-[var(--radius-card)] flex items-center justify-center bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_28%,transparent)]">
                    {icon}
                </span>
                <div className="min-w-0">
                    <p className="font-display text-[9px] font-bold uppercase tracking-[0.18em] text-white/50 truncate">{label}</p>
                    <p className="mt-1 flex items-baseline gap-1">
                        <span className="font-display text-[26px] font-black tabular-nums leading-none text-white">{value}</span>
                        {unit && (
                            <span className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-white/50">{unit}</span>
                        )}
                    </p>
                </div>
            </div>
            <p className="mt-2.5 text-[11.5px] text-white/45">{hint}</p>
        </div>
    );

    return (
        <main className="min-h-screen bg-[var(--surface-0)]">

            {/* ══ hero ══
                The artwork is the headline now. The old treatment laid
                rgba(5,7,10,0.82) across the middle of the picture, which is the
                right thing to do to a backdrop and the wrong thing to do to a
                banner somebody designed — it flattened the art into texture.
                The darkness is a bottom gradient only, sized to carry the
                controls that sit in it. */}
            <section
                className="relative overflow-hidden border-b border-white/[0.07] bg-[var(--surface-0)] flex flex-col justify-end"
                style={{ minHeight: "clamp(340px, 40vw, 600px)" }}
            >
                {heroBgImage ? (
                    <Image src={heroBgImage} alt="" aria-hidden fill priority sizes="100vw" className="object-cover object-center" />
                ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={HOUSE_BACKDROP} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover object-center" />
                )}
                <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                        background:
                            "linear-gradient(to top, var(--surface-0) 0%, rgba(5,7,10,0.86) 18%, rgba(5,7,10,0.45) 48%, rgba(5,7,10,0.05) 78%, transparent 100%)",
                    }}
                />

                {/* Status and share ride at the top so they never push the art
                    down; the picture keeps its full height at every width. */}
                <div className="absolute top-4 inset-x-0 z-20 container-page flex items-center justify-between gap-4">
                    {giveaway.winner ? (
                        <span className={HERO_GLASS}>
                            <Trophy className="w-3.5 h-3.5 text-[var(--accent)]" />
                            <span className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white">Winner drawn</span>
                        </span>
                    ) : giveaway.timing.has_ended ? (
                        <span className={HERO_GLASS}>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/35" />
                            <span className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/60">Closed</span>
                        </span>
                    ) : (
                        <span className={HERO_GLASS}>
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                            <span className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white">Live now</span>
                        </span>
                    )}

                    <button
                        onClick={() => {
                            if (typeof navigator !== "undefined" && navigator.share) {
                                navigator.share({ title: giveaway.title, url: window.location.href }).catch(() => {});
                            } else {
                                navigator.clipboard.writeText(window.location.href);
                                toast.success("Link copied.");
                            }
                        }}
                        className={`${HERO_GLASS} text-white/60 hover:text-white transition-colors duration-200`}
                    >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="font-display text-[9.5px] font-black uppercase tracking-[0.12em]">Share</span>
                    </button>
                </div>

                <div className="relative z-10 container-page pt-24 pb-8 flex flex-col items-center text-center">
                    <h1
                        className={
                            titleIsInArt
                                ? "sr-only"
                                : "font-display font-black uppercase tracking-tight leading-[0.95] text-white text-[30px] sm:text-[40px] md:text-[54px] max-w-4xl text-balance mb-5"
                        }
                    >
                        {giveaway.title}
                    </h1>

                    {(giveaway.prize.value || giveaway.prize.name) && (
                        <span className="inline-flex items-center gap-2.5 h-10 px-5 rounded-full bg-black/55 border border-white/[0.12] backdrop-blur-sm">
                            <Tag className="w-4 h-4 text-[var(--accent)]" />
                            {giveaway.prize.value ? (
                                <span className="font-display text-[15px] font-black tabular-nums text-white">
                                    &euro;{giveaway.prize.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            ) : (
                                <span className="font-display text-[13px] font-bold text-white">{giveaway.prize.name}</span>
                            )}
                        </span>
                    )}

                    {!giveaway.timing.has_ended && timeRemaining > 0 && (
                        <div className="mt-5 flex items-center justify-center gap-2 sm:gap-2.5">
                            {[
                                { label: "Days", value: time.days },
                                { label: "Hrs",  value: time.hours },
                                { label: "Mins", value: time.mins },
                                { label: "Secs", value: time.secs },
                            ].map((cell) => (
                                <span
                                    key={cell.label}
                                    className="flex flex-col items-center justify-center min-w-[66px] sm:min-w-[82px] px-3 py-2.5 rounded-[var(--radius-card)] bg-black/55 border border-white/[0.12] backdrop-blur-sm"
                                >
                                    <span className="font-display text-[24px] sm:text-[30px] font-black tabular-nums text-white leading-none">
                                        {String(cell.value).padStart(2, "0")}
                                    </span>
                                    <span className="mt-1.5 font-display text-[8.5px] font-bold uppercase tracking-[0.14em] text-white/55">
                                        {cell.label}
                                    </span>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Both figures in one rail, split by a hairline — the shape
                        the mockup uses, and it reads as one statement. */}
                    <div className="mt-5 inline-flex flex-wrap items-center justify-center rounded-full bg-black/55 border border-white/[0.12] backdrop-blur-sm overflow-hidden">
                        <span className="inline-flex items-center gap-2 h-10 px-5">
                            <Users className="w-4 h-4 text-[var(--accent)]" />
                            <span className="font-display text-[13px] font-black tabular-nums text-white leading-none">
                                {giveaway.stats.total_entries.toLocaleString()}
                            </span>
                            <span className="font-display text-[9px] font-bold uppercase tracking-[0.12em] text-white/55">Taking part</span>
                        </span>
                        {giveaway.timing.ends_at && (
                            <>
                                <span aria-hidden className="w-px self-stretch bg-white/[0.12]" />
                                <span className="inline-flex items-center gap-2 h-10 px-5">
                                    <CalendarDays className="w-4 h-4 text-[var(--accent)]" />
                                    <span className="font-display text-[13px] font-black tabular-nums text-white leading-none">
                                        {new Date(giveaway.timing.ends_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                    <span className="font-display text-[9px] font-bold uppercase tracking-[0.12em] text-white/55">
                                        {giveaway.timing.has_ended ? "Ended" : "Closes"}
                                    </span>
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </section>

            <div className="container-page py-6 space-y-4">

                {/* ══ winner ══ */}
                {giveaway.winner && (
                    <Panel material="lit" crown>
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

                {/* ══ about and rules ══
                    Above the way in, not below it. Somebody who has just
                    landed needs to know what is being given away and on what
                    terms before being asked to join — and Rules carried the
                    line "Read the rules and terms before entering" while
                    sitting underneath the button that entered them.

                    Open by default only for a reader who has not entered yet.
                    Once they have, the description has done its job and its
                    full height would push their own progress down the page,
                    so it starts folded — until they say otherwise, which is
                    what the null in `descOpen` is holding a place for. ══ */}
                {(giveaway.description || giveaway.rules) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        {giveaway.description && (
                            <Fold
                                title="About this giveaway"
                                sub={`Everything you need to know about ${giveaway.title}.`}
                                icon={<Gift className="w-4 h-4 text-[var(--accent)]" />}
                                open={aboutOpen}
                                onToggle={() => setDescOpen(!aboutOpen)}
                            >
                                <div
                                    className="prose prose-invert prose-sm max-w-none text-white/60 prose-headings:text-white prose-a:text-[var(--accent-ink)] prose-strong:text-white prose-p:leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: giveaway.description }}
                                />
                            </Fold>
                        )}

                        {giveaway.rules && (
                            <Fold
                                title="Rules & terms"
                                sub="Read the rules and terms before entering."
                                icon={<Trophy className="w-4 h-4 text-[var(--accent)]" />}
                                open={rulesOpen}
                                onToggle={() => setRulesOpen(!rulesOpen)}
                            >
                                <p className="text-[12.5px] text-white/60 whitespace-pre-wrap leading-relaxed">
                                    {giveaway.rules}
                                </p>
                            </Fold>
                        )}
                    </div>
                )}

                {/* ══ your progress ══
                    The panel the March rail took with it, rebuilt to the
                    mockup: a sentence instead of a label, four instruments
                    instead of four bare numbers, and the bonus as the one thing
                    you cannot miss. */}
                {entry && (
                    <Panel material="lit" crown>
                        <SectionHead
                            eyebrow="Your progress"
                            icon={<Target className="w-3.5 h-3.5" />}
                            title="Get closer to victory."
                            sub={`Complete tasks, earn points and boost your chances to win ${giveaway.prize.name || giveaway.title}.`}
                            right={
                                <div className="flex flex-col items-end gap-2">
                                    <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)]">
                                        <Crown className="w-3 h-3 text-[var(--accent-ink)]" />
                                        <span className="font-display text-[9px] font-black uppercase tracking-[0.12em] text-[var(--accent-ink)]">
                                            Your entries matter
                                        </span>
                                    </span>
                                    <span className="font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/45">
                                        {streakTarget} days running = +{STREAK_MILESTONES[streakTarget]} pts
                                    </span>
                                </div>
                            }
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                            <StatTile
                                icon={<Star className="w-[19px] h-[19px] text-[var(--accent-ink)]" strokeWidth={1.9} />}
                                label="Points"
                                value={entry.total_points}
                                hint={pointsEarned >= pointsOnOffer && pointsOnOffer > 0 ? "Every task claimed." : "Keep earning!"}
                            />
                            <StatTile
                                icon={<Trophy className="w-[19px] h-[19px] text-[var(--accent-ink)]" strokeWidth={1.9} />}
                                label="Win chance"
                                value={entry.win_chance.toFixed(1)}
                                unit="%"
                                hint="The more points, the higher your chance."
                            />
                            <StatTile
                                icon={<Users className="w-[19px] h-[19px] text-[var(--accent-ink)]" strokeWidth={1.9} />}
                                label="Referrals"
                                value={entry.referral_count}
                                hint={referralTask ? `+${referralTask.points} pts each. Invite friends!` : "Invite friends!"}
                            />
                            <StatTile
                                icon={<Flame className="w-[19px] h-[19px] text-[var(--accent-ink)]" strokeWidth={1.9} />}
                                label="Daily streak"
                                value={entry.streak_days}
                                unit={entry.streak_days === 1 ? "day" : "days"}
                                hint="Check in daily!"
                            />
                        </div>

                        <Meter
                            className="mt-4"
                            value={entry.streak_days}
                            max={streakTarget}
                            showCount
                        />

                        {giveaway.timing.is_active && (
                            entry.can_claim_daily_bonus ? (
                                <button
                                    onClick={handleClaimDailyBonus}
                                    disabled={claimingBonus}
                                    className="btn-command mt-4 w-full h-12 inline-flex items-center justify-center gap-2 bg-[var(--accent)] text-white font-display text-[12px] font-black uppercase tracking-[0.1em] hover:bg-[var(--accent-hover)] transition-colors duration-200 disabled:opacity-40"
                                >
                                    {claimingBonus
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Claiming</>
                                        : <><Gift className="w-4 h-4" /> Claim today&apos;s bonus <ArrowRight className="w-4 h-4" /></>}
                                </button>
                            ) : (
                                <p className="mt-4 h-12 flex items-center justify-center gap-2 rounded-[var(--radius-inner)] bg-[var(--fill-1)] border border-[var(--line)] font-display text-[10.5px] font-black uppercase tracking-[0.1em] text-white/45">
                                    <Check className="w-4 h-4" /> Today&apos;s bonus is claimed — come back tomorrow
                                </p>
                            )
                        )}
                    </Panel>
                )}

                {/* ══ the way in ══ */}
                {!isAuthenticated ? (
                    <Panel material="instrument">
                        <div className="text-center py-2">
                            <span className="w-12 h-12 rounded-[var(--radius-panel)] bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center justify-center mx-auto mb-4">
                                <Gift className="w-5 h-5 text-[var(--accent)]" />
                            </span>
                            <h2 className="font-display text-[20px] font-black tracking-tight text-white">Sign in to enter</h2>
                            <p className="mt-1.5 text-[12.5px] text-white/50 max-w-sm mx-auto leading-relaxed">
                                Entries are tied to your account, so the draw knows who to hand the prize to.
                            </p>
                            <Link
                                href="/login"
                                className="btn-command mt-5 inline-flex items-center gap-2 h-11 px-6 bg-[var(--accent)] text-white font-display text-[11px] font-black uppercase tracking-[0.1em] hover:bg-[var(--accent-hover)] transition-colors duration-200"
                            >
                                <Zap className="w-4 h-4" /> Sign in <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </Panel>
                ) : !isEntered && giveaway.timing.is_active ? (
                    <Panel material="lit" crown>
                        <div className="text-center py-2">
                            <span className="w-12 h-12 rounded-[var(--radius-panel)] bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center justify-center mx-auto mb-4">
                                <Zap className="w-5 h-5 text-[var(--accent)]" />
                            </span>
                            <h2 className="font-display text-[22px] font-black tracking-tight text-white">You are one click away.</h2>
                            <p className="mt-1.5 text-[12.5px] text-white/50 max-w-md mx-auto leading-relaxed">
                                Entering puts you in the draw straight away. Everything after that is optional and only raises your odds.
                            </p>
                            <button
                                onClick={handleEnter}
                                disabled={entering}
                                className="btn-command mt-5 inline-flex items-center gap-2 h-12 px-7 bg-[var(--accent)] text-white font-display text-[12px] font-black uppercase tracking-[0.1em] hover:bg-[var(--accent-hover)] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {entering
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Entering</>
                                    : <><Gift className="w-4 h-4" /> Enter giveaway <ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </div>
                    </Panel>
                ) : null}

                {/* ══ refer a friend ══
                    One band, three parts, the way the design draws it: what it
                    is on the left, the link and its button through the middle,
                    and the arrow into MORE FRIENDS / BIGGER CHANCES on the
                    right. The share targets sit under a hairline below, because
                    the design has no row for them and a Copy button on its own
                    assumes the reader will go and find the app themselves. ══ */}
                {entry && (
                    <div id="invite" className="scroll-mt-24">
                    <Panel material="instrument">
                        <div className="flex flex-col xl:flex-row xl:items-center gap-5 xl:gap-8">

                            <div className="min-w-0 xl:flex-1">
                                <p className="font-display text-[10px] font-black uppercase tracking-[0.22em] text-white/55">
                                    Refer a friend
                                </p>
                                <h2 className="mt-2 font-display text-[22px] sm:text-[26px] font-black tracking-tight text-white leading-none">
                                    Invite. Earn. Win Together.
                                </h2>
                                <p className="mt-1.5 text-[12.5px] text-white/50 leading-relaxed">
                                    Share your unique link with friends.{" "}
                                    {referralTask
                                        /* The design reads "when they join, you both earn
                                           points". Only the referrer is paid — the joiner
                                           gets nothing — and a promise the backend does not
                                           keep is worse than no promise, so this says what
                                           actually happens. */
                                        ? <>Every one who joins is worth <span className="font-bold text-[var(--accent-ink)]">+{referralTask.points} points</span> to you.</>
                                        : <>The more people enter, the bigger the next one gets.</>}
                                </p>

                                {referralTask && entry.referral_count > 0 && (
                                    <p className="mt-1.5 text-[12px] text-white/50">
                                        <span className="font-bold text-white tabular-nums">{entry.referral_count}</span>
                                        {entry.referral_count === 1 ? " friend has" : " friends have"} joined through you — that is{" "}
                                        <span className="font-bold text-[var(--accent-ink)] tabular-nums">
                                            +{entry.referral_count * referralTask.points}
                                        </span>{" "}
                                        points already.
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-2.5 min-w-0 w-full xl:w-[560px] shrink-0">
                                <span className="flex-1 min-w-0 h-12 px-3.5 flex items-center gap-2.5 rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line-strong)]">
                                    <Link2 className="w-4 h-4 shrink-0 text-white/35" />
                                    <span className="min-w-0 truncate text-[12.5px] text-white/65">{entry.referral_url}</span>
                                </span>
                                <button
                                    onClick={handleCopyReferral}
                                    className="btn-command h-12 shrink-0 inline-flex items-center gap-2 px-5 bg-[var(--accent)] text-white font-display text-[11px] font-black uppercase tracking-[0.1em] hover:bg-[var(--accent-hover)] transition-colors duration-200"
                                >
                                    {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy link</>}
                                </button>
                            </div>

                            {/* Decorative, and marked as such: it repeats in a
                                picture what the sentence on the left already
                                says, so a screen reader should not read it out
                                a second time. */}
                            <div aria-hidden className="hidden xl:flex items-center gap-3 shrink-0 text-[var(--accent)]">
                                <svg width="38" height="34" viewBox="0 0 38 34" fill="none">
                                    <path
                                        d="M3 5 C 14 2, 27 9, 31 26"
                                        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
                                    />
                                    <path
                                        d="M23 21 L 31.5 27 L 33 16"
                                        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                                    />
                                </svg>
                                <Users className="w-9 h-9" strokeWidth={1.7} />
                                <span className="font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/45 leading-[1.5]">
                                    More friends<br />Bigger chances
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-[var(--line)] flex flex-wrap items-center gap-2">
                            <span className="font-display text-[9px] font-bold uppercase tracking-[0.18em] text-white/40 mr-1">
                                Send it via
                            </span>
                            {canNativeShare && (
                                <button
                                    onClick={handleNativeShare}
                                    className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] font-display text-[9.5px] font-black uppercase tracking-[0.1em] text-[var(--accent-ink)] hover:brightness-125 transition-[filter] duration-200"
                                >
                                    <Share2 className="w-3.5 h-3.5" /> Share
                                </button>
                            )}
                            {SHARE_TARGETS.map((target) => (
                                <a
                                    key={target.label}
                                    href={target.href(entry.referral_url, shareText)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center h-8 px-3.5 rounded-full bg-[var(--fill-2)] hover:bg-[var(--fill-3)] border border-[var(--line)] font-display text-[9.5px] font-black uppercase tracking-[0.1em] text-white/65 hover:text-white transition-colors duration-200"
                                >
                                    {target.label}
                                </a>
                            ))}
                        </div>
                    </Panel>
                    </div>
                )}

                {/* ══ earn points ══ */}
                {giveaway.tasks.length > 0 && (
                    <Panel material="instrument">
                        <SectionHead
                            eyebrow="Earn points"
                            icon={<Zap className="w-3.5 h-3.5" />}
                            title="Complete tasks. Rack up points."
                            sub="The more you do, the higher your chance to win."
                            right={
                                <div className="flex flex-col items-end gap-1">
                                    <span className="font-display text-[10px] font-black uppercase tracking-[0.12em] text-white/45">
                                        <span className="tabular-nums text-white">{completedTotal}</span>/{scoredTasks.length} completed
                                    </span>
                                    <span className="font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/45">
                                        {pointsOnOffer - pointsEarned > 0
                                            ? <>{pointsOnOffer - pointsEarned} {pointsOnOffer - pointsEarned === 1 ? "point" : "points"} still up for grabs</>
                                            : <>Every point claimed</>}
                                    </span>
                                </div>
                            }
                        />

                        {entry && requiredTasks.length > 0 && completedRequired < requiredTasks.length && (
                            <p className="-mt-2 mb-4 text-[12px] text-white/50">
                                <span className="text-[var(--accent-ink)] font-bold tabular-nums">
                                    {requiredTasks.length - completedRequired}
                                </span>{" "}
                                required {requiredTasks.length - completedRequired === 1 ? "task is" : "tasks are"} still open.
                            </p>
                        )}

                        {/* auto-fill, not auto-fit: two tasks should be two
                            cards of a normal size, not two cards stretched
                            across the whole panel. */}
                        <div
                            className="grid gap-3"
                            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(232px, 1fr))" }}
                        >
                            {orderedTasks.map((task) => <TaskCard key={task.id} task={task} />)}
                        </div>
                    </Panel>
                )}

                {/* ══ prize tiers ══ */}
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

            </div>
        </main>
    );
}
