"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { useAuth } from "@/hooks/useAuth";
import axios from "@/lib/axios";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { User, Comment } from "@/types";
import { Button } from "../ui/Button";
import { MessageSquare, CornerDownRight, Send, Trophy, ShieldCheck, Gamepad2, ChevronUp, ChevronDown } from "lucide-react";
import { decodeHtml } from "@/lib/decode";

// Removed local Comment interface in favor of shared type

interface CommentsSectionProps {
    commentableId: number;
    commentableType: 'article' | 'review' | 'guide';
    initialComments?: Comment[];
}

export default function CommentsSection({ commentableId, commentableType, initialComments = [] }: CommentsSectionProps) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [isLoading, setIsLoading] = useState(initialComments.length === 0);

    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'warning' } | null>(null);

    // PERFORMANCE: Use useCallback to prevent unnecessary re-renders
    const fetchComments = useCallback(async (signal?: AbortSignal) => {
        try {
            const res = await axios.get(`/comments/${commentableType}/${commentableId}`, {
                signal
            });
            if (!signal?.aborted) {
                setComments(res.data.data || res.data || []);
            }
        } catch (err: any) {
            // Ignore abort/cancel errors
            if (err?.name !== 'AbortError' && err?.code !== 'ERR_CANCELED') {
                console.error("Failed to fetch comments", err);
            }
        } finally {
            if (!signal?.aborted) {
                setIsLoading(false);
            }
        }
    }, [commentableId, commentableType]);

    // MEMORY LEAK FIX: Add AbortController for cleanup on unmount
    useEffect(() => {
        if (!isAuthLoading) {
            const abortController = new AbortController();
            fetchComments(abortController.signal);
            return () => abortController.abort();
        }
    }, [fetchComments, isAuthLoading]);

    const handleVote = async (commentId: number, type: 'up' | 'down') => {
        if (!user) return;

        setComments(prevComments => {
            const updateVoteInTree = (list: Comment[]): Comment[] => {
                return list.map(c => {
                    if (c.id === commentId) {
                        const currentVote = c.user_vote;
                        let newScore = c.score || 0;
                        let newVote = currentVote;

                        if (currentVote === type) {
                            // Toggle off
                            newVote = null;
                            newScore = type === 'up' ? newScore - 1 : newScore + 1;
                        } else if (currentVote) {
                            // Flip
                            newVote = type;
                            newScore = type === 'up' ? newScore + 2 : newScore - 2;
                        } else {
                            // New vote
                            newVote = type;
                            newScore = type === 'up' ? newScore + 1 : newScore - 1;
                        }

                        return {
                            ...c,
                            score: newScore,
                            user_vote: newVote as 'up' | 'down' | null | undefined
                        };
                    }
                    if (c.replies) {
                        return { ...c, replies: updateVoteInTree(c.replies) };
                    }
                    return c;
                });
            };
            return updateVoteInTree(prevComments);
        });

        try {
            await axios.post(`/comments/${commentId}/vote`, { type });
        } catch (err) {
            console.error("Vote failed", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent, parentId: number | null = null) => {
        e.preventDefault();
        const text = parentId ? replyContent : content;

        if (!text.trim() || !user) return;

        setIsSubmitting(true);
        setError(null);
        setStatusMessage(null);

        try {
            const res = await axios.post(`/comments`, {
                commentable_id: commentableId,
                commentable_type: commentableType,
                content: text,
                parent_id: parentId
            });

            const data = res.data.data || res.data;

            // Check specifically for pending status
            if (data.status === 'pending') {
                setStatusMessage({
                    text: "Your comment is under review. To ensure quality discussion, the first 3 comments from new members are moderated. Thank you for your patience!",
                    type: 'warning'
                });
            } else {
                setStatusMessage({ text: "Comment posted successfully!", type: 'success' });
            }

            // Refresh comments without signal (user-initiated action)
            await fetchComments();

            if (parentId) {
                setReplyingTo(null);
                setReplyContent("");
            } else {
                setContent("");
            }
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || "Something went wrong.";
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div id="comments" className="max-w-4xl mx-auto py-12 px-4">
            <div className="mb-8">
                <span className="text-tp-accent font-bold tracking-[0.15em] text-[10px] uppercase mb-2 block">
                    COMMUNITY
                </span>
                <h3 className="font-display text-[24px] font-bold text-white uppercase tracking-[0.05em] flex items-center gap-3">
                    DISCUSSION
                    <span className="text-[#71717A] text-[16px] font-normal tracking-normal">({comments.length})</span>
                </h3>
            </div>

            {/* Main Comment Form */}
            <div className="relative overflow-hidden bg-[#0B0E14]/80 backdrop-blur-md border border-[#161B22] rounded-[24px] p-6 md:p-8 mb-10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 left-[25%] w-[50%] h-[1px] bg-gradient-to-r from-transparent via-[#FC4100]/40 to-transparent" />
                <div className="absolute -top-[100px] -right-[50px] w-[250px] h-[250px] bg-[#FC4100]/5 blur-[80px] rounded-full pointer-events-none" />

                {isAuthLoading ? (
                    <div className="flex gap-4 animate-pulse relative z-10">
                        <div className="w-10 h-10 rounded-full bg-white/5" />
                        <div className="flex-1 space-y-3">
                            <div className="h-10 w-full bg-white/5 rounded-lg" />
                            <div className="h-8 w-32 bg-white/5 rounded-lg" />
                        </div>
                    </div>
                ) : user ? (
                    <form onSubmit={(e) => handleSubmit(e)} className="relative z-10">
                        <div className="flex gap-4">
                            <div className="hidden sm:block shrink-0 w-10 h-10 rounded-full overflow-hidden bg-[#1A1F26] ring-2 ring-white/5">
                                {user.avatar_url ? (
                                    <Image src={user.avatar_url} alt={user.username} width={40} height={40} className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-tp-accent">
                                        {user?.username?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="What are your thoughts? (You'll earn 10 XP!)"
                                    className="w-full bg-[#05070A] border border-[#161B22] rounded-xl p-4 text-[14px] text-white focus:outline-none focus:border-tp-accent/50 transition-all min-h-[100px] resize-y placeholder:text-[#71717A]"
                                    required
                                />
                                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                                {statusMessage && (
                                    <div className={`mt-3 p-3 rounded-lg text-sm border ${statusMessage.type === 'warning'
                                        ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                                        : 'bg-green-500/10 border-green-500/20 text-green-500'
                                        }`}>
                                        {statusMessage.text}
                                    </div>
                                )}
                                <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                    <p className="text-[11px] text-[#71717A]">Remember to be respectful and follow our guidelines.</p>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !content.trim()}
                                        className="bg-tp-accent hover:bg-tp-accent-hover text-white px-8 h-[42px] rounded font-bold transition-colors uppercase tracking-[0.08em] text-[12px] flex items-center justify-center shadow-lg shadow-tp-accent/20 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                                    >
                                        {isSubmitting ? "POSTING..." : "POST COMMENT"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="text-center py-8 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-tp-accent/10 border border-tp-accent/20 flex items-center justify-center mx-auto mb-5">
                            <Gamepad2 className="w-6 h-6 text-tp-accent" />
                        </div>
                        <h4 className="font-display text-[20px] font-bold text-white uppercase tracking-[0.05em] mb-2">Join the conversation</h4>
                        <p className="text-[#A1A1AA] text-[14px] mb-7 max-w-md mx-auto leading-relaxed">You must be logged in to leave a comment, like posts, and earn community XP.</p>
                        <div className="flex justify-center gap-3">
                            <Link
                                href="/login?redirect=back"
                                className="border border-[#161B22] hover:border-tp-accent/40 text-[#A1A1AA] hover:text-white px-8 h-[42px] rounded font-bold transition-colors uppercase tracking-[0.08em] text-[12px] flex items-center justify-center"
                            >
                                LOG IN
                            </Link>
                            <Link
                                href="/register?redirect=back"
                                className="bg-tp-accent hover:bg-tp-accent-hover text-white px-8 h-[42px] rounded font-bold transition-colors uppercase tracking-[0.08em] text-[12px] flex items-center justify-center shadow-lg shadow-tp-accent/20"
                            >
                                SIGN UP
                            </Link>
                        </div>
                    </div>
                )}
            </div>



            {/* Comment List */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-tp-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#71717A]">Loading discussion...</p>
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
                            handleVote={handleVote}
                            isSubmitting={isSubmitting}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-[#0B0E14]/40 rounded-[24px] border border-dashed border-[#161B22]">
                    <MessageSquare className="w-10 h-10 text-[#71717A] mx-auto mb-4 opacity-40" />
                    <p className="text-[#A1A1AA] font-bold text-[14px] uppercase tracking-wider">No comments yet</p>
                    <p className="text-[#71717A] text-[13px] mt-1.5">Be the first to share your thoughts!</p>
                </div>
            )}
        </div>
    );
}

// PERFORMANCE: Memoized component to prevent unnecessary re-renders
interface CommentItemProps {
    comment: Comment;
    depth?: number;
    user: User | null;
    replyingTo: number | null;
    setReplyingTo: (id: number | null) => void;
    replyContent: string;
    setReplyContent: (content: string) => void;
    handleSubmit: (e: React.FormEvent, parentId: number | null) => void;
    handleVote: (id: number, type: 'up' | 'down') => void;
    isSubmitting: boolean;
}

const CommentItem = memo(function CommentItem({
    comment,
    depth = 0,
    user,
    replyingTo,
    setReplyingTo,
    replyContent,
    setReplyContent,
    handleSubmit,
    handleVote,
    isSubmitting
}: CommentItemProps) {
    const displayName = decodeHtml(comment.user.name || comment.user.username);
    const isStaff = comment.user.role === 'admin' || comment.user.role === 'editor';
    const isOwner = user?.id === comment.user.id;

    return (
        <div className={`group animate-fade-in-up ${depth > 0 ? 'mt-4' : ''}`}>
            <div className="flex gap-4">
                {/* Avatar */}
                <Link href={`/profile/${comment.user.username}`} className="shrink-0 relative">
                    <div className={`w-10 h-10 rounded-full overflow-hidden bg-[#1A1F26] ring-2 transition-all ${isStaff ? 'ring-tp-accent shadow-[0_0_10px_rgba(252,65,0,0.5)]' : 'ring-transparent group-hover:ring-white/20'}`}>
                        {comment.user.avatar_url ? (
                            <Image src={comment.user.avatar_url} alt={comment.user.username} width={40} height={40} className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-tp-accent text-lg">
                                {comment.user?.username?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                        )}
                    </div>
                </Link>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1.5">
                        <Link href={`/profile/${comment.user.username}`} className={`font-bold text-sm hover:underline ${isStaff ? 'text-tp-accent' : 'text-white'}`}>
                            {displayName}
                        </Link>

                        {/* Staff Badge */}
                        {isStaff && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-tp-accent/10 text-tp-accent border border-tp-accent/20 uppercase tracking-wide">
                                <ShieldCheck className="w-3 h-3" />
                                Staff
                            </span>
                        )}

                        {/* Rank Badge */}
                        {comment.user.rank && !isStaff && (
                            <span
                                className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#0B0E14] text-[#71717A] border border-[#161B22]"
                                style={{ color: comment.user.rank.color }}
                            >
                                {comment.user.rank.name}
                            </span>
                        )}

                        <span className="text-[11px] text-[#71717A] font-bold uppercase tracking-wider" suppressHydrationWarning>• {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                    </div>

                    <div className={`text-[#A1A1AA] leading-relaxed text-sm ${depth === 0 ? 'text-base' : ''}`}>
                        {decodeHtml(comment.content)}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-3">
                        {/* Vote Pill */}
                        <div className="flex items-center gap-1 bg-[#05070A] rounded-lg p-0.5 border border-[#161B22]">
                            <button
                                onClick={() => handleVote(comment.id, 'up')}
                                className={`p-1 rounded hover:bg-green-500/10 transition-colors ${comment.user_vote === 'up' ? 'text-green-500' : 'text-[#71717A] hover:text-green-400'}`}
                                title="Upvote"
                            >
                                <ChevronUp className="w-4 h-4" />
                            </button>
                            <span className={`text-xs font-bold min-w-[16px] text-center ${comment.user_vote === 'up' ? 'text-green-500' : comment.user_vote === 'down' ? 'text-red-500' : 'text-[#A1A1AA]'}`}>
                                {comment.score || 0}
                            </span>
                            <button
                                onClick={() => handleVote(comment.id, 'down')}
                                className={`p-1 rounded hover:bg-red-500/10 transition-colors ${comment.user_vote === 'down' ? 'text-red-500' : 'text-[#71717A] hover:text-red-400'}`}
                                title="Downvote"
                            >
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>

                        <button
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#71717A] hover:text-tp-accent transition-colors"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Reply
                        </button>

                        {isOwner && (
                            <button className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] hover:text-red-500 transition-colors">
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
                                        className="w-full bg-[#05070A] border border-[#161B22] rounded-xl p-3 pr-12 text-sm text-white focus:outline-none focus:border-tp-accent/50 min-h-[60px] resize-y placeholder:text-[#71717A]"
                                        autoFocus
                                        required
                                    />
                                    <Button
                                        type="submit"
                                        size="sm"
                                        variant="ghost"
                                        className="absolute bottom-2 right-2 hover:bg-tp-accent hover:text-white"
                                        disabled={isSubmitting || !replyContent.trim()}
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex justify-end mt-2">
                                    <button
                                        type="button"
                                        className="text-xs text-[#71717A] hover:text-white"
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
                            <div className="absolute top-0 bottom-0 left-[-26px] w-[2px] bg-[#161B22] hover:bg-tp-accent/50 transition-colors" />

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
                                        handleVote={handleVote}
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
});
