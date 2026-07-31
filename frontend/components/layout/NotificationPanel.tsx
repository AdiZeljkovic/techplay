"use client";

import { useState, useRef, useEffect } from "react";
import useSWR, { mutate } from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import { Bell, Trophy, Users, MessageSquare, X, CheckCheck, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
}

export default function NotificationPanel({ unreadCount, onCountRefresh }: Props) {
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
        if (!open) return;
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

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell button */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="p-2 text-gray-400 hover:text-[var(--accent)] hover:bg-[var(--fill-2)] rounded-full transition-colors relative"
                title="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-[var(--accent)] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-[var(--surface-0)]">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute right-0 top-10 z-50 w-80 rounded-2xl bg-[var(--surface-2)] border border-[var(--line-strong)] shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
                        <span className="text-[13px] font-bold text-white">Notifications</span>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAll}
                                    disabled={markingAll}
                                    className="flex items-center gap-1 text-[11px] font-semibold text-white/40 hover:text-[var(--accent)] transition-colors"
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
                        {!data ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="w-5 h-5 animate-spin text-white/30" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-10 text-center text-[13px] text-white/30">
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
                                        <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center shrink-0">
                                            {n.icon_path ? (
                                                <img src={n.icon_path} alt="" className="w-5 h-5 object-contain" />
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
                                            <div className="text-[10px] text-white/25 mt-1">
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
                    </div>
                </div>
            )}
        </div>
    );
}
