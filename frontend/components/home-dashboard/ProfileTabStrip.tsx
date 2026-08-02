"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { motion } from "framer-motion";
import { Bell, MessageSquare, UserPlus, MessagesSquare } from "lucide-react";
import axios from "@/lib/axios";
import { PROFILE_TABS, type ProfileTab } from "@/lib/profileTabs";

interface NotificationCounts {
    unread_messages: number;
    pending_requests: number;
    forum_replies: number;
    unread_notifications: number;
}

const countsFetcher = (url: string) => axios.get(url).then((r) => r.data as NotificationCounts);

/** A real notification badge: circular, high-contrast, and it lands. */
function Badge({ value, tone }: { value: number; tone: "onRail" | "onKey" }) {
    if (!value) return null;

    return (
        <span className="relative inline-flex shrink-0">
            <span
                aria-hidden
                className={`tp-pulse-ring absolute inset-0 rounded-full ${tone === "onKey" ? "bg-[var(--accent)]" : "bg-white"}`}
            />
            <span
                className={`tp-badge-in relative inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full font-display text-[10px] font-black tabular-nums leading-none ${
                    tone === "onKey"
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[#12100f] text-white ring-2 ring-white/25"
                }`}
            >
                {value > 99 ? "99+" : value.toLocaleString("en-US")}
            </span>
        </span>
    );
}

/** The nagging bell — shakes for as long as something is unread. */
function AlertBell({ counts }: { counts: NotificationCounts }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const total =
        (counts.unread_messages ?? 0) + (counts.pending_requests ?? 0) + (counts.forum_replies ?? 0);

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [open]);

    const rows = [
        { key: "msg", label: "Unread messages", value: counts.unread_messages, href: "/messages", icon: MessageSquare },
        { key: "req", label: "Friend requests", value: counts.pending_requests, href: "/friends", icon: UserPlus },
        { key: "forum", label: "Forum replies", value: counts.forum_replies, href: "/forum", icon: MessagesSquare },
    ];

    return (
        <div ref={ref} className="relative shrink-0">
            <button
                onClick={() => setOpen((v) => !v)}
                aria-label={total > 0 ? `${total} things need your attention` : "Nothing new"}
                aria-expanded={open}
                className={`relative inline-flex items-center justify-center w-10 h-10 rounded-full border transition-colors duration-300 ${
                    total > 0
                        ? "bg-white/20 border-white/35 text-white hover:bg-white/30"
                        : "bg-black/15 border-white/15 text-white/60 hover:text-white/90"
                }`}
            >
                <Bell className={`w-[18px] h-[18px] ${total > 0 ? "tp-bell-ring" : ""}`} />
                {total > 0 && (
                    <span className="absolute -top-1.5 -right-1.5">
                        <Badge value={total} tone="onRail" />
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 z-50 w-[248px] p-1.5 rounded-[var(--radius-card)] border border-[var(--line-strong)] bg-[var(--surface-1)] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.85)]">
                    {total === 0 ? (
                        <p className="px-2.5 py-3 text-[12px] text-[var(--ink-faint)]">You&apos;re all caught up.</p>
                    ) : (
                        rows
                            .filter((r) => (r.value ?? 0) > 0)
                            .map((r) => (
                                <Link
                                    key={r.key}
                                    href={r.href}
                                    onClick={() => setOpen(false)}
                                    className="w-full flex items-center gap-2.5 px-2.5 h-10 rounded-[var(--radius-inner)] text-[12px] font-semibold text-[var(--ink-low)] hover:text-[var(--ink-hi)] hover:bg-[var(--fill-2)] transition-colors duration-150"
                                >
                                    <r.icon className="w-3.5 h-3.5 text-[var(--accent)]" />
                                    <span className="flex-1 truncate">{r.label}</span>
                                    <span className="font-display text-[11px] font-bold tabular-nums text-[var(--accent)]">
                                        {r.value}
                                    </span>
                                </Link>
                            ))
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * The profile's section rail. It runs the full width in the brand accent —
 * this is the one place on the page where the colour is the surface rather
 * than the highlight, so the active key inverts to a light chip instead of
 * competing with it.
 *
 * PROFILE_TABS is the single source of truth, shared by your own profile and
 * everyone else's.
 */
export default function ProfileTabStrip({
    username,
    activeTab = "overview",
    isOwnProfile = true,
    counts,
}: {
    username: string;
    activeTab?: string;
    isOwnProfile?: boolean;
    counts?: Partial<Record<ProfileTab, number>>;
}) {
    const tabs = PROFILE_TABS.filter((t) => !t.ownOnly || isOwnProfile);
    const base = `/profile/${username}`;

    // Only your own rail nags you — a visitor's notifications aren't your business.
    const { data: alerts } = useSWR(isOwnProfile ? "/user/notifications/counts" : null, countsFetcher, {
        refreshInterval: 60_000,
        revalidateOnFocus: true,
        shouldRetryOnError: false,
    });

    return (
        <nav
            className="relative overflow-hidden border-t border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
            style={{
                background:
                    "linear-gradient(180deg, var(--accent-bright) 0%, var(--accent) 46%, var(--accent-hover) 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -14px 26px -18px rgba(0,0,0,0.9)",
            }}
            aria-label="Profile sections"
        >
            {/* machined texture + a gloss that keeps travelling across the rail */}
            <span aria-hidden className="absolute inset-0 bg-hud-grid opacity-[0.18] mix-blend-overlay" />
            <span
                aria-hidden
                className="tp-rail-sheen absolute inset-y-0 -left-1/3 w-1/4 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"
            />

            <div className="relative flex items-center gap-2 px-3 md:px-4 py-2.5">
                {/* the menu itself is centred; the bell parks on the right */}
                <div className="flex-1 flex items-center justify-start lg:justify-center gap-1 overflow-x-auto scrollbar-none">
                    {tabs.map(({ id, label, icon: Icon }) => {
                        const active = id === activeTab;
                        const count = counts?.[id] ?? 0;

                        const inner = (
                            <>
                                <Icon
                                    className={`relative w-4 h-4 shrink-0 transition-transform duration-300 ease-[var(--ease-hud)] ${
                                        active ? "text-[var(--accent)] scale-110" : "text-white/75 group-hover/tab:text-white group-hover/tab:-translate-y-0.5"
                                    }`}
                                />
                                <span className="relative font-display text-[12px] font-bold uppercase tracking-[0.08em] whitespace-nowrap">
                                    {label}
                                </span>
                                {count > 0 && (
                                    <span className="relative">
                                        <Badge value={count} tone={active ? "onKey" : "onRail"} />
                                    </span>
                                )}
                            </>
                        );

                        if (active) {
                            return (
                                <span
                                    key={id}
                                    aria-current="page"
                                    className="relative shrink-0 flex items-center gap-2 h-10 px-4 text-[var(--accent)]"
                                >
                                    {/* the lit key slides between tabs instead of cutting */}
                                    <motion.span
                                        layoutId="profile-tab-key"
                                        aria-hidden
                                        className="absolute inset-0 rounded-full bg-white"
                                        style={{ boxShadow: "0 6px 18px -4px rgba(0,0,0,0.55), inset 0 -2px 0 rgba(0,0,0,0.08)" }}
                                        transition={{ type: "spring", stiffness: 480, damping: 38 }}
                                    />
                                    {inner}
                                </span>
                            );
                        }

                        return (
                            <Link
                                key={id}
                                href={id === "overview" ? base : `${base}?tab=${id}`}
                                scroll={false}
                                className="group/tab relative shrink-0 flex items-center gap-2 h-10 px-4 rounded-full text-white/85 hover:text-white hover:bg-white/15 transition-colors duration-300"
                            >
                                {inner}
                            </Link>
                        );
                    })}
                </div>

                {isOwnProfile && alerts && <AlertBell counts={alerts} />}
            </div>
        </nav>
    );
}
