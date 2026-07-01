"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import { isAxiosError } from "axios";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { MessageSquare, Share2, Flag, Lock, Unlock, Shield, ArrowLeft, Eye, Clock, ChevronUp, Reply, Pin, Award, Send, Trash2, Bell, BellOff, Bookmark } from "lucide-react";
import { toast } from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import ForumSidebar from "@/components/forum/ForumSidebar";
import { getCategoryColor, getAvatarSrc } from "@/lib/forum";
import { useRealTimeThreadReplies } from "@/hooks";

// PERF: Dynamic import for heavy editor (~50KB+ with Tiptap extensions)
const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor"), {
    loading: () => <div className="h-32 bg-white/[0.03] rounded-lg animate-pulse" />,
    ssr: false
});
import DOMPurify from "isomorphic-dompurify";

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

interface ThreadData {
    thread: Thread;
    posts: Post[] | {
        data: Post[];
        links: any[];
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

export default function ThreadPage() {
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

    const { data, isLoading, mutate } = useSWR<ThreadData>(slug ? `/forum/threads/${slug}` : null, fetcher);
    const { replies: liveReplies } = useRealTimeThreadReplies(data?.thread?.id ?? 0);

    // Helper to normalize posts
    const getPosts = (data: ThreadData | undefined): Post[] => {
        if (!data?.posts) return [];
        if (Array.isArray(data.posts)) return data.posts;
        return data.posts.data || [];
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
            <div className="min-h-screen bg-[#060810]">
                <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-[#0D1117] rounded-lg w-1/3" />
                        <div className="h-48 bg-[#0D1117] rounded-2xl" />
                        <div className="h-32 bg-[#0D1117] rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-[#060810] flex flex-col items-center justify-center gap-4">
                <MessageSquare className="w-16 h-16 text-[#3F3F46]" />
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

    return (
        <div className="min-h-screen bg-[#060810]">
            {/* Header */}
            <div className="bg-[#0B0E1A] border-b border-[#1A2030]">
                <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-6">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-4">
                        <Link href="/forum" className="hover:text-tp-accent transition-colors flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" />
                            Forum
                        </Link>
                        <span>/</span>
                        <Link
                            href={`/forum/${thread.category?.slug}`}
                            className="hover:text-tp-accent transition-colors"
                            style={{ color: categoryColor }}
                        >
                            {thread.category?.name || 'General'}
                        </Link>
                    </div>

                    {/* Thread Title & Meta */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                {thread.is_pinned && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-tp-accent text-white">
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
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border transition-all ${thread.is_pinned ? 'bg-tp-accent/10 text-tp-accent border-tp-accent/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30' : 'bg-white/5 text-[#9CA3AF] border-white/10 hover:bg-tp-accent/10 hover:text-tp-accent hover:border-tp-accent/30'}`}
                                        >
                                            <Pin className="w-3 h-3" />
                                            {thread.is_pinned ? 'Unpin' : 'Pin'}
                                        </button>
                                        <button
                                            onClick={handleLockToggle}
                                            disabled={isLocking}
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border transition-all ${thread.is_locked ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-white/5 hover:text-[#9CA3AF] hover:border-white/10' : 'bg-white/5 text-[#9CA3AF] border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'}`}
                                        >
                                            {thread.is_locked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                            {thread.is_locked ? 'Unlock' : 'Lock'}
                                        </button>
                                        <button
                                            onClick={() => setDeleteThreadDialogOpen(true)}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border border-white/10 bg-white/5 text-[#9CA3AF] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Delete
                                        </button>
                                    </>
                                )}
                                {!canModerate && user?.id === thread.author?.id && !thread.is_pinned && (
                                    <button
                                        onClick={handleSelfPin}
                                        disabled={isSelfPinning}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border border-tp-accent/30 bg-tp-accent/10 text-tp-accent hover:bg-tp-accent/20 transition-all"
                                    >
                                        <Pin className="w-3 h-3" />
                                        Pin for 24h (100 Bounty)
                                    </button>
                                )}
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-3">
                                {thread.title}
                            </h1>
                            {thread.tags && thread.tags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                                    {thread.tags.map((tag) => (
                                        <Link
                                            key={tag.slug}
                                            href={`/forum/${thread.category?.slug}?tag=${tag.slug}`}
                                            className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/[0.03] text-[#9CA3AF] hover:bg-tp-accent/10 hover:text-tp-accent transition-colors"
                                        >
                                            {tag.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-[#9CA3AF]">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full overflow-hidden bg-white/[0.03]">
                                        {threadAuthorAvatar ? (
                                            <Image src={threadAuthorAvatar} alt={thread.author?.username || ""} width={24} height={24} className="object-cover w-full h-full" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-tp-accent">
                                                {thread.author?.username?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <span>
                                        Started by <Link href={`/profile/${thread.author?.username}`} className="text-tp-accent hover:underline font-medium">{thread.author?.username || 'Unknown'}</Link>
                                    </span>
                                </div>
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
            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Thread Content & Replies */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Original Post */}
                        <div className="bg-[#0D1117] border border-[#1A2030] rounded-2xl overflow-hidden">
                            <div className="flex flex-col md:flex-row">
                                {/* Author Sidebar */}
                                <div className="md:w-48 bg-white/[0.02] p-6 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-[#1A2030]">
                                    <Link href={`/profile/${thread.author?.username}`} className="group">
                                        <div className={`w-20 h-20 rounded-full overflow-hidden bg-[#0B0E1A] mb-3 ring-2 transition-all ${threadAuthorStaff ? 'ring-tp-accent' : 'ring-[#1A2030] group-hover:ring-tp-accent'}`}>
                                            {threadAuthorAvatar ? (
                                                <Image src={threadAuthorAvatar} alt={thread.author?.username || ""} width={80} height={80} className="object-cover w-full h-full" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-tp-accent">
                                                    {thread.author?.username?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                    <Link
                                        href={`/profile/${thread.author?.username}`}
                                        className={`font-bold text-sm mb-1 hover:underline ${threadAuthorStaff ? 'text-tp-accent' : !thread.author?.post_color ? 'text-white' : ''}`}
                                        style={!threadAuthorStaff && thread.author?.post_color ? { color: thread.author.post_color } : undefined}
                                    >
                                        {thread.author?.username || 'Unknown'}
                                    </Link>

                                    {/* Role Display */}
                                    {(() => {
                                        const role = getDisplayRole(thread.author);
                                        if (role) {
                                            return (
                                                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-tp-accent/10 text-tp-accent border border-tp-accent/20 uppercase tracking-wide mb-2">
                                                    <Shield className="w-3 h-3" /> {role}
                                                </span>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {thread.author?.rank && (
                                        <span
                                            className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mb-2"
                                            style={{ backgroundColor: `${thread.author.rank.color}20`, color: thread.author.rank.color }}
                                        >
                                            {thread.author.rank.name}
                                        </span>
                                    )}

                                    <div className="text-xs text-[#6B7280] mt-2 flex flex-col items-center gap-1">
                                        <span>{thread.author?.posts_count || 0} posts</span>
                                        {thread.author?.created_at && (
                                            <span>Joined {format(new Date(thread.author.created_at), 'MMM yyyy')}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Post Content */}
                                <div className="flex-1 p-6">
                                    <div className="prose prose-invert max-w-none text-[#D1D5DB] leading-relaxed">
                                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(thread.content || '<p>No content</p>') }} />
                                    </div>

                                    {/* Post Actions */}
                                    <div className="flex items-center justify-between mt-8 pt-4 border-t border-[#1A2030]">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleUpvote}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${thread.is_upvoted ? 'text-tp-accent bg-tp-accent/10' : 'text-[#9CA3AF] hover:text-white hover:bg-white/[0.03]'}`}
                                            >
                                                <ChevronUp className={`w-4 h-4 ${thread.is_upvoted ? 'stroke-2' : ''}`} />
                                                <span>Upvote {thread.upvotes_count > 0 && `(${thread.upvotes_count})`}</span>
                                            </button>
                                            {user && (
                                                <button
                                                    onClick={handleToggleWatch}
                                                    disabled={isTogglingWatch}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${thread.is_watching ? 'text-tp-accent bg-tp-accent/10' : 'text-[#9CA3AF] hover:text-white hover:bg-white/[0.03]'}`}
                                                >
                                                    {thread.is_watching ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                                    {thread.is_watching ? 'Watching' : 'Watch'}
                                                </button>
                                            )}
                                            {user && (
                                                <button
                                                    onClick={handleToggleBookmark}
                                                    disabled={isTogglingBookmark}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${thread.is_bookmarked ? 'text-tp-accent bg-tp-accent/10' : 'text-[#9CA3AF] hover:text-white hover:bg-white/[0.03]'}`}
                                                >
                                                    <Bookmark className={`w-4 h-4 ${thread.is_bookmarked ? 'fill-current' : ''}`} />
                                                    {thread.is_bookmarked ? 'Saved' : 'Save'}
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleShare}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#9CA3AF] hover:text-white hover:bg-white/[0.03] transition-all"
                                            >
                                                <Share2 className="w-4 h-4" />
                                                Share
                                            </button>
                                            <button
                                                onClick={handleReportClick}
                                                disabled={hasReported}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${hasReported ? 'text-green-500' : 'text-[#9CA3AF] hover:text-red-400 hover:bg-red-500/10'}`}
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
                                    <MessageSquare className="w-5 h-5 text-tp-accent" />
                                    Replies ({postsList.length})
                                </h3>

                                {postsList.map((post, index) => {
                                    const postAuthorStaff = isStaff(post.author);
                                    const postAuthorAvatar = getAvatarSrc(post.author?.avatar_url);

                                    if (post.is_deleted) {
                                        return (
                                            <div key={post.id} className="bg-[#0D1117] border border-[#1A2030] rounded-2xl p-4 flex items-center justify-between">
                                                <span className="text-sm text-[#4B5563] italic">[This post was deleted]</span>
                                                <span className="text-xs text-[#4B5563]">#{index + 2}</span>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={post.id} className={`bg-[#0D1117] border border-[#1A2030] rounded-2xl overflow-hidden ${post.is_solution ? 'ring-2 ring-green-500/50' : ''}`}>
                                            {post.is_solution && (
                                                <div className="bg-green-500/10 border-b border-green-500/30 px-4 py-2 flex items-center gap-2 text-green-400 text-sm font-bold">
                                                    <Award className="w-4 h-4" />
                                                    Marked as Solution
                                                </div>
                                            )}
                                            <div className="flex flex-col md:flex-row">
                                                {/* Author Mini Sidebar */}
                                                <div className="md:w-40 bg-white/[0.02] p-4 flex md:flex-col items-center md:text-center gap-3 md:gap-2 border-b md:border-b-0 md:border-r border-[#1A2030]">
                                                    <Link href={`/profile/${post.author?.username}`}>
                                                        <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden bg-[#0B0E1A] ring-2 transition-all ${postAuthorStaff ? 'ring-tp-accent' : 'ring-[#1A2030]'}`}>
                                                            {postAuthorAvatar ? (
                                                                <Image src={postAuthorAvatar} alt={post.author?.username || ""} width={64} height={64} className="object-cover w-full h-full" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-lg font-bold text-tp-accent">
                                                                    {post.author?.username?.charAt(0)?.toUpperCase() || '?'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Link>
                                                    <div className="md:mt-2">
                                                        <Link
                                                            href={`/profile/${post.author?.username}`}
                                                            className={`font-bold text-sm hover:underline block ${postAuthorStaff ? 'text-tp-accent' : !post.author?.post_color ? 'text-white' : ''}`}
                                                            style={!postAuthorStaff && post.author?.post_color ? { color: post.author.post_color } : undefined}
                                                        >
                                                            {post.author?.username || 'Unknown'}
                                                        </Link>

                                                        {/* Role Display */}
                                                        {(() => {
                                                            const role = getDisplayRole(post.author);
                                                            if (role) {
                                                                return (
                                                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-tp-accent/10 text-tp-accent border border-tp-accent/20 uppercase tracking-wide mb-1 mt-1">
                                                                        <Shield className="w-2.5 h-2.5" /> {role}
                                                                    </span>
                                                                );
                                                            }
                                                            return null;
                                                        })()}

                                                        {post.author?.rank && (
                                                            <span
                                                                className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full block w-fit mx-auto mt-1"
                                                                style={{ backgroundColor: `${post.author.rank.color}20`, color: post.author.rank.color }}
                                                            >
                                                                {post.author.rank.name}
                                                            </span>
                                                        )}

                                                        <div className="hidden md:block text-[10px] text-[#6B7280] mt-2">
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
                                                        <span className="text-xs text-[#6B7280]" suppressHydrationWarning>
                                                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                                            {post.edited_at && <span className="ml-2 italic">(edited)</span>}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-[#6B7280]">#{index + 2}</span>
                                                            {user && (user.id === thread.author?.id || currentUserIsStaff) && (
                                                                <button
                                                                    onClick={() => handleMarkSolution(post.id)}
                                                                    disabled={markingSolutionId === post.id}
                                                                    className={`text-xs px-2 py-1 rounded transition-all ${post.is_solution ? 'text-green-400 hover:text-red-400 hover:bg-red-500/10' : 'text-[#9CA3AF] hover:text-green-400 hover:bg-green-500/10'}`}
                                                                >
                                                                    {markingSolutionId === post.id ? '...' : post.is_solution ? 'Unmark Solution' : 'Mark as Solution'}
                                                                </button>
                                                            )}
                                                            {user && (user.id === post.author?.id || currentUserIsStaff) && (
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        onClick={() => handleEditPost(post)}
                                                                        className="text-xs px-2 py-1 rounded text-[#9CA3AF] hover:text-tp-accent hover:bg-white/[0.03] transition-all"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeletePost(post.id)}
                                                                        disabled={deletingPostId === post.id}
                                                                        className="text-xs px-2 py-1 rounded text-[#9CA3AF] hover:text-red-400 hover:bg-red-500/10 transition-all"
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
                                                                className="w-full border border-[#1A2030] bg-white/[0.02] rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-tp-accent resize-none min-h-[100px]"
                                                            />
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleSaveEdit(post.id)}
                                                                    className="px-3 py-1.5 bg-tp-accent text-white text-xs font-bold rounded-lg hover:bg-tp-accent/90 transition-colors"
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingPostId(null)}
                                                                    className="px-3 py-1.5 bg-white/[0.03] text-[#9CA3AF] text-xs font-bold rounded-lg hover:bg-white/[0.06] transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="prose prose-sm prose-invert max-w-none text-[#D1D5DB]">
                                                            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content ?? "") }} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Reply Form */}
                        <div className="bg-[#0D1117] border border-[#1A2030] rounded-2xl p-6">
                            {thread.is_locked ? (
                                <div className="text-center py-8">
                                    <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-white mb-2">Thread Locked</h3>
                                    <p className="text-[#9CA3AF]">This thread has been locked and no new replies can be posted.</p>
                                </div>
                            ) : user ? (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Reply className="w-5 h-5 text-tp-accent" />
                                            Post a Reply
                                        </h3>
                                        <Link href="/forum/rules" className="text-xs text-[#6B7280] hover:text-tp-accent transition-colors flex items-center gap-1">
                                            <Shield className="w-3 h-3" />
                                            Community Guidelines
                                        </Link>
                                    </div>
                                    <form onSubmit={handleReply} className="space-y-4">
                                        <div className="flex gap-4">
                                            <div className="hidden md:block shrink-0">
                                                <div className="w-12 h-12 rounded-full overflow-hidden bg-white/[0.03] ring-2 ring-[#1A2030]">
                                                    {getAvatarSrc(user.avatar_url) ? (
                                                        <Image src={getAvatarSrc(user.avatar_url)!} alt={user.username} width={48} height={48} className="object-cover w-full h-full" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-lg font-bold text-tp-accent">
                                                            {user.username?.charAt(0)?.toUpperCase() || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <RichTextEditor
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
                                                className="shadow-lg shadow-tp-accent/20"
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
                                    <MessageSquare className="w-12 h-12 text-[#3F3F46] mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-white mb-2">Join the Discussion</h3>
                                    <p className="text-[#9CA3AF] mb-6">You must be logged in to reply to this thread.</p>
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
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <ForumSidebar />
                    </div>
                </div>
            </div>
            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Report Thread</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-[#9CA3AF]">
                            Are you sure you want to report this thread to the moderators?
                            This action cannot be undone.
                        </p>
                        <textarea
                            className="w-full border border-[#1A2030] bg-white/[0.02] rounded-md p-3 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:ring-1 focus:ring-tp-accent resize-none"
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
                        <p className="text-[#9CA3AF]">
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
        </div>
    );
}
