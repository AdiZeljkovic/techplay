"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import {
    MessageCircle, Users, Mail, UsersRound, Search, X, Send, Loader2, Check, UserPlus, Ban, Plus, ImageIcon, Gamepad2, ArrowLeft, Hash, LogOut, Sparkles, Inbox, Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Panel from "@/components/ui/Panel";
import Avatar from "@/components/ui/Avatar";
import { getEcho } from "@/lib/echo";
import { timeAgo } from "@/lib/timeAgo";
import type {
    ChatMessage, ConversationRow, SocialHubPayload, ThreadMember,
} from "@/lib/types/social";

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data);

type Section = "messages" | "friends" | "requests" | "blocked";

const SECTIONS: { id: Section; label: string; icon: typeof Users }[] = [
    { id: "messages", label: "Messages", icon: Mail },
    { id: "friends", label: "Friends", icon: Users },
    { id: "requests", label: "Requests", icon: UserPlus },
    { id: "blocked", label: "Blocked", icon: Ban },
];

const TABS: { id: "all" | "direct" | "group"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "direct", label: "Direct" },
    { id: "group", label: "Groups" },
];

const clock = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/* ── group composer ───────────────────────────────────────────────────── */

function NewGroupModal({
    friends, onClose, onCreated,
}: {
    friends: SocialHubPayload["friends"];
    onClose: () => void;
    onCreated: (id: number) => void;
}) {
    const [name, setName] = useState("");
    const [picked, setPicked] = useState<number[]>([]);
    const [saving, setSaving] = useState(false);

    const toggle = (id: number) =>
        setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

    const create = async () => {
        if (!name.trim() || picked.length === 0) return;
        setSaving(true);
        try {
            const res = await axios.post("/conversations", {
                type: "group", name: name.trim(), member_ids: picked,
            });
            toast.success("Group created.");
            onCreated(res.data?.data?.id);
        } catch (e: unknown) {
            const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Couldn't create that group.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-md rounded-[14px] border border-white/[0.1] bg-[var(--surface-2)] p-5" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="flex items-center gap-2.5 font-display text-[15px] font-black text-white">
                        <UsersRound className="w-4 h-4 text-[var(--accent)]" /> New group chat
                    </h2>
                    <button onClick={onClose} className="p-1.5 text-white/30 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <input
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 80))}
                    placeholder="Group name"
                    className="w-full h-10 px-3 rounded-[8px] bg-white/[0.04] border border-white/[0.09] text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
                />

                <p className="mt-4 mb-2 font-display text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">
                    Add friends {picked.length > 0 && <span className="text-[var(--accent)]">· {picked.length} selected</span>}
                </p>

                {friends.length === 0 ? (
                    <p className="py-4 text-[12px] text-white/30">Add some friends first — a group is made of them.</p>
                ) : (
                    <div className="max-h-[240px] overflow-y-auto space-y-1 pr-1">
                        {friends.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => toggle(f.id)}
                                className={`w-full flex items-center gap-3 p-2 rounded-[8px] border transition-colors ${
                                    picked.includes(f.id)
                                        ? "border-[color-mix(in_srgb,var(--accent)_50%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
                                        : "border-transparent hover:bg-white/[0.04]"
                                }`}
                            >
                                <Avatar src={f.avatar_url} alt={f.username} size="sm" online={f.online} />
                                <span className="flex-1 min-w-0 text-left text-[12.5px] font-semibold text-white truncate">
                                    {f.display_name || f.username}
                                </span>
                                {picked.includes(f.id) && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                            </button>
                        ))}
                    </div>
                )}

                <div className="mt-4 flex justify-end gap-2">
                    <button onClick={onClose} className="h-9 px-4 rounded-[8px] bg-white/[0.05] text-white/60 font-display text-[10px] font-bold uppercase tracking-[0.1em]">
                        Cancel
                    </button>
                    <button
                        onClick={create}
                        disabled={saving || !name.trim() || picked.length === 0}
                        className="inline-flex items-center gap-2 h-9 px-5 rounded-[8px] bg-[var(--accent)] hover:brightness-110 disabled:opacity-40 text-white font-display text-[10px] font-bold uppercase tracking-[0.1em] transition-[filter]"
                    >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Create group
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── one message ──────────────────────────────────────────────────────── */

function MessageBubble({
    message, emoji, onReact, onDelete,
}: {
    message: ChatMessage;
    emoji: string[];
    onReact: (id: number, emoji: string) => void;
    /** Only ever passed for your own messages — there was no unsend at all. */
    onDelete?: () => void;
}) {
    const [picking, setPicking] = useState(false);
    const mine = message.is_mine;

    return (
        <div className={`group/msg flex gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
            {!mine && <Avatar src={message.sender?.avatar_url ?? null} alt={message.sender?.username ?? "?"} size="sm" />}

            <div className={`min-w-0 max-w-[68%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                {!mine && (
                    <span className="mb-1 flex items-center gap-2">
                        <span className="text-[11.5px] font-bold text-white/70">{message.sender?.username}</span>
                        <span className="font-display text-[9px] font-bold tabular-nums text-white/25">{clock(message.created_at)}</span>
                    </span>
                )}

                <span
                    className={`relative rounded-[12px] px-3.5 py-2.5 text-[13px] leading-snug whitespace-pre-line break-words ${
                        mine ? "bg-[var(--accent)] text-white" : "bg-white/[0.06] text-white/85"
                    }`}
                >
                    {message.attachment_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={message.attachment_url}
                            alt=""
                            className="mb-2 max-h-[240px] rounded-[8px] object-cover"
                        />
                    )}
                    {message.body}
                </span>

                <span className={`mt-1 flex items-center gap-1.5 ${mine ? "flex-row-reverse" : ""}`}>
                    {mine && <span className="font-display text-[9px] font-bold tabular-nums text-white/25">{clock(message.created_at)}</span>}

                    {message.reactions.map((r) => (
                        <button
                            key={r.emoji}
                            onClick={() => onReact(message.id, r.emoji)}
                            className={`inline-flex items-center gap-1 h-[20px] px-1.5 rounded-full border text-[10px] transition-colors ${
                                r.mine
                                    ? "border-[color-mix(in_srgb,var(--accent)_50%,transparent)] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)]"
                                    : "border-white/[0.09] bg-white/[0.03] hover:border-white/[0.2]"
                            }`}
                        >
                            {r.emoji} <span className="font-display font-bold tabular-nums text-white/50">{r.count}</span>
                        </button>
                    ))}

                    {onDelete && (
                        <button
                            onClick={onDelete}
                            title="Delete message"
                            className="w-[20px] h-[20px] rounded-full flex items-center justify-center text-white/25 opacity-0 group-hover/msg:opacity-100 hover:text-red-400 transition-[opacity,color]"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}

                    <span className="relative">
                        <button
                            onClick={() => setPicking((v) => !v)}
                            className="w-[20px] h-[20px] rounded-full flex items-center justify-center text-white/25 opacity-0 group-hover/msg:opacity-100 hover:text-white transition-[opacity,color]"
                            title="React"
                        >
                            <Sparkles className="w-3 h-3" />
                        </button>
                        {picking && (
                            <span className="absolute z-20 bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-0.5 p-1 rounded-[8px] border border-white/[0.12] bg-[var(--surface-2)] shadow-[0_10px_28px_rgba(0,0,0,0.6)]">
                                {emoji.map((e) => (
                                    <button
                                        key={e}
                                        onClick={() => { onReact(message.id, e); setPicking(false); }}
                                        className="w-7 h-7 rounded-[6px] hover:bg-white/[0.08] text-[14px] leading-none transition-colors"
                                    >
                                        {e}
                                    </button>
                                ))}
                            </span>
                        )}
                    </span>
                </span>
            </div>
        </div>
    );
}

/* ── the page ─────────────────────────────────────────────────────────── */

export default function SocialClient() {
    const { user, isLoading: authLoading } = useAuth();
    const [section, setSection] = useState<Section>("messages");
    const [tab, setTab] = useState<"all" | "direct" | "group">("all");
    const [activeId, setActiveId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);
    const [grouping, setGrouping] = useState(false);
    const [busy, setBusy] = useState<number | null>(null);

    const fileInput = useRef<HTMLInputElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    const { data: hub, mutate: mutateHub } = useSWR<SocialHubPayload>(user ? "/social" : null, fetcher);
    const { data: conversations, mutate: mutateList } = useSWR<ConversationRow[]>(
        user ? "/conversations" : null, fetcher, { refreshInterval: 60_000 }
    );
    const { data: thread, mutate: mutateThread } = useSWR<{
        messages: ChatMessage[]; members: ThreadMember[]; emoji: string[]; has_more: boolean;
    }>(activeId ? `/conversations/${activeId}/messages` : null, fetcher);

    /**
     * Messages older than the fifty the thread arrives with.
     *
     * They are held apart from SWR's copy rather than merged into it: a live
     * message arrives by revalidating that copy, and anything spliced in would
     * be thrown away on the next one.
     */
    const [older, setOlder] = useState<ChatMessage[]>([]);
    const [olderDone, setOlderDone] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);

    useEffect(() => { setOlder([]); setOlderDone(false); }, [activeId]);

    const messages = useMemo(
        () => [...older, ...(thread?.messages ?? [])],
        [older, thread?.messages],
    );

    const loadOlder = async () => {
        const oldest = messages[0];
        if (!activeId || !oldest || loadingOlder) return;

        setLoadingOlder(true);

        try {
            const res = await axios.get(`/conversations/${activeId}/messages`, { params: { before_id: oldest.id } });
            const batch: ChatMessage[] = res.data?.data?.messages ?? [];

            setOlder((prev) => [...batch, ...prev]);
            setOlderDone(!res.data?.data?.has_more);
        } catch {
            toast.error("Couldn't load older messages.");
        } finally {
            setLoadingOlder(false);
        }
    };

    const deleteMessage = async (id: number) => {
        if (!activeId) return;

        try {
            await axios.delete(`/conversations/${activeId}/messages/${id}`);
            setOlder((prev) => prev.filter((m) => m.id !== id));
            mutateThread();
            mutateList();
        } catch {
            toast.error("Couldn't delete that message.");
        }
    };

    const rows = useMemo(() => {
        const all = conversations ?? [];
        const q = search.trim().toLowerCase();
        return all
            .filter((c) => (tab === "all" ? true : c.type === tab))
            .filter((c) => (q ? c.name.toLowerCase().includes(q) : true));
    }, [conversations, tab, search]);

    const active = useMemo(() => (conversations ?? []).find((c) => c.id === activeId) ?? null, [conversations, activeId]);

    // Open the first thread once, so the centre column is never blank on load.
    useEffect(() => {
        if (activeId === null && (conversations?.length ?? 0) > 0) {
            setActiveId(conversations![0].id);
        }
    }, [conversations, activeId]);

    useEffect(() => {
        // Only follow the conversation if the reader is already at the end —
        // and scroll the message list, not the document.
        const list = bottomRef.current?.parentElement;
        if (!list) return;
        const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 120;
        if (nearBottom) list.scrollTop = list.scrollHeight;
    }, [thread?.messages?.length, activeId]);

    /* Live delivery: the open thread listens on its own channel, and the
       viewer's personal channel keeps the list and badges honest. */
    useEffect(() => {
        const echo = getEcho();
        if (!echo || !activeId) return;

        const name = `conversation.${activeId}`;
        const channel = echo.private(name);
        channel.listen(".chat.message", () => {
            mutateThread();
            mutateList();
        });

        return () => { echo.leave(name); };
    }, [activeId, mutateThread, mutateList]);

    useEffect(() => {
        const echo = getEcho();
        if (!echo || !user?.id) return;

        const name = `user.${user.id}.chat`;
        const channel = echo.private(name);
        channel.listen(".chat.message", () => {
            mutateList();
            mutateHub();
        });

        return () => { echo.leave(name); };
    }, [user?.id, mutateList, mutateHub]);

    const openDirect = useCallback(async (username: string) => {
        try {
            const res = await axios.post("/conversations", { type: "direct", username });
            const id = res.data?.data?.id;
            await mutateList();
            setSection("messages");
            setActiveId(id);
        } catch {
            toast.error("Couldn't open that conversation.");
        }
    }, [mutateList]);

    const send = async (image?: File) => {
        if (!activeId || (!draft.trim() && !image)) return;
        setSending(true);
        try {
            if (image) {
                const body = new FormData();
                body.append("image", image);
                if (draft.trim()) body.append("body", draft.trim());
                await axios.post(`/conversations/${activeId}/messages`, body, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } else {
                await axios.post(`/conversations/${activeId}/messages`, { body: draft.trim() });
            }
            setDraft("");
            mutateThread();
            mutateList();
        } catch (e: unknown) {
            const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Couldn't send that.");
        } finally {
            setSending(false);
        }
    };

    const react = async (messageId: number, emoji: string) => {
        try {
            await axios.post(`/messages/${messageId}/react`, { emoji });
            mutateThread();
        } catch {
            toast.error("Couldn't react.");
        }
    };

    const respondRequest = async (id: number, accept: boolean) => {
        setBusy(id);
        try {
            await axios.post(`/friends/${accept ? "accept" : "decline"}/${id}`);
            toast.success(accept ? "Friend added." : "Request declined.");
            mutateHub();
        } catch {
            toast.error("Couldn't handle that request.");
        } finally {
            setBusy(null);
        }
    };

    // Blocking has worked server-side for a while — it stops new conversations
    // and mutes existing ones — but nothing in the interface could trigger it,
    // so the "Blocked" tab below could only ever be empty.
    const blockUser = async (id: number, username: string) => {
        if (!confirm(`Block ${username}? They will not be able to message you.`)) return;

        setBusy(id);
        try {
            await axios.post(`/friends/block/${id}`);
            toast.success(`${username} blocked.`);
            mutateHub();
        } catch {
            toast.error("Couldn't block that user.");
        } finally {
            setBusy(null);
        }
    };

    const unblockUser = async (id: number, username: string) => {
        setBusy(id);
        try {
            await axios.delete(`/friends/block/${id}`);
            toast.success(`${username} unblocked.`);
            mutateHub();
        } catch {
            toast.error("Couldn't unblock that user.");
        } finally {
            setBusy(null);
        }
    };

    const addFriend = async (username: string) => {
        try {
            await axios.post("/friends/request", { username });
            toast.success("Request sent.");
            mutateHub();
        } catch (e: unknown) {
            const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Couldn't send that request.");
        }
    };

    // The session restores on the client, so `user` is null for a moment on
    // every load. Rendering the gate during that moment told a signed-in
    // reader they were signed out.
    if (authLoading) {
        return (
            <main className="min-h-screen bg-[var(--surface-0)] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-white/20" />
            </main>
        );
    }

    if (!user) {
        return (
            <main className="min-h-screen bg-[var(--surface-0)] flex items-center justify-center">
                <div className="text-center">
                    <MessageCircle className="w-8 h-8 mx-auto mb-3 text-white/20" />
                    <p className="font-display text-[15px] font-bold text-white">Sign in to open the Social Hub</p>
                    <Link href="/login" className="mt-4 inline-flex items-center h-10 px-6 rounded-[9px] bg-[var(--accent)] text-white font-display text-[10.5px] font-bold uppercase tracking-[0.1em]">
                        Sign in
                    </Link>
                </div>
            </main>
        );
    }

    const stats = hub?.stats;

    const sectionCount = (id: Section) =>
        id === "messages" ? (stats?.unread ?? 0)
            : id === "friends" ? (stats?.friends ?? 0)
                : id === "requests" ? (hub?.requests.length ?? 0)
                    : (hub?.blocked.length ?? 0);

    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            {/* ── header ── */}
            <div className="relative overflow-hidden border-b border-white/[0.07]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/social-hero.webp"
                    alt=""
                    aria-hidden
                    className="absolute inset-0 w-full h-full object-cover object-center opacity-90"
                />
                <span aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_120%_at_50%_45%,rgba(5,7,10,0.72),transparent_70%)]" />
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--surface-0)] to-transparent" />

                <div className="relative z-10 container-page py-10 text-center">
                    <h1 className="font-display font-black tracking-tight text-3xl md:text-5xl leading-none">
                        <span className="text-white">SOCIAL </span>
                        <span className="text-[var(--accent)]">HUB</span>
                    </h1>
                    <p className="mt-3 text-[13px] text-white/45">Chat, squad up, and stay connected across TechPlay.</p>

                    {/* The forum's pill row: mark, number, word — four of them
                        reading as one line rather than four stacked blocks. */}
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                        {([
                            [Users, stats?.friends ?? 0, "Friends"],
                            [MessageCircle, stats?.conversations ?? 0, "Chats"],
                            [Mail, stats?.unread ?? 0, "Unread"],
                            [UsersRound, stats?.groups ?? 0, "Groups"],
                        ] as const).map(([Icon, value, label]) => (
                            <span
                                key={label}
                                className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm"
                            >
                                <Icon className="w-3.5 h-3.5 text-[var(--accent)]" />
                                <span className="font-display text-[12px] font-black tabular-nums text-white leading-none">{value}</span>
                                <span className="font-display text-[9px] font-bold uppercase tracking-[0.12em] text-white/35">{label}</span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container-page py-5 grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                {/* ── the hub itself ── */}
                <div className="xl:col-span-9 min-w-0">
                    <Panel padding="none" className="flex flex-col" bodyClassName="flex flex-col">
                        {/* The four views used to be a separate panel in its own
                            column, which meant the widest thing on the page —
                            the conversation — got the narrowest share of it.
                            They are the chat's own tabs now. */}
                        <div className="flex flex-wrap items-center gap-1.5 p-2 border-b border-white/[0.07]">
                            {SECTIONS.map((s) => {
                                const Icon = s.icon;
                                const active = section === s.id;
                                const count = sectionCount(s.id);

                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => setSection(s.id)}
                                        aria-pressed={active}
                                        className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-[8px] font-display text-[10.5px] font-bold uppercase tracking-[0.06em] transition-colors ${
                                            active ? "bg-[var(--accent)] text-white" : "text-white/45 hover:text-white hover:bg-white/[0.05]"
                                        }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {s.label}
                                        {count > 0 && (
                                            <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full font-display text-[9px] font-black tabular-nums ${
                                                active ? "bg-white/25 text-white" : "bg-white/[0.08] text-white/50"
                                            }`}>
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}

                            <span className="flex-1" />

                            <button
                                onClick={() => setGrouping(true)}
                                className="inline-flex items-center gap-2 h-9 px-3.5 rounded-[8px] bg-white/[0.05] hover:bg-white/[0.1] font-display text-[10px] font-black uppercase tracking-[0.08em] text-white/60 hover:text-white transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" /> New group
                            </button>
                        </div>

                        {section === "messages" ? (
                            <div className="grid grid-cols-1 md:grid-cols-[290px_1fr] min-h-[640px]">
                                {/* list */}
                                <div className={`border-r border-white/[0.07] flex flex-col ${activeId ? "hidden md:flex" : "flex"}`}>
                                    <div className="p-3 border-b border-white/[0.07] space-y-2.5">
                                        <div className="flex items-center gap-1">
                                            {TABS.map((t) => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setTab(t.id)}
                                                    className={`h-7 px-2.5 rounded-[6px] font-display text-[9px] font-black uppercase tracking-[0.08em] transition-colors ${
                                                        tab === t.id ? "bg-[var(--accent)] text-white" : "text-white/35 hover:text-white"
                                                    }`}
                                                >
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
                                            <input
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                placeholder="Search conversations…"
                                                className="w-full h-8 pl-8 pr-3 rounded-[7px] bg-white/[0.04] border border-white/[0.07] text-[12px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto">
                                        {rows.length === 0 ? (
                                            <div className="p-5 text-center">
                                                <Inbox className="w-6 h-6 mx-auto mb-2.5 text-white/15" />
                                                <p className="text-[12px] text-white/35 leading-snug">
                                                    {search ? "Nothing matches that search." : "No conversations yet. Message a friend from Online Now."}
                                                </p>
                                            </div>
                                        ) : rows.map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() => setActiveId(c.id)}
                                                className={`w-full flex items-center gap-3 p-3 border-l-2 text-left transition-colors ${
                                                    activeId === c.id
                                                        ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
                                                        : "border-transparent hover:bg-white/[0.03]"
                                                }`}
                                            >
                                                <span className="relative shrink-0">
                                                    {c.type === "direct" ? (
                                                        <Avatar src={c.image} alt={c.name} size="md" />
                                                    ) : (
                                                        <span className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.09] flex items-center justify-center">
                                                            <UsersRound className="w-4 h-4 text-white/45" />
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="flex items-center gap-2">
                                                        <span className="text-[12.5px] font-bold text-white truncate">{c.name}</span>
                                                        {c.last_message && (
                                                            <span className="ml-auto shrink-0 font-display text-[9px] font-bold text-white/25">
                                                                {timeAgo(c.last_message.created_at)}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="flex items-center gap-2 mt-0.5">
                                                        <span className="min-w-0 flex-1 text-[11.5px] text-white/40 truncate">
                                                            {c.last_message
                                                                ? `${c.last_message.is_mine ? "You: " : c.type !== "direct" && c.last_message.sender ? `${c.last_message.sender}: ` : ""}${c.last_message.body}`
                                                                : "No messages yet"}
                                                        </span>
                                                        {c.unread > 0 && (
                                                            <span className="shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-[var(--accent)] font-display text-[9px] font-black text-white tabular-nums">
                                                                {c.unread}
                                                            </span>
                                                        )}
                                                    </span>
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* thread */}
                                <div className={`flex flex-col min-w-0 ${activeId ? "flex" : "hidden md:flex"}`}>
                                    {!active ? (
                                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                            <MessageCircle className="w-8 h-8 mb-3 text-white/15" />
                                            <p className="font-display text-[14px] font-bold text-white">Pick a conversation</p>
                                            <p className="mt-1.5 text-[12px] text-white/35 max-w-[280px]">
                                                Or message a friend from Online Now — direct threads open on first message.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3 p-3.5 border-b border-white/[0.07]">
                                                <button onClick={() => setActiveId(null)} className="md:hidden p-1 text-white/40">
                                                    <ArrowLeft className="w-4 h-4" />
                                                </button>

                                                {active.type === "direct" ? (
                                                    <Avatar src={active.image} alt={active.name} size="md" />
                                                ) : (
                                                    <span className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.09] flex items-center justify-center shrink-0">
                                                        <UsersRound className="w-4 h-4 text-white/45" />
                                                    </span>
                                                )}

                                                <span className="min-w-0 flex-1">
                                                    {active.type === "direct" && active.partner ? (
                                                        <Link href={`/profile/${active.partner.username}`} className="block font-display text-[15px] font-black text-white truncate hover:text-[var(--accent)] transition-colors">
                                                            {active.name}
                                                        </Link>
                                                    ) : (
                                                        <span className="block font-display text-[15px] font-black text-white truncate">{active.name}</span>
                                                    )}
                                                    <span className="flex items-center gap-2 font-display text-[9.5px] font-bold uppercase tracking-[0.1em] text-white/35">
                                                        {active.type === "direct" ? (
                                                            (() => {
                                                                const f = hub?.friends.find((x) => x.username === active.partner?.username);
                                                                return f?.game
                                                                    ? <span className="text-emerald-400">In game · {f.game}</span>
                                                                    : <span>{f?.online ? "Online" : "Offline"}</span>;
                                                            })()
                                                        ) : (
                                                            <span><Hash className="inline w-2.5 h-2.5" /> {thread?.members.length ?? active.members_count} members</span>
                                                        )}
                                                    </span>
                                                </span>

                                                {/* Who is in the group, at a glance, without opening anything. */}
                                                {active.type === "group" && (thread?.members.length ?? 0) > 0 && (
                                                    <span className="hidden lg:flex items-center -space-x-2 shrink-0">
                                                        {thread!.members.slice(0, 5).map((m) => (
                                                            <span key={m.id} title={m.username} className="ring-2 ring-[var(--surface-1)] rounded-full">
                                                                <Avatar src={m.avatar_url} alt={m.username} size="xs" online={m.online} />
                                                            </span>
                                                        ))}
                                                        {thread!.members.length > 5 && (
                                                            <span className="w-6 h-6 rounded-full bg-white/[0.08] ring-2 ring-[var(--surface-1)] flex items-center justify-center font-display text-[8.5px] font-black text-white/50">
                                                                +{thread!.members.length - 5}
                                                            </span>
                                                        )}
                                                    </span>
                                                )}

                                                {active.type === "group" && (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await axios.delete(`/conversations/${active.id}/leave`);
                                                                toast.success("You left the group.");
                                                                setActiveId(null);
                                                                mutateList();
                                                            } catch { toast.error("Couldn't leave."); }
                                                        }}
                                                        title="Leave group"
                                                        className="shrink-0 w-8 h-8 rounded-[7px] bg-white/[0.04] flex items-center justify-center text-white/35 hover:text-red-400 transition-colors"
                                                    >
                                                        <LogOut className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[520px]">
                                                {/* Fifty messages used to be the whole of any
                                                    conversation — there was no way to ask for
                                                    what came before. */}
                                                {thread?.has_more && !olderDone && (
                                                    <div className="flex justify-center">
                                                        <button
                                                            onClick={loadOlder}
                                                            disabled={loadingOlder}
                                                            className="inline-flex items-center gap-2 h-8 px-4 rounded-full bg-white/[0.05] hover:bg-white/[0.1] font-display text-[9.5px] font-black uppercase tracking-[0.1em] text-white/50 hover:text-white transition-colors disabled:opacity-50"
                                                        >
                                                            {loadingOlder
                                                                ? <><Loader2 className="w-3 h-3 animate-spin" /> Loading</>
                                                                : "Load older messages"}
                                                        </button>
                                                    </div>
                                                )}

                                                {(messages.length === 0) ? (
                                                    <p className="py-10 text-center text-[12px] text-white/25">
                                                        No messages yet — say something.
                                                    </p>
                                                ) : (
                                                    messages.map((m) => (
                                                        <MessageBubble
                                                            key={m.id}
                                                            message={m}
                                                            emoji={thread?.emoji ?? []}
                                                            onReact={react}
                                                            onDelete={m.is_mine ? () => deleteMessage(m.id) : undefined}
                                                        />
                                                    ))
                                                )}
                                                <div ref={bottomRef} />
                                            </div>

                                            <div className="p-3 border-t border-white/[0.07]">
                                                <div className="flex items-end gap-2">
                                                    <input
                                                        ref={fileInput}
                                                        type="file"
                                                        accept="image/*"
                                                        hidden
                                                        onChange={(e) => { const f = e.target.files?.[0]; if (f) send(f); e.target.value = ""; }}
                                                    />
                                                    <button
                                                        onClick={() => fileInput.current?.click()}
                                                        disabled={sending}
                                                        title="Attach an image"
                                                        className="shrink-0 w-9 h-9 rounded-[8px] bg-white/[0.04] flex items-center justify-center text-white/35 hover:text-[var(--accent)] transition-colors"
                                                    >
                                                        <ImageIcon className="w-4 h-4" />
                                                    </button>
                                                    <textarea
                                                        value={draft}
                                                        onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                                                        }}
                                                        rows={1}
                                                        placeholder="Type a message…"
                                                        className="flex-1 min-h-[36px] max-h-[120px] px-3 py-2 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] resize-none"
                                                    />
                                                    <button
                                                        onClick={() => send()}
                                                        disabled={sending || !draft.trim()}
                                                        className="shrink-0 w-9 h-9 rounded-[8px] bg-[var(--accent)] hover:brightness-110 disabled:opacity-40 flex items-center justify-center text-white transition-[filter]"
                                                    >
                                                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                                {draft.length > 1800 && (
                                                    <p className="mt-1.5 text-right font-display text-[9px] font-bold tabular-nums text-white/25">
                                                        {2000 - draft.length} left
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : section === "requests" ? (
                            <div className="p-4 min-h-[400px]">
                                {(hub?.requests.length ?? 0) === 0 ? (
                                    <p className="py-12 text-center text-[12.5px] text-white/30">No requests waiting.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {hub!.requests.map((r) => (
                                            <div key={r.id} className="flex items-center gap-3 p-3 rounded-[10px] border border-white/[0.06] bg-white/[0.02]">
                                                <Avatar src={r.user.avatar_url} alt={r.user.username} size="md" />
                                                <span className="min-w-0 flex-1">
                                                    <Link href={`/profile/${r.user.username}`} className="block text-[13px] font-bold text-white truncate hover:text-[var(--accent)] transition-colors">
                                                        {r.user.display_name || r.user.username}
                                                    </Link>
                                                    <span className="block font-display text-[9px] font-bold uppercase tracking-[0.1em] text-white/30">
                                                        {r.user.xp.toLocaleString("en-US")} XP · {timeAgo(r.created_at)}
                                                    </span>
                                                </span>
                                                <span className="shrink-0 flex items-center gap-1">
                                                    <button onClick={() => respondRequest(r.id, true)} disabled={busy === r.id} title="Accept" className="w-8 h-8 rounded-[7px] bg-emerald-500/12 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/25 transition-colors">
                                                        {busy === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                    </button>
                                                    <button onClick={() => respondRequest(r.id, false)} disabled={busy === r.id} title="Decline" className="w-8 h-8 rounded-[7px] bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : section === "blocked" ? (
                            <div className="p-4 min-h-[400px]">
                                {(hub?.blocked.length ?? 0) === 0 ? (
                                    <p className="py-12 text-center text-[12.5px] text-white/30">Nobody blocked.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {hub!.blocked.map((b) => (
                                            <div key={b.id} className="flex items-center gap-3 p-3 rounded-[10px] border border-white/[0.06] bg-white/[0.02]">
                                                <Avatar src={b.avatar_url} alt={b.username} size="md" />
                                                <span className="flex-1 min-w-0 text-[13px] font-semibold text-white/60 truncate">{b.username}</span>
                                                <button
                                                    onClick={() => unblockUser(b.id, b.username)}
                                                    disabled={busy === b.id}
                                                    className="shrink-0 h-8 px-3.5 rounded-[7px] bg-white/[0.05] hover:bg-white/[0.12] font-display text-[9px] font-black uppercase tracking-[0.1em] text-white/60 hover:text-white transition-colors disabled:opacity-50"
                                                >
                                                    {busy === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Unblock"}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 min-h-[400px]">
                                {(hub?.friends.length ?? 0) === 0 ? (
                                    <p className="py-12 text-center text-[12.5px] text-white/30">
                                        No friends yet. Add people from their profile and they show up here.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {hub!.friends.map((f) => (
                                            <div key={f.id} className="group flex items-center gap-3 p-3 rounded-[10px] border border-white/[0.06] bg-white/[0.02]">
                                                <Avatar src={f.avatar_url} alt={f.username} size="md" online={f.online} />
                                                <span className="min-w-0 flex-1">
                                                    <Link href={`/profile/${f.username}`} className="block text-[13px] font-bold text-white truncate hover:text-[var(--accent)] transition-colors">
                                                        {f.display_name || f.username}
                                                    </Link>
                                                    {f.game ? (
                                                        <span className="flex items-center gap-1 font-display text-[9px] font-bold uppercase tracking-[0.08em] text-emerald-400">
                                                            <Gamepad2 className="w-2.5 h-2.5" /> {f.game}
                                                        </span>
                                                    ) : (
                                                        <span className="font-display text-[9px] font-bold uppercase tracking-[0.08em] text-white/25">
                                                            {f.online ? "Online" : "Offline"}
                                                        </span>
                                                    )}
                                                </span>
                                                <button
                                                    onClick={() => openDirect(f.username)}
                                                    title="Message"
                                                    className="shrink-0 w-8 h-8 rounded-[7px] bg-white/[0.05] flex items-center justify-center text-white/40 hover:text-[var(--accent)] transition-colors"
                                                >
                                                    <MessageCircle className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => blockUser(f.id, f.username)}
                                                    disabled={busy === f.id}
                                                    title="Block"
                                                    className="shrink-0 w-8 h-8 rounded-[7px] bg-white/[0.05] flex items-center justify-center text-white/40 hover:text-red-400 transition-colors disabled:opacity-50"
                                                >
                                                    {busy === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </Panel>
                </div>

                {/* ── right rail ── */}
                <aside className="xl:col-span-3 min-w-0 space-y-4">
                    <Panel
                        title="Online Now"
                        meta={<span className="font-display text-[11px] font-black tabular-nums text-emerald-400">{stats?.online ?? 0}</span>}
                    >
                        {(hub?.friends.length ?? 0) === 0 ? (
                            <p className="py-1 text-[11.5px] text-white/30 leading-snug">
                                No friends yet. Add people from their profile and they show up here.
                            </p>
                        ) : (
                            <div className="space-y-2.5">
                                {hub!.friends.slice(0, 12).map((f) => (
                                    <div key={f.id} className="group flex items-center gap-3">
                                        <Avatar src={f.avatar_url} alt={f.username} size="sm" online={f.online} />
                                        <span className="min-w-0 flex-1">
                                            <Link href={`/profile/${f.username}`} className="block text-[12.5px] font-semibold text-white truncate hover:text-[var(--accent)] transition-colors">
                                                {f.display_name || f.username}
                                            </Link>
                                            {f.game ? (
                                                <span className="flex items-center gap-1 font-display text-[9px] font-bold uppercase tracking-[0.08em] text-emerald-400">
                                                    <Gamepad2 className="w-2.5 h-2.5" /> {f.game}
                                                </span>
                                            ) : (
                                                <span className="font-display text-[9px] font-bold uppercase tracking-[0.08em] text-white/25">
                                                    {f.online ? "Online" : "Offline"}
                                                </span>
                                            )}
                                        </span>
                                        <button
                                            onClick={() => openDirect(f.username)}
                                            title="Message"
                                            className="shrink-0 w-7 h-7 rounded-[6px] bg-white/[0.05] flex items-center justify-center text-white/40 opacity-0 group-hover:opacity-100 hover:text-[var(--accent)] transition-all"
                                        >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>

                    <Panel title="People You May Know">
                        {(hub?.suggestions.length ?? 0) === 0 ? (
                            <p className="py-1 text-[11.5px] text-white/30 leading-snug">
                                Suggestions appear once your friends have friends you don&apos;t.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {hub!.suggestions.map((s) => (
                                    <div key={s.id} className="flex items-center gap-3">
                                        <Avatar src={s.avatar_url} alt={s.username} size="sm" />
                                        <span className="min-w-0 flex-1">
                                            <Link href={`/profile/${s.username}`} className="block text-[12.5px] font-bold text-white truncate hover:text-[var(--accent)] transition-colors">
                                                {s.display_name || s.username}
                                            </Link>
                                            <span className="block font-display text-[9px] font-bold uppercase tracking-[0.1em] text-white/30">
                                                {s.mutual_friends} mutual friend{s.mutual_friends === 1 ? "" : "s"}
                                            </span>
                                        </span>
                                        <button
                                            onClick={() => addFriend(s.username)}
                                            className="shrink-0 h-7 px-3 rounded-[6px] bg-white/[0.05] hover:bg-[var(--accent)] font-display text-[9px] font-black uppercase tracking-[0.1em] text-white/70 hover:text-white transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>
                </aside>
            </div>

            {grouping && (
                <NewGroupModal
                    friends={hub?.friends ?? []}
                    onClose={() => setGrouping(false)}
                    onCreated={(id) => {
                        setGrouping(false);
                        mutateList().then(() => { setSection("messages"); setTab("group"); setActiveId(id); });
                    }}
                />
            )}
        </main>
    );
}
