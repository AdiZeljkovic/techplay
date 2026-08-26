"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { Heart, MessageSquare, Send, Trash2, Loader2, Share2, Check, ImageDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import { timeAgo } from "@/lib/timeAgo";
import type { GameListComment } from "@/lib/types/profile";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

/**
 * The client island on an otherwise static, ISR-rendered list page. Counts
 * arrive from the server render and are corrected by the toggle's own
 * response, so the page never waits on JavaScript to show a number.
 */
export default function ListSocialBar({
    listId,
    ownerUsername,
    slug,
    initialLikes,
    allowComments,
}: {
    listId: number;
    ownerUsername: string;
    /** Needed to point at the list's own card image. */
    slug: string;
    initialLikes: number;
    allowComments: boolean;
}) {
    const { user } = useAuth();
    const [likes, setLikes] = useState(initialLikes);
    const [liked, setLiked] = useState(false);
    const [busy, setBusy] = useState(false);
    const [copied, setCopied] = useState(false);
    const [open, setOpen] = useState(false);
    const [body, setBody] = useState("");
    const [posting, setPosting] = useState(false);

    const key = `/game-lists/${listId}/comments`;
    const { data, mutate } = useSWR<{ data: GameListComment[] }>(open ? key : null, fetcher);
    const comments = data?.data ?? [];

    const toggleLike = async () => {
        if (!user) return toast.error("Sign in to like this list.");
        setBusy(true);
        try {
            const res = await axios.post(`/game-lists/${listId}/like`);
            setLiked(!!res.data?.data?.liked);
            setLikes(res.data?.data?.likes_count ?? likes);
        } catch {
            toast.error("Couldn't register that.");
        } finally {
            setBusy(false);
        }
    };

    const share = () => {
        navigator.clipboard?.writeText(window.location.href).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const post = async () => {
        if (!body.trim()) return;
        setPosting(true);
        try {
            await axios.post(key, { body: body.trim() });
            setBody("");
            mutate();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Couldn't post that.");
        } finally {
            setPosting(false);
        }
    };

    const remove = async (id: number) => {
        try {
            await axios.delete(`${key}/${id}`);
            mutate();
        } catch {
            toast.error("Couldn't remove that comment.");
        }
    };

    return (
        <div>
            <div className="flex items-center gap-2.5">
                <button
                    onClick={toggleLike}
                    disabled={busy}
                    className={`inline-flex items-center gap-2 h-10 px-4 rounded-[8px] border font-display text-[11px] font-bold uppercase tracking-[0.08em] transition-colors duration-300 disabled:opacity-60 ${
                        liked
                            ? "bg-[var(--accent)] border-transparent text-white"
                            : "bg-white/[0.04] border-white/[0.12] text-white hover:bg-white/[0.09]"
                    }`}
                >
                    <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                    <span className="tabular-nums">{likes}</span>
                </button>

                {allowComments && (
                    <button
                        onClick={() => setOpen((v) => !v)}
                        className="inline-flex items-center gap-2 h-10 px-4 rounded-[8px] bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.12] text-white font-display text-[11px] font-bold uppercase tracking-[0.08em] transition-colors"
                    >
                        <MessageSquare className="w-4 h-4" />
                        {open ? "Hide comments" : "Comments"}
                    </button>
                )}

                <button
                    onClick={share}
                    title="Copy link to this list"
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-[8px] bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.12] text-white font-display text-[11px] font-bold uppercase tracking-[0.08em] transition-colors"
                >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                    {copied ? "Copied" : "Share"}
                </button>

                {/* A ranking is made to be posted, and a link is not what gets
                    posted — the picture is. This is the same 1200×630 card the
                    social preview uses, which for a tier list draws the board
                    itself, handed over as a file instead of a meta tag. */}
                <a
                    href={`/og/list?username=${encodeURIComponent(ownerUsername)}&slug=${encodeURIComponent(slug)}`}
                    download={`${slug}.png`}
                    title="Download this list as an image"
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-[8px] bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.12] text-white font-display text-[11px] font-bold uppercase tracking-[0.08em] transition-colors"
                >
                    <ImageDown className="w-4 h-4" />
                    Image
                </a>
            </div>

            {open && allowComments && (
                <div className="mt-5 rounded-[12px] border border-white/[0.07] bg-white/[0.02] p-4">
                    {user ? (
                        <div className="flex items-start gap-3 mb-4">
                            <Avatar src={user.avatar_url ?? null} alt={user.username} size="sm" />
                            <div className="flex-1 min-w-0">
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value.slice(0, 1000))}
                                    rows={2}
                                    placeholder="Say what you think of this ranking…"
                                    className="w-full px-3 py-2.5 rounded-[8px] bg-white/[0.04] border border-white/[0.1] text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] resize-none"
                                />
                                <div className="mt-2 flex justify-end">
                                    <button
                                        onClick={post}
                                        disabled={posting || !body.trim()}
                                        className="inline-flex items-center gap-2 h-9 px-4 rounded-[8px] bg-[var(--accent)] hover:brightness-110 disabled:opacity-40 text-white font-display text-[10.5px] font-bold uppercase tracking-[0.08em] transition-[filter]"
                                    >
                                        {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                        Post
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="mb-4 text-[12.5px] text-white/40">
                            <Link href="/login" className="text-[var(--accent)] font-semibold">Sign in</Link> to join the discussion.
                        </p>
                    )}

                    {comments.length === 0 ? (
                        <p className="py-4 text-center text-[12px] text-white/25">No comments yet — be the first.</p>
                    ) : (
                        <div className="space-y-3">
                            {comments.map((c) => {
                                const mine = user?.username === c.user.username;
                                const canDelete = mine || user?.username === ownerUsername;

                                return (
                                    <div key={c.id} className="group flex items-start gap-3">
                                        <Link href={`/profile/${c.user.username}`} className="shrink-0">
                                            <Avatar src={c.user.avatar_url ?? null} alt={c.user.username} size="sm" />
                                        </Link>
                                        <div className="min-w-0 flex-1">
                                            <p className="flex items-center gap-2">
                                                <Link href={`/profile/${c.user.username}`} className="text-[12px] font-bold text-white hover:text-[var(--accent)] transition-colors">
                                                    {c.user.display_name || c.user.username}
                                                </Link>
                                                <span className="font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/25">
                                                    {timeAgo(c.created_at)}
                                                </span>
                                            </p>
                                            <p className="mt-1 text-[12.5px] text-white/60 leading-snug whitespace-pre-line">{c.body}</p>
                                        </div>
                                        {canDelete && (
                                            <button
                                                onClick={() => remove(c.id)}
                                                title="Delete comment"
                                                className="shrink-0 p-1.5 rounded-[6px] text-white/20 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
