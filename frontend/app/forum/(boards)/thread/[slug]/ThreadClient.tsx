"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import { isAxiosError } from "axios";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { MessageSquare, Share2, Flag, Lock, Unlock, Shield, ArrowLeft, Eye, Clock, ChevronUp, Reply, Pin, Award, Send, Trash2, Bell, BellOff, Bookmark, Pencil, GitMerge} from "lucide-react";
import { toast } from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { getCategoryColor, getAvatarSrc } from "@/lib/forum";
import { useRealTimeThreadReplies } from "@/hooks";
import { useForumReads } from "@/hooks/useForumReads";
import PostReactions from "@/components/forum/PostReactions";
import ThreadPoll, { type PollData } from "@/components/forum/ThreadPoll";

// PERF: Dynamic import for heavy editor (~50KB+ with Tiptap extensions)
const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor"), {
    loading: () => <div className="h-32 bg-white/[0.03] rounded-[var(--radius-card)] animate-pulse" />,
    ssr: false
});
import DOMPurify from "isomorphic-dompurify";
import { decodeHtml } from "@/lib/decode";
import { isOwnUpload } from "@/lib/imageUrl";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface User {
    id: number;
    username: string;
    avatar_url?: string;
    role?: string; // Legacy
    roles?: string[]; // New Spatie roles
    rank?: {
        name: string;
        color: string;
        icon?: string;
    };
    xp?: number;
    forum_reputation?: number;
    posts_count?: number;
    created_at?: string;
    post_color?: string | null;
}

interface Post {
    id: number;
    content: string | null;
    created_at: string;
    edited_at?: string;
    is_solution: boolean;
    is_deleted?: boolean;
    author: User;
    /** reaction => count; kinds nobody picked are simply absent. */
    reactions?: Record<string, number>;
    my_reaction?: string | null;
}

interface Thread {
    id: number;
    slug: string;
    title: string;
    content: string;
    is_locked: boolean;
    is_pinned: boolean;
    created_at: string;
    author: User;
    category: {
        name: string;
        slug: string;
    };
    view_count: number;
    posts_count: number;
    upvotes_count: number;
    is_upvoted: boolean;
    is_watching: boolean;
    is_bookmarked: boolean;
    tags?: { name: string; slug: string }[];
}

export interface ThreadData {
    thread: Thread;
    /** One per thread at most, and absent on threads that ask nothing. */
    poll?: PollData | null;
    /**
     * A bare list, historically — the endpoint dropped its paginator meta on
     * the way out, so the pager below never had numbers to draw and every
     * thread stopped at reply fifteen. It sends the counts now; the array form
     * stays in the type because responses cached before the fix still have it.
     */
    posts: Post[] | {
        data: Post[];
        current_page?: number;
        last_page?: number;
        per_page?: number;
        total?: number;
    };
}

const getDisplayRole = (user: User | undefined) => {
    if (!user) return null;
    const staffRoles = ['Super Admin', 'Admin', 'Editor', 'Editor-in-Chief', 'Journalist', 'Moderator'];

    // Combine explicit roles and legacy role
    const userRoles = [...(user.roles || [])];
    if (user.role) userRoles.push(user.role);

    // Find matching staff role (case insensitive normalization)
    return staffRoles.find(sr => {
        const nsr = sr.toLowerCase().replace(/[^a-z0-9]/g, '');
        return userRoles.some(ur => ur.toLowerCase().replace(/[^a-z0-9]/g, '') === nsr);
    });
};

export default function ThreadClient({ initial }: { initial: ThreadData | null }) {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const { user } = useAuth();
    const [replyContent, setReplyContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUpvoting, setIsUpvoting] = useState(false);
    const [isReporting, setIsReporting] = useState(false);
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [hasReported, setHasReported] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [isPinning, setIsPinning] = useState(false);
    const [isLocking, setIsLocking] = useState(false);
    const [deleteThreadDialogOpen, setDeleteThreadDialogOpen] = useState(false);
    const [isDeletingThread, setIsDeletingThread] = useState(false);
    const [editingPostId, setEditingPostId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState("");
    const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
    const [markingSolutionId, setMarkingSolutionId] = useState<number | null>(null);
    const [isTogglingWatch, setIsTogglingWatch] = useState(false);
    const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);
    const [isSelfPinning, setIsSelfPinning] = useState(false);

    // Editing the thread itself. Every reply could be edited; the opening
    // post could not, because the API had no route for it.
    const [editingThread, setEditingThread] = useState(false);
    const [threadTitleDraft, setThreadTitleDraft] = useState("");
    const [threadBodyDraft, setThreadBodyDraft] = useState("");
    const [savingThread, setSavingThread] = useState(false);

    // Replies are paginated fifteen at a time. The page used to ask for the
    // first page only and offer no way to the rest, so every thread stopped
    // dead at reply fifteen — and a new reply that landed on page two
    // appeared, then vanished on the next revalidation.
    /**
     * A link to one reply has to land on it.
     *
     * Search results and notifications point at `#post-123`, and replies come
     * fifteen at a time — so anything past the first page opened the thread at
     * the top with the quoted reply nowhere on screen. `?post=` is handed to
     * the API, which knows the ordering and answers with the right page; the
     * anchor below then does the scrolling.
     */
    const searchParams = useSearchParams();
    const targetPost = searchParams.get("post");
    const [page, setPage] = useState<number | null>(targetPost ? null : 1);
    /**
     * The thread arrives already written.
     *
     * `fallbackData` is what the server fetched, so the opening post and the
     * first fifteen replies are in the HTML — no skeleton for a reader, and for
     * a crawler the difference between a page about something and an empty
     * shell. Only for the plain first view: a deep link to a reply, or any page
     * past the first, is a genuine fetch because the server did not make it.
     */
    const isInitialView = page === 1 && !targetPost;
    const { data, isLoading, mutate } = useSWR<ThreadData>(
        slug
            ? `/forum/threads/${slug}?${page === null ? `post=${targetPost}` : `page=${page}`}`
            : null,
        fetcher,
        isInitialView && initial
            ? { keepPreviousData: true, fallbackData: initial }
            : { keepPreviousData: true }
    );
    const pageInfo = data?.posts && !Array.isArray(data.posts) ? data.posts : null;
    const lastPage = pageInfo?.last_page ?? 1;
    const currentPage = page ?? pageInfo?.current_page ?? 1;

    // Once the server has said which page the linked post is on, adopt it, so
    // the pager below shows where the reader actually is.
    useEffect(() => {
        if (page === null && pageInfo?.current_page) setPage(pageInfo.current_page);
    }, [page, pageInfo?.current_page]);

    // Scroll only after the post it names is on the page.
    useEffect(() => {
        if (!targetPost || page === null) return;
        const el = document.getElementById(`post-${targetPost}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [targetPost, page, data]);
    const { replies: liveReplies } = useRealTimeThreadReplies(data?.thread?.id ?? 0);

    /**
     * Opening the thread is what marks it read.
     *
     * It is a POST rather than something folded into the GET above: that
     * endpoint answers guests too, and a read should not be the thing that
     * writes. Keyed on the thread id so paging through replies does not keep
     * re-marking, and so a live reply arriving does not either.
     */
    const { markThreadRead } = useForumReads();
    const threadId = data?.thread?.id;
    useEffect(() => {
        if (threadId && slug) markThreadRead(slug, threadId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [threadId, slug]);

    // Helper to normalize posts
    const getPosts = (data: ThreadData | undefined): Post[] => {
        if (!data?.posts) return [];
        if (Array.isArray(data.posts)) return data.posts;
        return data.posts.data || [];
    };

    /**
     * Quote a reply into the box at the bottom.
     *
     * The editor has always had a blockquote button, but that is formatting —
     * it does not carry who said what, and on a board where three people are
     * answering at once a bare quote is unattributable. This writes the
     * attribution line and a permalink back to the post being answered, which
     * is what makes a long thread followable.
     *
     * The quoted text is reduced to plain text on the way in: it is about to be
     * re-submitted as content, and carrying somebody else's markup — images
     * included — into your own post is how a quote chain turns into a wall.
     */
    const quotePost = (author: string | undefined, html: string | null, postId: number) => {
        const text = (html ?? "")
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 600);

        const attribution = author
            ? `<p><a href="#post-${postId}">${author} wrote:</a></p>`
            : "<p>Quote:</p>";

        setReplyContent((current) =>
            `${current ?? ""}${attribution}<blockquote><p>${text}</p></blockquote><p></p>`
        );

        document.getElementById("reply-box")?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        setIsSubmitting(true);

        try {
            const response = await axios.post(`/forum/threads/${slug}/posts`, {
                content: replyContent
            });

            const newPost = response.data.data || response.data;

            setReplyContent("");

            // A reply lands at the end of the thread. If we are not on the
            // last page, go there — appending it to page one only for it to
            // disappear on the next revalidation is worse than a jump.
            if (lastPage > currentPage) {
                setPage(lastPage);
                toast.success("Reply posted successfully!");
                setIsSubmitting(false);
                return;
            }

            // Manually update cache to show the new post immediately
            if (data) {
                const currentPosts = getPosts(data);
                const updatedPosts = [...currentPosts, newPost];

                // Construct new data preserving structure
                const newData = { ...data };
                if (Array.isArray(newData.posts)) {
                    newData.posts = updatedPosts;
                } else {
                    newData.posts = {
                        ...newData.posts,
                        data: updatedPosts
                    };
                }

                mutate({
                    ...newData,
                    thread: { // Also update reply count
                        ...data.thread,
                        posts_count: (data.thread.posts_count || currentPosts.length) + 1
                    }
                }, false); // false = do not revalidate immediately
            }

            toast.success("Reply posted successfully!");
            // Trigger a background revalidation just in case
            mutate();

        } catch (error: any) {
            console.error("Failed to reply", error);
            const errorMessage = error.response?.data?.message || "Failed to post reply.";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpvote = async () => {
        if (!user) {
            toast.error("You must be logged in to upvote.");
            return;
        }
        if (isUpvoting) return;
        setIsUpvoting(true);
        if (!data) { setIsUpvoting(false); return; }

        // Optimistic update
        if (data) {
            const newIsUpvoted = !data.thread.is_upvoted;
            const newCount = data.thread.upvotes_count + (newIsUpvoted ? 1 : -1);

            mutate({
                ...data,
                thread: {
                    ...data.thread,
                    is_upvoted: newIsUpvoted,
                    upvotes_count: newCount
                }
            }, false);

            try {
                await axios.post(`/forum/threads/${slug}/upvote`);
                mutate();
            } catch (error) {
                console.error("Failed to upvote", error);
                mutate();
                toast.error("Failed to upvote.");
            } finally {
                setIsUpvoting(false);
            }
        }
    };

    const handleToggleWatch = async () => {
        if (!user || isTogglingWatch || !data) return;
        setIsTogglingWatch(true);
        try {
            const res = await axios.post(`/forum/threads/${slug}/watch`);
            mutate({ ...data, thread: { ...data.thread, is_watching: res.data.watching } }, false);
            toast.success(res.data.message);
        } catch {
            toast.error("Failed to update watch status.");
        } finally {
            setIsTogglingWatch(false);
        }
    };

    const handleToggleBookmark = async () => {
        if (!user || isTogglingBookmark || !data) return;
        setIsTogglingBookmark(true);
        try {
            const res = await axios.post(`/forum/threads/${slug}/bookmark`);
            mutate({ ...data, thread: { ...data.thread, is_bookmarked: res.data.bookmarked } }, false);
            toast.success(res.data.message);
        } catch {
            toast.error("Failed to update bookmark.");
        } finally {
            setIsTogglingBookmark(false);
        }
    };

    const handleSelfPin = async () => {
        if (!data || isSelfPinning) return;
        if (!confirm("Spend 100 Bounty to pin this thread to the top of its category for 24 hours?")) return;
        setIsSelfPinning(true);
        try {
            const res = await axios.post(`/forum/threads/${slug}/self-pin`);
            mutate({ ...data, thread: { ...data.thread, is_pinned: true } }, false);
            toast.success(res.data.message);
        } catch (err) {
            const message = isAxiosError(err) ? err.response?.data?.message : undefined;
            toast.error(message || "Failed to self-pin thread.");
        } finally {
            setIsSelfPinning(false);
        }
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied to clipboard!");
        } catch (err) {
            console.error('Failed to copy', err);
            toast.error("Failed to copy link.");
        }
    };

    const handlePin = async () => {
        if (!user || isPinning) return;
        setIsPinning(true);
        try {
            const res = await axios.post(`/forum/threads/${slug}/pin`);
            if (data) {
                mutate({ ...data, thread: { ...data.thread, is_pinned: res.data.is_pinned } }, false);
            }
            toast.success(res.data.message);
        } catch {
            toast.error("Failed to update pin status.");
        } finally {
            setIsPinning(false);
        }
    };

    const handleLockToggle = async () => {
        if (!user || isLocking) return;
        setIsLocking(true);
        try {
            const res = await axios.post(`/forum/threads/${slug}/lock`);
            if (data) {
                mutate({ ...data, thread: { ...data.thread, is_locked: res.data.is_locked } }, false);
            }
            toast.success(res.data.message);
        } catch {
            toast.error("Failed to update lock status.");
        } finally {
            setIsLocking(false);
        }
    };

    /**
     * Fold this thread into another.
     *
     * Asked for by slug rather than picked from a list: a moderator merging a
     * duplicate has the other thread open in the next tab, and its slug is in
     * the address bar. A picker over every thread on the site would be a worse
     * way to say the same thing.
     */
    const [isMerging, setIsMerging] = useState(false);
    const handleMerge = async () => {
        const into = window.prompt(
            "Merge this thread into which one? Paste the other thread's slug — the last part of its address."
        );
        if (!into?.trim()) return;

        setIsMerging(true);
        try {
            const res = await axios.post(`/forum/threads/${slug}/merge`, { into: into.trim() });
            toast.success("Merged. Taking you to the thread it went into.");
            router.push(`/forum/thread/${res.data.into}`);
        } catch (err) {
            toast.error(
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                ?? "That thread could not be merged."
            );
        } finally {
            setIsMerging(false);
        }
    };

    const handleDeleteThread = async () => {
        if (!data) return;
        setIsDeletingThread(true);
        try {
            await axios.delete(`/forum/threads/${slug}`);
            toast.success("Thread deleted.");
            router.push(`/forum/${data.thread.category?.slug || ""}`);
        } catch {
            toast.error("Failed to delete thread.");
            setIsDeletingThread(false);
        }
    };

    const startThreadEdit = () => {
        setThreadTitleDraft(decodeHtml(thread?.title ?? ""));
        setThreadBodyDraft(thread?.content ?? "");
        setEditingThread(true);
    };

    const saveThreadEdit = async () => {
        if (!thread) return;

        setSavingThread(true);

        try {
            await axios.put(`/forum/threads/${thread.slug}`, {
                title: threadTitleDraft,
                content: threadBodyDraft,
            });

            toast.success("Thread updated.");
            setEditingThread(false);
            mutate();
        } catch (e: unknown) {
            const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Could not save that.");
        } finally {
            setSavingThread(false);
        }
    };

    const handleEditPost = (post: Post) => {
        setEditingPostId(post.id);
        setEditContent(post.content ?? "");
    };

    const handleSaveEdit = async (postId: number) => {
        if (!editContent.trim()) return;
        try {
            const res = await axios.put(`/forum/threads/${slug}/posts/${postId}`, { content: editContent });
            const updatedPost = res.data.data || res.data;
            if (data) {
                const currentPosts = getPosts(data);
                const updatedPosts = currentPosts.map(p => p.id === postId ? { ...p, ...updatedPost } : p);
                if (Array.isArray(data.posts)) {
                    mutate({ ...data, posts: updatedPosts }, false);
                } else {
                    mutate({ ...data, posts: { ...data.posts, data: updatedPosts } }, false);
                }
            }
            setEditingPostId(null);
            toast.success("Post updated.");
        } catch {
            toast.error("Failed to update post.");
        }
    };

    const handleDeletePost = async (postId: number) => {
        if (!confirm("Are you sure you want to delete this post?")) return;
        setDeletingPostId(postId);
        try {
            await axios.delete(`/forum/threads/${slug}/posts/${postId}`);
            if (data) {
                const currentPosts = getPosts(data);
                const updatedPosts = currentPosts.filter(p => p.id !== postId);
                if (Array.isArray(data.posts)) {
                    mutate({ ...data, posts: updatedPosts, thread: { ...data.thread, posts_count: updatedPosts.length } }, false);
                } else {
                    mutate({ ...data, posts: { ...data.posts, data: updatedPosts }, thread: { ...data.thread, posts_count: updatedPosts.length } }, false);
                }
            }
            toast.success("Post deleted.");
        } catch {
            toast.error("Failed to delete post.");
        } finally {
            setDeletingPostId(null);
        }
    };

    const handleMarkSolution = async (postId: number) => {
        if (markingSolutionId) return;
        setMarkingSolutionId(postId);
        try {
            const res = await axios.post(`/forum/threads/${slug}/posts/${postId}/solution`);
            const nowSolution = res.data.is_solution as boolean;
            if (data) {
                const currentPosts = getPosts(data);
                const updatedPosts = currentPosts.map(p => ({
                    ...p,
                    is_solution: p.id === postId ? nowSolution : (nowSolution ? false : p.is_solution),
                }));
                if (Array.isArray(data.posts)) {
                    mutate({ ...data, posts: updatedPosts }, false);
                } else {
                    mutate({ ...data, posts: { ...data.posts, data: updatedPosts } }, false);
                }
            }
            toast.success(res.data.message);
        } catch {
            toast.error("Failed to update solution status.");
        } finally {
            setMarkingSolutionId(null);
        }
    };

    const handleReportClick = () => {
        if (hasReported) {
            toast("You have already reported this thread.", { icon: 'ℹ️' });
            return;
        }
        setReportDialogOpen(true);
    };

    const confirmReport = async () => {
        setIsReporting(true);
        try {
            await axios.post('/reports', {
                reportable_type: 'thread',
                reportable_id: data?.thread?.id,
                reason: reportReason,
            });
            setHasReported(true);
            setReportDialogOpen(false);
            toast.success("Thread reported. Thank you for helping keep the community safe.");
        } catch (error) {
            toast.error("Failed to report thread. Please try again.");
        } finally {
            setIsReporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--surface-0)]">
                <div className="container-page py-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-[var(--surface-1)] rounded-[var(--radius-card)] w-1/3" />
                        <div className="h-48 bg-[var(--surface-1)] rounded-[var(--radius-panel)]" />
                        <div className="h-32 bg-[var(--surface-1)] rounded-[var(--radius-panel)]" />
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-[var(--surface-0)] flex flex-col items-center justify-center gap-4">
                <MessageSquare className="w-16 h-16 text-white/12" />
                <h1 className="text-2xl font-bold text-white">Thread Not Found</h1>
                <Link href="/forum">
                    <Button>Back to Forums</Button>
                </Link>
            </div>
        );
    }

    const { thread } = data;
    const fetchedPosts = getPosts(data);
    const liveOnlyReplies: Post[] = liveReplies
        .filter((r) => !fetchedPosts.some((p) => p.id === r.id))
        .map((r) => ({
            id: r.id,
            content: r.content,
            created_at: r.created_at,
            is_solution: false,
            author: {
                id: r.author.id,
                username: r.author.username,
                avatar_url: r.author.avatar ?? undefined,
            },
        }));
    const postsList = [...fetchedPosts, ...liveOnlyReplies];
    const categoryColor = getCategoryColor(thread.category?.slug || '');
    const threadAuthorAvatar = getAvatarSrc(thread.author?.avatar_url);

    // Helper to check staff for layout adjustments
    const isStaff = (u: User) => {
        const role = getDisplayRole(u);
        return !!role;
    };
    const threadAuthorStaff = isStaff(thread.author);
    const currentUserIsStaff = user ? isStaff({ ...user, roles: (user as any).roles }) : false;
    const canModerate = currentUserIsStaff;

    /* The page opens inside the boards layout now: no page-wide wrapper, no
       container of its own, no sidebar of its own. The layout holds all three
       and keeps them mounted, so arriving here from a board changes this column
       and nothing else. */
    return (
        <>
            {/* Header */}
            <div className="border-b border-[var(--line)]">
                <div className="pt-4 pb-3">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-[11.5px] text-white/50 mb-2.5">
                        <Link href="/forum" className="hover:text-[var(--accent)] transition-colors flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" />
                            Forum
                        </Link>
                        <span>/</span>
                        {/* The board's colour was the whole link, and for half the
                            boards that colour is a violet — which on a crimson site
                            reads as a visited link rather than as an identity. The
                            colour is a tick beside the name now; the name itself
                            follows the ink ladder like every other link here. */}
                        <Link
                            href={`/forum/${thread.category?.slug}`}
                            className="flex items-center gap-1.5 text-[var(--ink-low)] hover:text-[var(--accent-ink)] transition-colors"
                        >
                            <span aria-hidden className="h-3 w-[3px] rounded-full" style={{ backgroundColor: categoryColor }} />
                            {decodeHtml(thread.category?.name || 'General')}
                        </Link>
                    </div>

                    {/* Thread Title & Meta */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                {thread.is_pinned && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-[var(--accent)] text-white">
                                        <Pin className="w-3 h-3" /> Pinned
                                    </span>
                                )}
                                {thread.is_locked && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                        <Lock className="w-3 h-3" /> Locked
                                    </span>
                                )}
                                {canModerate && (
                                    <>
                                        <button
                                            onClick={handlePin}
                                            disabled={isPinning}
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border transition-all ${thread.is_pinned ? 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30' : 'bg-white/5 text-white/45 border-white/10 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] hover:border-[var(--accent)]/30'}`}
                                        >
                                            <Pin className="w-3 h-3" />
                                            {thread.is_pinned ? 'Unpin' : 'Pin'}
                                        </button>
                                        <button
                                            onClick={handleLockToggle}
                                            disabled={isLocking}
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border transition-all ${thread.is_locked ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-white/5 hover:text-white/45 hover:border-white/10' : 'bg-white/5 text-white/45 border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'}`}
                                        >
                                            {thread.is_locked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                            {thread.is_locked ? 'Unlock' : 'Lock'}
                                        </button>
                                        <button
                                            onClick={handleMerge}
                                            disabled={isMerging}
                                            title="Fold this thread into another"
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border border-white/10 bg-white/5 text-white/45 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all"
                                        >
                                            <GitMerge className="w-3 h-3" />
                                            {isMerging ? "Merging…" : "Merge"}
                                        </button>
                                        <button
                                            onClick={() => setDeleteThreadDialogOpen(true)}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border border-white/10 bg-white/5 text-white/45 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Delete
                                        </button>
                                    </>
                                )}
                                {(canModerate || user?.id === thread.author?.id) && !editingThread && (
                                    <button
                                        onClick={startThreadEdit}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border border-white/10 bg-white/5 text-white/45 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all"
                                    >
                                        <Pencil className="w-3 h-3" />
                                        Edit
                                    </button>
                                )}
                                {!canModerate && user?.id === thread.author?.id && !thread.is_pinned && (
                                    <button
                                        onClick={handleSelfPin}
                                        disabled={isSelfPinning}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-all"
                                    >
                                        <Pin className="w-3 h-3" />
                                        Pin for 24h (100 Bounty)
                                    </button>
                                )}
                            </div>
                            {editingThread ? (
                                <input
                                    value={threadTitleDraft}
                                    onChange={(e) => setThreadTitleDraft(e.target.value)}
                                    maxLength={255}
                                    aria-label="Thread title"
                                    className="w-full mb-3 h-12 px-4 rounded-[var(--radius-card)] bg-[var(--surface-2)] border border-[var(--line-strong)] font-display text-[20px] font-black text-white outline-none focus:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus:ring-1 focus:ring-[var(--accent-soft)] transition-all"
                                />
                            ) : (
                                <h1 className="font-display text-[22px] md:text-[26px] font-bold text-white leading-tight mb-2">
                                    {decodeHtml(thread.title)}
                                </h1>
                            )}
                            {thread.tags && thread.tags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                    {thread.tags.map((tag) => (
                                        <Link
                                            key={tag.slug}
                                            href={`/forum/${thread.category?.slug}?tag=${tag.slug}`}
                                            className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/[0.03] text-white/45 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors"
                                        >
                                            {tag.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                            <div className="flex flex-wrap items-center gap-4 text-[12px] text-white/55">
                                <span className="flex items-center gap-1" suppressHydrationWarning>
                                    <Clock className="w-4 h-4" />
                                    {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    {thread.view_count} views
                                </span>
                                <span className="flex items-center gap-1">
                                    <MessageSquare className="w-4 h-4" />
                                    {thread.posts_count || postsList.length} replies
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="py-5">
                <div className="space-y-6">
                        {/* The poll, above the replies it is meant to replace:
                            a thread that asks for a count should show the count
                            before forty people write one answer each. */}
                        {data.poll && (
                            <ThreadPoll
                                poll={data.poll}
                                threadSlug={slug}
                                canVote={Boolean(user) && !thread.is_locked}
                                onVoted={(next) => mutate({ ...data, poll: next }, { revalidate: false })}
                            />
                        )}

                        {/* Original Post */}
                        <div className="bg-[var(--surface-1)] border border-white/[0.07] rounded-[var(--radius-panel)] overflow-hidden">
                            {/* The author was a 192px column down the left of every
                                post — the phpBB shape, and a fifth of the reading
                                width spent on a name and a join date. It is a
                                header strip now: same information, one line, and
                                the prose gets the room back. */}
                            <div className="flex flex-col">
                                {/* Author strip */}
                                <div className="bg-white/[0.02] px-4 py-2.5 flex flex-row items-center gap-3 text-left border-b border-white/[0.07]">
                                    <Link href={`/profile/${thread.author?.username}`} aria-label={`${thread.author?.username || "Author"} profile`} className="group">
                                        <div className={`w-9 h-9 rounded-full overflow-hidden bg-[var(--surface-1)] ring-2 transition-all ${threadAuthorStaff ? 'ring-[var(--accent)]' : 'ring-white/[0.07] group-hover:ring-[var(--accent)]'}`}>
                                            {threadAuthorAvatar ? (
                                                <Image src={threadAuthorAvatar} alt={thread.author?.username || ""} width={80} height={80} className="object-cover w-full h-full" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-[var(--accent)]">
                                                    {thread.author?.username?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                    <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <Link
                                        href={`/profile/${thread.author?.username}`}
                                        className={`font-bold text-sm hover:underline ${threadAuthorStaff ? 'text-[var(--accent)]' : !thread.author?.post_color ? 'text-white' : ''}`}
                                        style={!threadAuthorStaff && thread.author?.post_color ? { color: thread.author.post_color } : undefined}
                                    >
                                        {thread.author?.username || 'Unknown'}
                                    </Link>

                                    {/* Role Display */}
                                    {(() => {
                                        const role = getDisplayRole(thread.author);
                                        if (role) {
                                            return (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 uppercase tracking-wide">
                                                    <Shield className="w-3 h-3" /> {role}
                                                </span>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {thread.author?.rank && (
                                        <span
                                            className="inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
                                            style={{ backgroundColor: `${thread.author.rank.color}20`, color: thread.author.rank.color }}
                                        >
                                            {thread.author.rank.name}
                                        </span>
                                    )}

                                    {/* Post count and join date are the rail's
                                        small print; on a phone they are two
                                        lines of stranger's paperwork above the
                                        thing you opened the thread to read. */}
                                    <div className="hidden sm:flex text-[11px] text-white/50 items-center gap-2 ml-auto">
                                        <span>{thread.author?.posts_count || 0} posts</span>
                                        {thread.author?.created_at && (
                                            <span>Joined {format(new Date(thread.author.created_at), 'MMM yyyy')}</span>
                                        )}
                                    </div>
                                    </div>
                                </div>

                                {/* Post Content */}
                                <div className="flex-1 p-4 md:p-6">
                                    {editingThread ? (
                                        <div>
                                            <RichTextEditor content={threadBodyDraft} onChange={setThreadBodyDraft} minHeight="180px" />
                                            <div className="flex items-center gap-2 mt-3">
                                                <button
                                                    onClick={saveThreadEdit}
                                                    disabled={savingThread}
                                                    className="btn-command inline-flex items-center justify-center h-9 px-5 bg-[var(--accent)] font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white hover:brightness-110 transition-[filter] disabled:opacity-50"
                                                >
                                                    {savingThread ? "Saving" : "Save changes"}
                                                </button>
                                                <button
                                                    onClick={() => setEditingThread(false)}
                                                    disabled={savingThread}
                                                    className="btn-command btn-command-quiet inline-flex items-center justify-center h-9 px-5 bg-white/[0.04] font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/55 hover:text-white hover:bg-white/[0.08] transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="prose prose-invert max-w-none text-white/70 leading-relaxed">
                                            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(thread.content || '<p>No content</p>') }} />
                                        </div>
                                    )}

                                    {/* Post Actions */}
                                    <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/[0.07]">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleUpvote}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-card)] text-xs font-medium transition-all ${thread.is_upvoted ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-white/45 hover:text-white hover:bg-white/[0.03]'}`}
                                            >
                                                <ChevronUp className={`w-4 h-4 ${thread.is_upvoted ? 'stroke-2' : ''}`} />
                                                <span>Upvote {thread.upvotes_count > 0 && `(${thread.upvotes_count})`}</span>
                                            </button>
                                            {user && (
                                                <button
                                                    onClick={handleToggleWatch}
                                                    disabled={isTogglingWatch}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-card)] text-xs font-medium transition-all ${thread.is_watching ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-white/45 hover:text-white hover:bg-white/[0.03]'}`}
                                                >
                                                    {thread.is_watching ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                                    {thread.is_watching ? 'Watching' : 'Watch'}
                                                </button>
                                            )}
                                            {user && (
                                                <button
                                                    onClick={handleToggleBookmark}
                                                    disabled={isTogglingBookmark}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-card)] text-xs font-medium transition-all ${thread.is_bookmarked ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-white/45 hover:text-white hover:bg-white/[0.03]'}`}
                                                >
                                                    <Bookmark className={`w-4 h-4 ${thread.is_bookmarked ? 'fill-current' : ''}`} />
                                                    {thread.is_bookmarked ? 'Saved' : 'Save'}
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleShare}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-card)] text-xs font-medium text-white/45 hover:text-white hover:bg-white/[0.03] transition-all"
                                            >
                                                <Share2 className="w-4 h-4" />
                                                Share
                                            </button>
                                            <button
                                                onClick={handleReportClick}
                                                disabled={hasReported}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-card)] text-xs font-medium transition-all ${hasReported ? 'text-green-500' : 'text-white/45 hover:text-red-400 hover:bg-red-500/10'}`}
                                            >
                                                {hasReported ? <Shield className="w-4 h-4" /> : <Flag className="w-4 h-4" />}
                                                {hasReported ? 'Reported' : 'Report'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Replies Section */}
                        {postsList.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-[var(--accent)]" />
                                    Replies ({postsList.length})
                                </h3>

                                {postsList.map((post, index) => {
                                    const postAuthorStaff = isStaff(post.author);
                                    const postAuthorAvatar = getAvatarSrc(post.author?.avatar_url);

                                    if (post.is_deleted) {
                                        return (
                                            <div key={post.id} className="bg-[var(--surface-1)] border border-white/[0.07] rounded-[var(--radius-panel)] p-4 flex items-center justify-between">
                                                <span className="text-sm text-white/50 italic">[This post was deleted]</span>
                                                <span className="text-xs text-white/50">#{(currentPage - 1) * 15 + index + 2}</span>
                                            </div>
                                        );
                                    }

                                    return (
                                        /* Search results link to #post-N, and nothing
                                           on this page answered to that name — the link
                                           landed on the thread and stopped there. The
                                           anchor exists now; scroll-mt keeps the header
                                           off the post it jumps to. Replies past the
                                           first page still need the API to say which
                                           page a post is on, which it does not. */
                                        <div id={`post-${post.id}`} key={post.id} className={`scroll-mt-28 bg-[var(--surface-1)] border border-white/[0.07] rounded-[var(--radius-panel)] overflow-hidden ${post.is_solution ? 'ring-2 ring-green-500/50' : ''}`}>
                                            {post.is_solution && (
                                                <div className="bg-green-500/10 border-b border-green-500/30 px-4 py-2 flex items-center gap-2 text-green-400 text-sm font-bold">
                                                    <Award className="w-4 h-4" />
                                                    Marked as Solution
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                {/* Author strip */}
                                                <div className="bg-white/[0.02] px-4 py-2.5 flex items-center gap-3 border-b border-white/[0.07]">
                                                    <Link href={`/profile/${post.author?.username}`}>
                                                        <div className={`w-9 h-9 rounded-full overflow-hidden bg-[var(--surface-1)] ring-2 transition-all ${postAuthorStaff ? 'ring-[var(--accent)]' : 'ring-white/[0.07]'}`}>
                                                            {postAuthorAvatar ? (
                                                                <Image src={postAuthorAvatar} alt={post.author?.username || ""} width={64} height={64} className="object-cover w-full h-full" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-lg font-bold text-[var(--accent)]">
                                                                    {post.author?.username?.charAt(0)?.toUpperCase() || '?'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Link>
                                                    <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                                                        <Link
                                                            href={`/profile/${post.author?.username}`}
                                                            className={`font-bold text-sm hover:underline ${postAuthorStaff ? 'text-[var(--accent)]' : !post.author?.post_color ? 'text-white' : ''}`}
                                                            style={!postAuthorStaff && post.author?.post_color ? { color: post.author.post_color } : undefined}
                                                        >
                                                            {post.author?.username || 'Unknown'}
                                                        </Link>

                                                        {/* Role Display */}
                                                        {(() => {
                                                            const role = getDisplayRole(post.author);
                                                            if (role) {
                                                                return (
                                                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 uppercase tracking-wide">
                                                                        <Shield className="w-2.5 h-2.5" /> {role}
                                                                    </span>
                                                                );
                                                            }
                                                            return null;
                                                        })()}

                                                        {post.author?.rank && (
                                                            <span
                                                                className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full"
                                                                style={{ backgroundColor: `${post.author.rank.color}20`, color: post.author.rank.color }}
                                                            >
                                                                {post.author.rank.name}
                                                            </span>
                                                        )}

                                                        <div className="hidden md:block text-[10px] text-white/50 mt-2">
                                                            <div>{post.author?.posts_count || 0} posts</div>
                                                            {post.author?.created_at && (
                                                                <div>Joined {format(new Date(post.author.created_at), 'MMM yyyy')}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Reply Content */}
                                                <div className="flex-1 p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-xs text-white/50" suppressHydrationWarning>
                                                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                                            {post.edited_at && <span className="ml-2 italic">(edited)</span>}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-white/50">#{(currentPage - 1) * 15 + index + 2}</span>
                                                            {user && !thread.is_locked && (
                                                                <button
                                                                    onClick={() => quotePost(post.author?.username, post.content, post.id)}
                                                                    className="text-xs px-2 py-1 rounded text-white/45 hover:text-[var(--accent)] hover:bg-white/[0.03] transition-all"
                                                                >
                                                                    Quote
                                                                </button>
                                                            )}
                                                            {user && (user.id === thread.author?.id || currentUserIsStaff) && (
                                                                <button
                                                                    onClick={() => handleMarkSolution(post.id)}
                                                                    disabled={markingSolutionId === post.id}
                                                                    className={`text-xs px-2 py-1 rounded transition-all ${post.is_solution ? 'text-green-400 hover:text-red-400 hover:bg-red-500/10' : 'text-white/45 hover:text-green-400 hover:bg-green-500/10'}`}
                                                                >
                                                                    {markingSolutionId === post.id ? '...' : post.is_solution ? 'Unmark Solution' : 'Mark as Solution'}
                                                                </button>
                                                            )}
                                                            {user && (user.id === post.author?.id || currentUserIsStaff) && (
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        onClick={() => handleEditPost(post)}
                                                                        className="text-xs px-2 py-1 rounded text-white/45 hover:text-[var(--accent)] hover:bg-white/[0.03] transition-all"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeletePost(post.id)}
                                                                        disabled={deletingPostId === post.id}
                                                                        className="text-xs px-2 py-1 rounded text-white/45 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                                    >
                                                                        {deletingPostId === post.id ? '...' : 'Delete'}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {editingPostId === post.id ? (
                                                        <div className="space-y-2">
                                                            <textarea
                                                                value={editContent}
                                                                onChange={(e) => setEditContent(e.target.value)}
                                                                className="w-full border border-white/[0.07] bg-white/[0.02] rounded-[var(--radius-card)] p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none min-h-[100px]"
                                                            />
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleSaveEdit(post.id)}
                                                                    className="px-3 py-1.5 bg-[var(--accent)] text-white text-xs font-bold rounded-[var(--radius-card)] hover:brightness-110 transition-colors"
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingPostId(null)}
                                                                    className="px-3 py-1.5 bg-white/[0.03] text-white/45 text-xs font-bold rounded-[var(--radius-card)] hover:bg-white/[0.06] transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="prose prose-sm prose-invert max-w-none text-white/70">
                                                                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content ?? "") }} />
                                                            </div>
                                                            <PostReactions
                                                                threadSlug={slug}
                                                                postId={post.id}
                                                                counts={post.reactions ?? {}}
                                                                mine={post.my_reaction ?? null}
                                                                canReact={Boolean(user) && !thread.is_locked}
                                                            />
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pages — a long thread has more than the fifteen replies
                            the API hands back at a time. */}
                        {lastPage > 1 && (
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                                <button
                                    onClick={() => setPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage <= 1}
                                    className="inline-flex items-center h-8 px-3.5 rounded-[8px] border border-white/[0.07] bg-white/[0.03] font-display text-[9.5px] font-black uppercase tracking-[0.1em] text-white/45 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                {Array.from({ length: lastPage }, (_, i) => i + 1)
                                    .filter((n) => n === 1 || n === lastPage || Math.abs(n - currentPage) <= 2)
                                    .map((n, idx, arr) => (
                                        <span key={n} className="flex items-center gap-1.5">
                                            {idx > 0 && arr[idx - 1] !== n - 1 && <span className="text-white/20">…</span>}
                                            <button
                                                onClick={() => setPage(n)}
                                                className={`inline-flex items-center h-8 px-3 rounded-[8px] border font-display text-[9.5px] font-black tabular-nums transition-colors ${
                                                    n === currentPage
                                                        ? "bg-[var(--accent)] border-transparent text-white"
                                                        : "bg-white/[0.03] border-white/[0.07] text-white/45 hover:text-white"
                                                }`}
                                            >
                                                {n}
                                            </button>
                                        </span>
                                    ))}
                                <button
                                    onClick={() => setPage(Math.min(lastPage, currentPage + 1))}
                                    disabled={currentPage >= lastPage}
                                    className="inline-flex items-center h-8 px-3.5 rounded-[8px] border border-white/[0.07] bg-white/[0.03] font-display text-[9.5px] font-black uppercase tracking-[0.1em] text-white/45 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}

                        {/* Reply Form */}
                        {thread.is_locked ? (
                            /* A closed thread is a fact, not an event. This was a
                               230px panel with a 48px lock in the middle of it,
                               announcing the absence of a reply box more loudly
                               than the box itself would have spoken. */
                            <div className="flex items-center gap-2.5 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] px-4 py-3">
                                <Lock aria-hidden className="h-4 w-4 shrink-0 text-[var(--ink-faint)]" strokeWidth={1.6} />
                                <p className="text-[12.5px] text-[var(--ink-low)]">
                                    <span className="font-bold text-[var(--ink-mid)]">Thread locked.</span>{" "}
                                    No new replies can be posted.
                                </p>
                            </div>
                        ) : (
                        <div id="reply-box" className="scroll-mt-28 bg-[var(--surface-1)] border border-white/[0.07] rounded-[var(--radius-panel)] p-6">
                            {user ? (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Reply className="w-5 h-5 text-[var(--accent)]" />
                                            Post a Reply
                                        </h3>
                                        <Link href="/forum/rules" className="text-xs text-white/50 hover:text-[var(--accent)] transition-colors flex items-center gap-1">
                                            <Shield className="w-3 h-3" />
                                            Community Guidelines
                                        </Link>
                                    </div>
                                    <form onSubmit={handleReply} className="space-y-4">
                                        <div className="flex gap-4">
                                            <div className="hidden md:block shrink-0">
                                                <div className="w-12 h-12 rounded-full overflow-hidden bg-white/[0.03] ring-2 ring-white/[0.07]">
                                                    {getAvatarSrc(user.avatar_url) ? (
                                                        <Image unoptimized={!isOwnUpload(getAvatarSrc(user.avatar_url))} src={getAvatarSrc(user.avatar_url)!} alt={user.username} width={48} height={48} className="object-cover w-full h-full" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-lg font-bold text-[var(--accent)]">
                                                            {user.username?.charAt(0)?.toUpperCase() || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <RichTextEditor
                                    uploadPath="/forum/uploads"
                                                    content={replyContent}
                                                    onChange={setReplyContent}
                                                    placeholder="Share your thoughts..."
                                                    minHeight="120px"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting || !replyContent.trim()}
                                                className=""
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                        Posting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4 mr-2" />
                                                        Post Reply
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <MessageSquare className="w-12 h-12 text-white/12 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-white mb-2">Join the Discussion</h3>
                                    <p className="text-white/45 mb-6">You must be logged in to reply to this thread.</p>
                                    <div className="flex justify-center gap-4">
                                        <Link href="/login">
                                            <Button variant="outline">Log In</Button>
                                        </Link>
                                        <Link href="/register">
                                            <Button>Sign Up</Button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                        )}
                </div>
            </div>
            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Report Thread</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-white/45">
                            Are you sure you want to report this thread to the moderators?
                            This action cannot be undone.
                        </p>
                        <textarea
                            className="w-full border border-white/[0.07] bg-white/[0.02] rounded-[var(--radius-inner)] p-3 text-sm text-white placeholder-white/35 focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none"
                            rows={3}
                            placeholder="Reason for reporting (optional)..."
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReportDialogOpen(false)} disabled={isReporting}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={confirmReport} disabled={isReporting}>
                            {isReporting ? 'Reporting...' : 'Report Content'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={deleteThreadDialogOpen} onOpenChange={setDeleteThreadDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Thread</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-white/45">
                            This permanently deletes the thread and all of its replies. This action cannot be undone.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteThreadDialogOpen(false)} disabled={isDeletingThread}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDeleteThread} disabled={isDeletingThread}>
                            {isDeletingThread ? 'Deleting...' : 'Delete Thread'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
