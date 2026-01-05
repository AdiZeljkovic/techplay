"use client";

import useSWR, { mutate } from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Share2, Flag, Lock, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface User {
    id: number;
    username: string;
    avatar_url?: string;
    rank?: {
        name: string;
        color: string;
        icon?: string;
    };
}

interface Post {
    id: number;
    content: string;
    created_at: string;
    is_solution: boolean;
    author: User;
}

interface Thread {
    id: number;
    slug: string;
    title: string;
    content: string;
    is_locked: boolean;
    is_pinned: boolean; // Add is_pinned to interface
    created_at: string;
    author: User;
    category: {
        title: string;
        slug: string;
        color: string;
    };
    view_count: number;
    posts_count: number;
}

interface ThreadData {
    thread: Thread;
    posts: {
        data: Post[];
        links: any[]; // Pagination
    };
}

export default function ThreadPage() {
    const params = useParams();
    const slug = params.slug as string;
    const { user } = useAuth({ middleware: 'guest' }); // Allow guests to view
    const [replyContent, setReplyContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data, isLoading } = useSWR<ThreadData>(slug ? `/forum/threads/${slug}` : null, fetcher);

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await axios.post(`/forum/threads/${slug}/posts`, {
                content: replyContent
            });
            setReplyContent("");
            mutate(`/forum/threads/${slug}`); // Refresh data
        } catch (error) {
            console.error("Failed to reply", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="animate-pulse h-screen bg-white/5 mx-auto max-w-4xl mt-8 rounded-xl"></div>;
    if (!data) return <div className="text-center py-12 text-gray-500">Thread not found</div>;

    const { thread, posts } = data;

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Breadcrumb / Header */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                <Link href="/forum" className="hover:text-white">Forum</Link>
                <span>/</span>
                <Link href={`/forum/${thread.category.slug}`} className="hover:text-white" style={{ color: thread.category.color }}>
                    {thread.category.title}
                </Link>
            </div>

            {/* OP Post */}
            <div className="glass-panel border-white/10 rounded-xl overflow-hidden">
                <div className="bg-white/5 p-6 border-b border-white/5 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-white mb-2 leading-tight">
                            {thread.title}
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>
                                Posted by <span className="text-white font-medium">{thread.author.username}</span>
                            </span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(thread.created_at))} ago</span>
                            <span>•</span>
                            <span>{thread.view_count} views</span>
                        </div>
                    </div>
                    {thread.is_locked && (
                        <div className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> LOCKED
                        </div>
                    )}
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Author Sidebar */}
                    <div className="md:col-span-3 text-center space-y-4 border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0">
                        <div className="w-24 h-24 mx-auto rounded-full bg-white/10 p-1 relative">
                            <img
                                src={thread.author.avatar_url || `https://ui-avatars.com/api/?name=${thread.author.username}&background=random`}
                                alt={thread.author.username}
                                className="w-full h-full object-cover rounded-full"
                            />
                            {thread.author.rank && (
                                <div
                                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap border border-white/20 shadow-lg"
                                    style={{ backgroundColor: thread.author.rank.color || '#333' }}
                                >
                                    {thread.author.rank.name}
                                </div>
                            )}
                        </div>
                        <div className="text-gray-400 text-sm">
                            {/* Stats could go here */}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="md:col-span-9 prose prose-invert max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: thread.content }} />
                    </div>
                </div>

                <div className="bg-white/5 p-4 flex justify-end gap-2">
                    <button className="btn btn-ghost btn-sm text-gray-400">
                        <Share2 className="w-4 h-4 mr-2" /> Share
                    </button>
                    <button className="btn btn-ghost btn-sm text-gray-400">
                        <Flag className="w-4 h-4 mr-2" /> Report
                    </button>
                </div>
            </div>

            {/* Replies */}
            <div className="space-y-4">
                {posts.data.map((post) => (
                    <div key={post.id} className="glass-panel border-white/5 rounded-xl overflow-hidden p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
                        {/* Author Sidebar reuse */}
                        <div className="md:col-span-3 text-center space-y-4 border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0">
                            <div className="w-16 h-16 mx-auto rounded-full bg-white/10 p-1 relative">
                                <img
                                    src={post.author.avatar_url || `https://ui-avatars.com/api/?name=${post.author.username}&background=random`}
                                    alt={post.author.username}
                                    className="w-full h-full object-cover rounded-full"
                                />
                                {post.author.rank && (
                                    <div
                                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full whitespace-nowrap border border-white/20 shadow-lg"
                                        style={{ backgroundColor: post.author.rank.color || '#333' }}
                                    >
                                        {post.author.rank.name}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="md:col-span-9 space-y-4">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>{formatDistanceToNow(new Date(post.created_at))} ago</span>
                                {post.is_solution && (
                                    <span className="text-neon-cyan flex items-center gap-1 font-bold">
                                        <Shield className="w-4 h-4" /> Solution
                                    </span>
                                )}
                            </div>
                            <div className="prose prose-invert max-w-none text-gray-300">
                                {post.content}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reply Form */}
            {user ? (
                <div className="glass-panel p-6 rounded-xl border-white/5">
                    <h3 className="text-xl font-bold text-white mb-4">Post a Reply</h3>
                    <form onSubmit={handleReply} className="space-y-4">
                        <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-lg p-4 text-white focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none min-h-[150px]"
                            placeholder="Join the discussion..."
                            disabled={thread.is_locked}
                        />
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting || !replyContent.trim() || thread.is_locked}
                                className="btn btn-primary"
                            >
                                {isSubmitting ? 'Posting...' : 'Post Reply'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="glass-panel p-8 rounded-xl border-white/5 text-center">
                    <h3 className="text-xl font-bold text-white mb-2">Join the conversation</h3>
                    <p className="text-gray-400 mb-6">You must be logged in to reply to this thread.</p>
                    <Link href="/auth/login" className="btn btn-secondary">
                        Log In / Sign Up
                    </Link>
                </div>
            )}
        </div>
    );
}
