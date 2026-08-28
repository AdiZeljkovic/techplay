"use client";

import { useState, useRef, useEffect } from "react";
import useSWR, { mutate } from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import { Bell, Trophy, Users, MessageSquare, X, CheckCheck, Loader2 } from "lucide-react";
import { getStorageUrl } from "@/lib/imageUrl";
import { formatDistanceToNow } from "date-fns";
import Sheet from "@/components/ui/Sheet";
import { BellMark } from "./TabMarks";

interface AppNotification {
    id: string;
    type: string;
    title: string | null;
    message: string | null;
    link: string | null;
    icon_path: string | null;
    is_read: boolean;
    created_at: string;
}

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

function typeIcon(type: string) {
    switch (type) {
        case "achievement": return <Trophy className="w-4 h-4 text-yellow-400" />;
        case "friend_request": return <Users className="w-4 h-4 text-blue-400" />;
        case "forum_reply": return <MessageSquare className="w-4 h-4 text-green-400" />;
        default: return <Bell className="w-4 h-4 text-white/50" />;
    }
}

interface Props {
    unreadCount: number;
    onCountRefresh: () => void;
    /** "sheet" is the phone: a 44px bell, and the list on a bottom sheet. */
    variant?: "dropdown" | "sheet";
}

export default function NotificationPanel({ unreadCount, onCountRefresh, variant = "dropdown" }: Props) {
    const asSheet = variant === "sheet";
    const [open, setOpen] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const { data, mutate: mutateList } = useSWR(
        open ? "/notifications" : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    const notifications: AppNotification[] = data?.data ?? [];

    // Close on outside click
    useEffect(() => {
        if (!open || asSheet) return;
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    async function markOne(id: string) {
        await axios.patch(`/notifications/${id}/read`).catch(() => {});
        mutateList();
        onCountRefresh();
    }

    async function markAll() {
        setMarkingAll(true);
        try {
            await axios.post("/notifications/read-all");
            mutateList();
            onCountRefresh();
        } finally {
            setMarkingAll(false);
        }
    }

    // One list, two containers: the dropdown's box and the phone's
    // sheet. An element, not a component — a component defined during
    // render is a new type each render and React discards the subtree,
    // which here would drop the list every time a count ticked.
    const notificationList = (
        <>
        {!data ? (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-white/30" />
            </div>
        ) : notifications.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-white/50">
                No notifications yet
            </div>
        ) : (
            notifications.map((n) => {
                const inner = (
                    <div
                        onClick={() => !n.is_read && markOne(n.id)}
                        className={`flex gap-3 px-4 py-3 transition-colors cursor-pointer ${
                            n.is_read
                                ? "opacity-55 hover:opacity-80"
                                : "bg-white/[0.02] hover:bg-white/[0.05]"
                        }`}
                    >
                        {/* Icon */}
                        <div className="w-8 h-8 rounded-[var(--radius-card)] bg-white/[0.05] border border-white/[0.07] flex items-center justify-center shrink-0">
                            {n.icon_path ? (
                                <img src={getStorageUrl(n.icon_path)} alt="" className="w-5 h-5 object-contain" />
                            ) : (
                                typeIcon(n.type)
                            )}
                        </div>
    
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            {n.title && (
                                <div className="text-[12px] font-bold text-white leading-tight mb-0.5 truncate">
                                    {n.title}
                                </div>
                            )}
                            {n.message && (
                                <div className="text-[11px] text-white/55 leading-snug line-clamp-2">
                                    {n.message}
                                </div>
                            )}
                            <div className="text-[10px] text-white/45 mt-1">
                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                            </div>
                        </div>
    
                        {/* Unread dot */}
                        {!n.is_read && (
                            <div className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0 mt-1.5" />
                        )}
                    </div>
                );
    
                return n.link ? (
                    <Link key={n.id} href={n.link} onClick={() => { setOpen(false); !n.is_read && markOne(n.id); }}>
                        {inner}
                    </Link>
                ) : (
                    <div key={n.id}>{inner}</div>
                );
            })
        )}
        </>
    );

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell button */}
            <button
                onClick={() => setOpen((v) => !v)}
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
                className={
                    asSheet
                        ? "relative h-11 w-11 inline-flex items-center justify-center text-white/70 active:text-white active:bg-[var(--fill-2)] rounded-[var(--radius-card)] transition-colors"
                        : "p-2 text-white/45 hover:text-[var(--accent)] hover:bg-[var(--fill-2)] rounded-full transition-colors relative"
                }
                title="Notifications"
            >
                {/* Only the bell swings. The badge is pinned to the button, so
                    it stays put and the count remains readable while the bell
                    moves under it. */}
                {asSheet
                    ? <BellMark className={`w-[22px] h-[22px] ${unreadCount > 0 ? "tp-bell-ring" : ""}`} active={unreadCount > 0} />
                    : <Bell className={`w-5 h-5 ${unreadCount > 0 ? "tp-bell-ring" : ""}`} />}
                {unreadCount > 0 && (
                    <span className={
                        asSheet
                            ? "absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-[var(--accent)] text-white text-[9.5px] font-bold tabular-nums rounded-full flex items-center justify-center ring-2 ring-[var(--surface-0)]"
                            : "absolute top-0 right-0 w-4 h-4 bg-[var(--accent)] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-[var(--surface-0)]"
                    }>
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel — or, on a phone, a sheet. */}
            {asSheet ? (
                <Sheet
                    open={open}
                    onClose={() => setOpen(false)}
                    title="Notifications"
                    footer={
                        unreadCount > 0 ? (
                            <button
                                onClick={markAll}
                                disabled={markingAll}
                                className="w-full h-12 rounded-[10px] border border-white/[0.1] bg-white/[0.04] font-display text-[11px] font-black uppercase tracking-[0.1em] text-white/70 active:bg-white/[0.08] transition-colors disabled:opacity-50"
                            >
                                {markingAll ? "Marking…" : "Mark all read"}
                            </button>
                        ) : null
                    }
                >
                    <div className="-mx-5 divide-y divide-white/[0.04]">
                        {notificationList}
                    </div>
                </Sheet>
            ) : open && (
                <div className="absolute right-0 top-10 z-50 w-80 rounded-[var(--radius-panel)] bg-[var(--surface-2)] border border-[var(--line-strong)] shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
                        <span className="text-[13px] font-bold text-white">Notifications</span>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAll}
                                    disabled={markingAll}
                                    className="flex items-center gap-1 text-[11px] font-semibold text-white/55 hover:text-[var(--accent)] transition-colors"
                                    title="Mark all as read"
                                >
                                    {markingAll
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        : <CheckCheck className="w-3.5 h-3.5" />}
                                    Mark all read
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-white/[0.04]">
                        {notificationList}
                    </div>
                </div>
            )}
        </div>
    );
}
