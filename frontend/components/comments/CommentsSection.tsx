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
    const { user, token, isLoading: isAuthLoading } = useAuth();
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [isLoading, setIsLoading] = useState(initialComments.length === 0);

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
        if (isLoading) {
            fetchComments();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [commentableId, commentableType, token]);

    const handleLike = async (commentId: number) => {
        if (!user) return;

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

                {isAuthLoading ? (
                    <div className="flex gap-4 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)]" />
                        <div className="flex-1 space-y-3">
                            <div className="h-10 w-full bg-[var(--bg-elevated)] rounded-lg" />
                            <div className="h-8 w-32 bg-[var(--bg-elevated)] rounded-lg" />
                        </div>
                    </div>
                ) : user ? (
                    <form onSubmit={(e) => handleSubmit(e)}>
                        <div className="flex gap-4">
                            <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-[var(--bg-elevated)] ring-2 ring-white/5">
                                {user.avatar_url ? (
                                    <Image src={user.avatar_url} alt={user.username} width={40} height={40} className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-[var(--accent)]">
                                        {user?.username?.charAt(0)?.toUpperCase() || '?'}
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

// ... (Top of file remains)

            {/* Comment List */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[var(--text-muted)]">Loading discussion...</p>
                </div>
            ) : comments.length > 0 ? (
                <div className="space-y-6">
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            depth={0}
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

// Extracted Component with recursive design
const CommentItem = ({
    comment,
    depth = 0,
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
    depth?: number;
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
    const isOwner = user?.id === comment.user.id;

    return (
        <div className={`group animate-fade-in-up ${depth > 0 ? 'mt-4' : ''}`}>
            <div className="flex gap-4">
                {/* Avatar */}
                <Link href={`/profile/${comment.user.username}`} className="shrink-0 relative">
                    <div className={`w-10 h-10 rounded-full overflow-hidden bg-[var(--bg-elevated)] ring-2 transition-all ${isStaff ? 'ring-[var(--accent)] shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]' : 'ring-transparent group-hover:ring-white/20'}`}>
                        {comment.user.avatar_url ? (
                            <Image src={comment.user.avatar_url} alt={comment.user.username} width={40} height={40} className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-[var(--accent)] text-lg">
                                {comment.user?.username?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                        )}
                    </div>
                </Link>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1.5">
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

                    <div className={`text-[var(--text-secondary)] leading-relaxed text-sm ${depth === 0 ? 'text-base' : ''}`}>
                        {comment.content}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-3">
                        <button
                            onClick={() => handleLike(comment.id)}
                            className={`flex items-center gap-1.5 text-xs font-bold transition-all ${comment.is_liked_by_user ? 'text-red-500' : 'text-[var(--text-muted)] hover:text-red-400'}`}
                        >
                            <Heart className={`w-4 h-4 ${comment.is_liked_by_user ? 'fill-current' : ''}`} />
                            {comment.likes_count > 0 && comment.likes_count}
                        </button>

                        <button
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Reply
                        </button>

                        {isOwner && (
                            <button className="text-xs font-bold text-[var(--text-muted)] hover:text-red-500 transition-colors">
                                Delete
                            </button>
                            // TODO: Implement delete functionality
                        )}
                    </div>

                    {/* Reply Form */}
                    {replyingTo === comment.id && (
                        <div className="mt-4 animate-fade-in-up">
                            <form onSubmit={(e) => handleSubmit(e, comment.id)}>
                                <div className="relative">
                                    <textarea
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder={`Reply to ${displayName}...`}
                                        className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 pr-12 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] min-h-[60px] resize-y shadow-inner"
                                        autoFocus
                                        required
                                    />
                                    <Button
                                        type="submit"
                                        size="sm"
                                        variant="ghost"
                                        className="absolute bottom-2 right-2 hover:bg-[var(--accent)] hover:text-white"
                                        disabled={isSubmitting || !replyContent.trim()}
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex justify-end mt-2">
                                    <button
                                        type="button"
                                        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                        onClick={() => setReplyingTo(null)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Nested Replies Rendering */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 relative">
                            {/* Connector Line for Thread */}
                            <div className="absolute top-0 bottom-0 left-[-26px] w-[2px] bg-[var(--border)] hover:bg-[var(--accent)]/50 transition-colors" />

                            <div className="">
                                {comment.replies.map(reply => (
                                    <CommentItem
                                        key={reply.id}
                                        comment={reply}
                                        depth={depth + 1}
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
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
