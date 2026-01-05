"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { User, Comment } from "@/types";
import { Button } from "../ui/Button";
import { Heart, MessageSquare, CornerDownRight, Send, Trophy, ShieldCheck, Gamepad2 } from "lucide-react";

// Removed local Comment interface in favor of shared type

interface CommentsSectionProps {
    commentableId: number;
    commentableType: 'article' | 'review' | 'guide';
    initialComments?: Comment[];
}

export default function CommentsSection({ commentableId, commentableType, initialComments = [] }: CommentsSectionProps) {
    const { user, token } = useAuth();
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [isLoading, setIsLoading] = useState(initialComments.length === 0);
    // If initialComments are provided but empty, it might still need to fetch?
    // Actually if passed, we assume we have the state.
    // Better logic: if initialComments was passed (even if empty array), we start loading as false.
    // But in the prop definition I defaulted to []. 
    // Let's rely on checking if the prop was actually passed by the parent, but props destructuring hides it.
    // Let's assume if the parent is doing SSR, it passes the array. 

    // Correction:
    // If SSR passes [], it means 0 comments. We shouldn't fetch again instantly.
    // So we need a flag or logic.
    // Let's use a useRef or just modify the initial state logic.
    // The previous implementation had `useState(true)` for loading.

    // New Logic:
    // const [isLoading, setIsLoading] = useState(!initialComments); 
    // Wait, initialComments is optional in interface but defaulted in args.
    // Let's change the interface to be clearer or just pass undefined check.

    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const [error, setError] = useState<string | null>(null);

    const fetchComments = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            const res = await fetch(`${apiUrl}/comments/${commentableType}/${commentableId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (res.ok) {
                const data = await res.json();
                setComments(data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch comments", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Only fetch if we have no initial data (implied by isLoading logic start) OR if we want to refresh
        // But for "Instant" feel, we rely on SSR data strictly at first.
        // If isLoading started as true (initialComments undefined), we fetch.
        if (isLoading) {
            fetchComments();
        }
    }, [commentableId, commentableType, token]); // Removed isLoading from deps to avoid loop

    const handleLike = async (commentId: number) => {
        if (!user) return; // Prompt login?

        // Optimistic UI update
        setComments(prevComments => {
            const updateLikeInTree = (list: Comment[]): Comment[] => {
                return list.map(c => {
                    if (c.id === commentId) {
                        return {
                            ...c,
                            likes_count: c.is_liked_by_user ? c.likes_count - 1 : c.likes_count + 1,
                            is_liked_by_user: !c.is_liked_by_user
                        };
                    }
                    if (c.replies) {
                        return { ...c, replies: updateLikeInTree(c.replies) };
                    }
                    return c;
                });
            };
            return updateLikeInTree(prevComments);
        });

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/comments/${commentId}/like`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error("Like failed", err);
            // Revert on error? For now, keep simple.
        }
    };

    const handleSubmit = async (e: React.FormEvent, parentId: number | null = null) => {
        e.preventDefault();
        const text = parentId ? replyContent : content;

        if (!text.trim() || !user) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            const res = await fetch(`${apiUrl}/comments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    commentable_id: commentableId,
                    commentable_type: commentableType,
                    content: text,
                    parent_id: parentId
                })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Failed to post comment");
            }

            await fetchComments();

            if (parentId) {
                setReplyingTo(null);
                setReplyContent("");
            } else {
                setContent("");
            }
        } catch (err) {
            setError((err as Error).message || "Something went wrong.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div id="comments" className="max-w-4xl mx-auto py-12 px-4">
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-[var(--accent)]" />
                </div>
                Discussion <span className="text-[var(--text-muted)] text-lg font-normal">({comments.length})</span>
            </h3>

            {/* Main Comment Form */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 mb-10 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-[50px] pointer-events-none group-hover:bg-[var(--accent)]/10 transition-all" />

                {user ? (
                    <form onSubmit={(e) => handleSubmit(e)}>
                        <div className="flex gap-4">
                            <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-[var(--bg-elevated)] ring-2 ring-white/5">
                                {user.avatar_url ? (
                                    <Image src={user.avatar_url} alt={user.username} width={40} height={40} className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-[var(--accent)]">
                                        {user?.username ? user.username.charAt(0).toUpperCase() : '?'}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="What are your thoughts? (You'll earn 10 XP!)"
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all min-h-[100px] resize-y placeholder:text-gray-600"
                                    required
                                />
                                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                                <div className="mt-4 flex justify-between items-center">
                                    <p className="text-xs text-[var(--text-muted)] italic">Remember to be respectful and follow our guidelines.</p>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={isSubmitting || !content.trim()}
                                        className="shadow-lg shadow-[var(--accent)]/20"
                                    >
                                        {isSubmitting ? "Posting..." : "Post Comment"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="text-center py-8">
                        <Gamepad2 className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
                        <h4 className="text-lg font-bold text-white mb-2">Join the conversation</h4>
                        <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">You must be logged in to leave a comment, like posts, and earn community XP.</p>
                        <div className="flex justify-center gap-4">
                            <Link href="/login?redirect=back">
                                <Button variant="outline">Log In</Button>
                            </Link>
                            <Link href="/register?redirect=back">
                                <Button variant="primary">Sign Up</Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Comment List */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[var(--text-muted)]">Loading discussion...</p>
                </div>
            ) : comments.length > 0 ? (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            user={user}
                            replyingTo={replyingTo}
                            setReplyingTo={setReplyingTo}
                            replyContent={replyContent}
                            setReplyContent={setReplyContent}
                            handleSubmit={handleSubmit}
                            handleLike={handleLike}
                            isSubmitting={isSubmitting}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-[var(--bg-elevated)]/20 rounded-xl border border-dashed border-[var(--border)]">
                    <MessageSquare className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-30" />
                    <p className="text-[var(--text-muted)] font-medium">No comments yet.</p>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">Be the first to share your thoughts!</p>
                </div>
            )}
        </div>
    );
}

// Extracted Component to prevent re-renders losing focus
const CommentItem = ({
    comment,
    isReply = false,
    user,
    replyingTo,
    setReplyingTo,
    replyContent,
    setReplyContent,
    handleSubmit,
    handleLike,
    isSubmitting
}: {
    comment: Comment;
    isReply?: boolean;
    user: User | null;
    replyingTo: number | null;
    setReplyingTo: (id: number | null) => void;
    replyContent: string;
    setReplyContent: (content: string) => void;
    handleSubmit: (e: React.FormEvent, parentId: number | null) => void;
    handleLike: (id: number) => void;
    isSubmitting: boolean;
}) => {
    const displayName = comment.user.name || comment.user.username;
    const isStaff = comment.user.role === 'admin' || comment.user.role === 'editor';

    return (
        <div className={`group animate-fade-in-up ${isReply ? 'ml-12 mt-4 relative' : 'mb-6'}`}>
            {isReply && (
                <div className="absolute -left-6 top-0 w-4 h-4 border-l-2 border-b-2 border-white/10 rounded-bl-lg" />
            )}

            <div className="flex gap-4">
                {/* Avatar */}
                <Link href={`/profile/${comment.user.username}`} className="shrink-0 relative">
                    <div className={`w-10 h-10 rounded-full overflow-hidden bg-[var(--bg-elevated)] ring-2 transition-all ${isStaff ? 'ring-[var(--accent)] shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]' : 'ring-transparent group-hover:ring-white/20'}`}>
                        {comment.user.avatar_url ? (
                            <Image src={comment.user.avatar_url} alt={comment.user.username} width={40} height={40} className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-[var(--accent)] text-lg">
                                {comment.user?.username ? comment.user.username.charAt(0).toUpperCase() : '?'}
                            </div>
                        )}
                    </div>
                    {comment.user.rank && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--bg-card)] rounded-full flex items-center justify-center border border-[var(--border)]" title={comment.user.rank.name}>
                            {/* Simple rank icon mapping or generic trophy */}
                            <Trophy className="w-2.5 h-2.5 text-yellow-500" />
                        </div>
                    )}
                </Link>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                        <Link href={`/profile/${comment.user.username}`} className={`font-bold text-sm hover:underline ${isStaff ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>
                            {displayName}
                        </Link>

                        {/* Staff Badge */}
                        {isStaff && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 uppercase tracking-wide">
                                <ShieldCheck className="w-3 h-3" />
                                Staff
                            </span>
                        )}

                        {/* Rank Badge */}
                        {comment.user.rank && !isStaff && (
                            <span
                                className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-white/5"
                                style={{ color: comment.user.rank.color }}
                            >
                                {comment.user.rank.name}
                            </span>
                        )}

                        <span className="text-xs text-[var(--text-muted)]">• {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                    </div>

                    <div className="text-[var(--text-secondary)] leading-relaxed text-sm bg-[var(--bg-elevated)]/20 p-3 rounded-xl rounded-tl-none border border-transparent group-hover:border-[var(--border)] transition-colors">
                        {comment.content}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-2">
                        <button
                            onClick={() => handleLike(comment.id)}
                            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${comment.is_liked_by_user ? 'text-red-500' : 'text-[var(--text-muted)] hover:text-red-500'}`}
                        >
                            <Heart className={`w-3.5 h-3.5 ${comment.is_liked_by_user ? 'fill-current' : ''}`} />
                            {comment.likes_count > 0 ? comment.likes_count : 'Like'}
                        </button>

                        <button
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Reply
                        </button>
                    </div>

                    {/* Reply Form */}
                    {replyingTo === comment.id && (
                        <div className="mt-4 animate-fade-in-up pl-4 border-l-2 border-[var(--accent)]/30">
                            <form onSubmit={(e) => handleSubmit(e, comment.id)}>
                                <textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder={`Reply to ${displayName}...`}
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] min-h-[80px] resize-y"
                                    autoFocus
                                    required
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <Button type="button" size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>Cancel</Button>
                                    <Button type="submit" size="sm" variant="primary" disabled={isSubmitting || !replyContent.trim()}>
                                        <Send className="w-3 h-3 mr-1" /> Reply
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div>
                            {comment.replies.map(reply => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    isReply={true}
                                    user={user}
                                    replyingTo={replyingTo}
                                    setReplyingTo={setReplyingTo}
                                    replyContent={replyContent}
                                    setReplyContent={setReplyContent}
                                    handleSubmit={handleSubmit}
                                    handleLike={handleLike}
                                    isSubmitting={isSubmitting}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
