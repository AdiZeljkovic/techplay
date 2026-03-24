"use client";

import useSWR, { mutate } from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { MessageSquare, Share2, Flag, Lock, Shield, ArrowLeft, Eye, Clock, ChevronUp, Reply, MoreHorizontal, Pin, Award, Send } from "lucide-react";
import { toast } from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import ForumSidebar from "@/components/forum/ForumSidebar";

// PERF: Dynamic import for heavy editor (~50KB+ with Tiptap extensions)
const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor"), {
    loading: () => <div className="h-32 bg-[var(--bg-elevated)] rounded-lg animate-pulse" />,
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
}

interface Post {
    id: number;
    content: string;
    created_at: string;
    edited_at?: string;
    is_solution: boolean;
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
}

interface ThreadData {
    thread: Thread;
    posts: Post[] | {
        data: Post[];
        links: any[];
    };
}

const getCategoryColor = (slug: string) => {
    switch (slug) {
        case 'the-lounge': return '#8b5cf6';
        case 'general-chat': return '#3b82f6';
        case 'news-announcements': return '#ef4444';
        case 'hardware-tech': return '#10b981';
        case 'game-reviews': return '#f59e0b';
        default: return '#3b82f6';
    }
};

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
    const [editingPostId, setEditingPostId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState("");
    const [deletingPostId, setDeletingPostId] = useState<number | null>(null);

    const { data, isLoading, mutate } = useSWR<ThreadData>(slug ? `/forum/threads/${slug}` : null, fetcher);

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

    const handleEditPost = (post: Post) => {
        setEditingPostId(post.id);
        setEditContent(post.content);
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
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setHasReported(true);
            setReportDialogOpen(false);
            toast.success("Thread reported. Thank you for helping keep the community safe.");
        } catch (error) {
            toast.error("Failed to report thread.");
        } finally {
            setIsReporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <div className="container mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-[var(--bg-card)] rounded-lg w-1/3" />
                        <div className="h-48 bg-[var(--bg-card)] rounded-2xl" />
                        <div className="h-32 bg-[var(--bg-card)] rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-4">
                <MessageSquare className="w-16 h-16 text-[var(--text-muted)]" />
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Thread Not Found</h1>
                <Link href="/forum">
                    <Button>Back to Forums</Button>
                </Link>
            </div>
        );
    }

    const { thread, posts: rawPosts } = data;
    const postsList = getPosts(data);
    const categoryColor = getCategoryColor(thread.category?.slug || '');

    // Helper to check staff for layout adjustments
    const isStaff = (u: User) => {
        const role = getDisplayRole(u);
        return !!role;
    };
    const threadAuthorStaff = isStaff(thread.author);
    const currentUserIsStaff = user ? isStaff({ ...user, roles: (user as any).roles }) : false;
    const canPin = currentUserIsStaff;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header */}
            <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <div className="container mx-auto px-4 py-6">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-4">
                        <Link href="/forum" className="hover:text-[var(--accent)] transition-colors flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" />
                            Forum
                        </Link>
                        <span>/</span>
                        <Link
                            href={`/forum/${thread.category?.slug}`}
                            className="hover:text-[var(--accent)] transition-colors"
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
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-[var(--accent)] text-white">
                                        <Pin className="w-3 h-3" /> Pinned
                                    </span>
                                )}
                                {thread.is_locked && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                        <Lock className="w-3 h-3" /> Locked
                                    </span>
                                )}
                                {canPin && (
                                    <button
                                        onClick={handlePin}
                                        disabled={isPinning}
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border transition-all ${thread.is_pinned ? 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30' : 'bg-white/5 text-[var(--text-muted)] border-white/10 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] hover:border-[var(--accent)]/30'}`}
                                    >
                                        <Pin className="w-3 h-3" />
                                        {thread.is_pinned ? 'Unpin' : 'Pin'}
                                    </button>
                                )}
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] leading-tight mb-3">
                                {thread.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)]">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full overflow-hidden bg-[var(--bg-elevated)]">
                                        {thread.author?.avatar_url ? (
                                            <Image src={thread.author.avatar_url} alt={thread.author.username} width={24} height={24} className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[var(--accent)]">
                                                {thread.author?.username?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <span>
                                        Started by <Link href={`/profile/${thread.author?.username}`} className="text-[var(--accent)] hover:underline font-medium">{thread.author?.username || 'Unknown'}</Link>
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
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Thread Content & Replies */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Original Post */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-lg">
                            <div className="flex flex-col md:flex-row">
                                {/* Author Sidebar */}
                                <div className="md:w-48 bg-[var(--bg-elevated)]/30 p-6 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-[var(--border)]">
                                    <Link href={`/profile/${thread.author?.username}`} className="group">
                                        <div className={`w-20 h-20 rounded-full overflow-hidden bg-[var(--bg-secondary)] mb-3 ring-2 transition-all ${threadAuthorStaff ? 'ring-[var(--accent)] shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]' : 'ring-[var(--border)] group-hover:ring-[var(--accent)]'}`}>
                                            {thread.author?.avatar_url ? (
                                                <Image src={thread.author.avatar_url} alt={thread.author.username} width={80} height={80} className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-[var(--accent)]">
                                                    {thread.author?.username?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                    <Link href={`/profile/${thread.author?.username}`} className={`font-bold text-sm mb-1 hover:underline ${threadAuthorStaff ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>
                                        {thread.author?.username || 'Unknown'}
                                    </Link>

                                    {/* Role Display */}
                                    {(() => {
                                        const role = getDisplayRole(thread.author);
                                        if (role) {
                                            return (
                                                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 uppercase tracking-wide mb-2">
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

                                    <div className="text-xs text-[var(--text-muted)] mt-2 flex flex-col items-center gap-1">
                                        <span>{thread.author?.posts_count || 0} posts</span>
                                        {thread.author?.created_at && (
                                            <span>Joined {format(new Date(thread.author.created_at), 'MMM yyyy')}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Post Content */}
                                <div className="flex-1 p-6">
                                    <div className="prose prose-invert max-w-none text-[var(--text-secondary)] leading-relaxed">
                                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(thread.content || '<p>No content</p>') }} />
                                    </div>

                                    {/* Post Actions */}
                                    <div className="flex items-center justify-between mt-8 pt-4 border-t border-[var(--border)]">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleUpvote}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${thread.is_upvoted ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'}`}
                                            >
                                                <ChevronUp className={`w-4 h-4 ${thread.is_upvoted ? 'stroke-2' : ''}`} />
                                                <span>Upvote {thread.upvotes_count > 0 && `(${thread.upvotes_count})`}</span>
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleShare}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all"
                                            >
                                                <Share2 className="w-4 h-4" />
                                                Share
                                            </button>
                                            <button
                                                onClick={handleReportClick}
                                                disabled={hasReported}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${hasReported ? 'text-green-500' : 'text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10'}`}
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
                                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-[var(--accent)]" />
                                    Replies ({postsList.length})
                                </h3>

                                {postsList.map((post, index) => {
                                    const postAuthorStaff = isStaff(post.author);
                                    return (
                                        <div key={post.id} className={`bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden ${post.is_solution ? 'ring-2 ring-green-500/50' : ''}`}>
                                            {post.is_solution && (
                                                <div className="bg-green-500/10 border-b border-green-500/30 px-4 py-2 flex items-center gap-2 text-green-400 text-sm font-bold">
                                                    <Award className="w-4 h-4" />
                                                    Marked as Solution
                                                </div>
                                            )}
                                            <div className="flex flex-col md:flex-row">
                                                {/* Author Mini Sidebar */}
                                                <div className="md:w-40 bg-[var(--bg-elevated)]/20 p-4 flex md:flex-col items-center md:text-center gap-3 md:gap-2 border-b md:border-b-0 md:border-r border-[var(--border)]">
                                                    <Link href={`/profile/${post.author?.username}`}>
                                                        <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden bg-[var(--bg-secondary)] ring-2 transition-all ${postAuthorStaff ? 'ring-[var(--accent)]' : 'ring-[var(--border)]'}`}>
                                                            {post.author?.avatar_url ? (
                                                                <Image src={post.author.avatar_url} alt={post.author.username} width={64} height={64} className="object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-lg font-bold text-[var(--accent)]">
                                                                    {post.author?.username?.charAt(0)?.toUpperCase() || '?'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Link>
                                                    <div className="md:mt-2">
                                                        <Link href={`/profile/${post.author?.username}`} className={`font-bold text-sm hover:underline block ${postAuthorStaff ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>
                                                            {post.author?.username || 'Unknown'}
                                                        </Link>

                                                        {/* Role Display */}
                                                        {(() => {
                                                            const role = getDisplayRole(post.author);
                                                            if (role) {
                                                                return (
                                                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 uppercase tracking-wide mb-1 mt-1">
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

                                                        <div className="hidden md:block text-[10px] text-[var(--text-muted)] mt-2">
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
                                                        <span className="text-xs text-[var(--text-muted)]" suppressHydrationWarning>
                                                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                                            {post.edited_at && <span className="ml-2 italic">(edited)</span>}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-[var(--text-muted)]">#{index + 2}</span>
                                                            {user && (user.id === post.author?.id || currentUserIsStaff) && (
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        onClick={() => handleEditPost(post)}
                                                                        className="text-xs px-2 py-1 rounded text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-elevated)] transition-all"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeletePost(post.id)}
                                                                        disabled={deletingPostId === post.id}
                                                                        className="text-xs px-2 py-1 rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all"
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
                                                                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none min-h-[100px]"
                                                            />
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleSaveEdit(post.id)}
                                                                    className="px-3 py-1.5 bg-[var(--accent)] text-white text-xs font-bold rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingPostId(null)}
                                                                    className="px-3 py-1.5 bg-[var(--bg-elevated)] text-[var(--text-muted)] text-xs font-bold rounded-lg hover:bg-[var(--border)] transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="prose prose-sm prose-invert max-w-none text-[var(--text-secondary)]">
                                                            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />
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
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-lg">
                            {thread.is_locked ? (
                                <div className="text-center py-8">
                                    <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Thread Locked</h3>
                                    <p className="text-[var(--text-secondary)]">This thread has been locked and no new replies can be posted.</p>
                                </div>
                            ) : user ? (
                                <>
                                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                        <Reply className="w-5 h-5 text-[var(--accent)]" />
                                        Post a Reply
                                    </h3>
                                    <form onSubmit={handleReply} className="space-y-4">
                                        <div className="flex gap-4">
                                            <div className="hidden md:block shrink-0">
                                                <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--bg-elevated)] ring-2 ring-[var(--border)]">
                                                    {user.avatar_url ? (
                                                        <Image src={user.avatar_url} alt={user.username} width={48} height={48} className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-lg font-bold text-[var(--accent)]">
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
                                                className="shadow-lg shadow-[var(--accent)]/20"
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
                                    <MessageSquare className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
                                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Join the Discussion</h3>
                                    <p className="text-[var(--text-secondary)] mb-6">You must be logged in to reply to this thread.</p>
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
                        <p className="text-[var(--text-secondary)]">
                            Are you sure you want to report this thread to the moderators?
                            This action cannot be undone.
                        </p>
                        <textarea
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-md p-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none"
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
        </div>
    );
}
