"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
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

/**
 * A count badge. Small, solid, seated on the line of the text — it reads as a
 * quantity attached to the label, not a sticker floating over it.
 */
function Badge({ value, muted }: { value: number; muted?: boolean }) {
    if (!value) return null;

    return (
        <span
            className={`tp-badge-in inline-flex items-center justify-center min-w-[19px] h-[18px] px-1.5 rounded-[5px] font-display text-[10px] font-bold tabular-nums leading-none transition-colors duration-300 ${
                muted
                    ? "bg-white/[0.09] text-white/55 group-hover/tab:bg-white/15 group-hover/tab:text-white/80"
                    : "bg-[var(--accent)] text-white"
            }`}
        >
            {value > 99 ? "99+" : value.toLocaleString("en-US")}
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
                className="relative inline-flex items-center justify-center w-9 h-9 text-white/55 hover:text-white transition-colors duration-300"
            >
                <Bell className={`w-[17px] h-[17px] ${total > 0 ? "tp-bell-ring text-white/90" : ""}`} />
                {total > 0 && (
                    <span
                        aria-hidden
                        className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-[var(--accent-bright)]"
                        style={{ boxShadow: "0 0 8px var(--accent-bright)" }}
                    />
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
 * The profile's section rail — an ember band rather than a painted one.
 *
 * The accent is folded into near-black instead of used raw: at this width raw
 * accent stops being a highlight and becomes a surface, and nothing on it can
 * out-shout it. Here the bar is dark enough that the active tab can be the
 * brightest thing on the page again — which is the whole job of the colour.
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
            className="relative"
            style={{
                background:
                    "linear-gradient(180deg, color-mix(in srgb, var(--accent) 15%, #0b0908) 0%, color-mix(in srgb, var(--accent) 7%, #0b0908) 100%)",
            }}
            aria-label="Profile sections"
        >
            {/* the filament: a hot line where the rail meets the hero */}
            <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-px"
                style={{
                    background:
                        "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--accent) 70%, transparent) 22%, color-mix(in srgb, var(--accent) 70%, transparent) 78%, transparent 100%)",
                }}
            />
            {/* embers pooling along the bottom edge */}
            <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-14 pointer-events-none"
                style={{
                    background:
                        "radial-gradient(120% 100% at 50% 130%, color-mix(in srgb, var(--accent) 34%, transparent) 0%, transparent 70%)",
                }}
            />

            <div className="relative flex items-center gap-2 px-3 md:px-5">
                <div className="flex-1 flex items-center justify-start lg:justify-center gap-0.5 overflow-x-auto scrollbar-none">
                    {tabs.map(({ id, label, icon: Icon }) => {
                        const active = id === activeTab;
                        const count = counts?.[id] ?? 0;

                        const inner = (
                            <>
                                <Icon
                                    className={`relative w-4 h-4 shrink-0 transition-colors duration-300 ${
                                        active ? "text-[var(--accent-bright)]" : "text-white/40 group-hover/tab:text-white/75"
                                    }`}
                                />
                                <span className="relative font-display text-[12px] font-bold uppercase tracking-[0.09em] whitespace-nowrap">
                                    {label}
                                </span>
                                {count > 0 && (
                                    <span className="relative">
                                        <Badge value={count} muted={!active} />
                                    </span>
                                )}
                            </>
                        );

                        if (active) {
                            return (
                                <span
                                    key={id}
                                    aria-current="page"
                                    className="relative shrink-0 flex items-center gap-2 h-[52px] px-4 text-white"
                                >
                                    {/* the tab burns from below rather than sitting in a chip */}
                                    <span
                                        aria-hidden
                                        className="absolute inset-x-1 bottom-0 h-9 pointer-events-none"
                                        style={{
                                            background:
                                                "radial-gradient(80% 100% at 50% 120%, color-mix(in srgb, var(--accent) 55%, transparent) 0%, transparent 72%)",
                                        }}
                                    />
                                    {inner}
                                    <span
                                        aria-hidden
                                        className="absolute bottom-0 left-2.5 right-2.5 h-[2px] rounded-t-full bg-[var(--accent-bright)]"
                                        style={{ boxShadow: "0 0 12px color-mix(in srgb, var(--accent) 90%, transparent)" }}
                                    />
                                </span>
                            );
                        }

                        return (
                            <Link
                                key={id}
                                href={id === "overview" ? base : `${base}?tab=${id}`}
                                scroll={false}
                                className="group/tab relative shrink-0 flex items-center gap-2 h-[52px] px-4 text-white/55 hover:text-white transition-colors duration-300"
                            >
                                {inner}
                                {/* the underline grows in from the middle on hover */}
                                <span
                                    aria-hidden
                                    className="absolute bottom-0 left-2.5 right-2.5 h-[2px] rounded-t-full bg-white/35 scale-x-0 group-hover/tab:scale-x-100 transition-transform duration-300 ease-[var(--ease-hud)]"
                                />
                            </Link>
                        );
                    })}
                </div>

                {isOwnProfile && alerts && (
                    <>
                        <span aria-hidden className="hidden md:block w-px h-5 bg-white/10" />
                        <AlertBell counts={alerts} />
                    </>
                )}
            </div>
        </nav>
    );
}
