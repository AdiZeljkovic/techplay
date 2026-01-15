"use client";

import useSWR, { mutate } from "swr";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Mail, MailOpen, User, Reply, Trash2, Loader2, Send, Archive } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { SendMessageModal } from "@/components/messaging/SendMessageModal";
import { motion, AnimatePresence } from "framer-motion";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface Message {
    id: number;
    parent_id?: number | null;
    sender: {
        id: number;
        username: string;
        avatar_url?: string;
    };
    subject: string;
    body: string;
    is_read: boolean;
    created_at: string;
}

export default function MessagesPage() {
    const { user, isLoading: isAuthLoading } = useAuth({ middleware: 'auth' });
    const { data: messagesData, error, isLoading } = useSWR<{ data: Message[] }>('/messages', fetcher);

    // Reply State
    const [replyState, setReplyState] = useState<{ open: boolean; username: string; messageId?: number; subject?: string }>({
        open: false,
        username: '',
    });

    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Mark as read
    const handleRead = async (id: number, isRead: boolean) => {
        if (isRead) return;
        // Optimistic update could go here
        try {
            await axios.patch(`/messages/${id}/read`);
            mutate('/messages');
        } catch (error) {
            console.error("Failed to mark read", error);
        }
    };

    // Handle Delete
    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this message?")) return;

        setDeletingId(id);
        try {
            await axios.delete(`/messages/${id}`);
            mutate('/messages');
        } catch (error) {
            console.error("Failed to delete message", error);
        } finally {
            setDeletingId(null);
        }
    };

    const openReplyModal = (e: React.MouseEvent, msg: Message) => {
        e.stopPropagation();
        setReplyState({
            open: true,
            username: msg.sender.username,
            messageId: msg.id,
            subject: msg.subject
        });
    };

    if (isAuthLoading || isLoading) {
        return (
            <div className="min-h-screen pt-24 bg-[#020617] flex justify-center items-center">
                <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    const messages = messagesData?.data || [];
    const unreadCount = messages.filter(m => !m.is_read).length;

    return (
        <div className="min-h-screen bg-[#020617] pt-24 pb-20 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#001540] to-transparent opacity-40 pointer-events-none" />
            <div className="fixed -top-40 right-0 w-[500px] h-[500px] bg-[var(--accent)]/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 max-w-5xl relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-5xl font-black text-white tracking-tighter mb-4">
                            Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-purple-500">Center</span>
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl">
                            Manage your communications, coordinate with your squad, and stay updated.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3 shadow-lg">
                            <div className="relative">
                                <Mail className={`w-5 h-5 ${unreadCount > 0 ? 'text-[var(--accent)]' : 'text-gray-400'}`} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--accent)]"></span>
                                    </span>
                                )}
                            </div>
                            <span className="font-mono text-sm font-bold text-gray-200">
                                {unreadCount} <span className="text-gray-500 font-normal">Unread</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Messages List */}
                <div className="grid gap-4">
                    <AnimatePresence mode="popLayout">
                        {messages.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="col-span-full py-32 flex flex-col items-center justify-center text-center bg-white/5 border-2 border-dashed border-white/10 rounded-3xl"
                            >
                                <div className="w-24 h-24 bg-[#001540] rounded-full flex items-center justify-center mb-6 shadow-inner ring-1 ring-white/10">
                                    <Archive className="w-10 h-10 text-gray-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">No transmissions</h3>
                                <p className="text-gray-500 max-w-md">Your frequency is clear. We'll alert you when new comms arrive.</p>
                            </motion.div>
                        ) : (
                            messages.map((message, index) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05 }}
                                    layout
                                    onClick={() => handleRead(message.id, message.is_read)}
                                    className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer
                                        ${message.is_read
                                            ? 'bg-[#0B1221]/80 border-white/5 hover:border-white/10 hover:bg-[#0F172A]'
                                            : 'bg-[var(--bg-elevated)]/40 border-[var(--accent)]/30 shadow-[0_0_30px_-10px_rgba(var(--accent-rgb),0.15)] hover:border-[var(--accent)]/50'
                                        }`}
                                >
                                    {/* Unread Glow Line */}
                                    {!message.is_read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[var(--accent)] to-purple-500 shadow-[0_0_15px_var(--accent)]" />
                                    )}

                                    <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start">

                                        {/* Avatar Column */}
                                        <div className="flex-shrink-0">
                                            <Link href={`/profile/${message.sender.username}`} onClick={e => e.stopPropagation()}>
                                                <div className="relative group/avatar">
                                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300
                                                        ${message.is_read ? 'grayscale opacity-70 group-hover/avatar:grayscale-0 group-hover/avatar:opacity-100' : 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[#020617] shadow-lg shadow-[var(--accent)]/20'}`}
                                                    >
                                                        {message.sender.avatar_url ? (
                                                            <img src={message.sender.avatar_url} alt={message.sender.username} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-gray-500">
                                                                <User className="w-7 h-7" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>

                                        {/* Content Column */}
                                        <div className="flex-1 w-full min-w-0">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-3 mb-1.5">
                                                        <h3 className={`text-xl font-bold truncate ${message.is_read ? 'text-gray-200' : 'text-white'}`}>
                                                            {message.subject}
                                                        </h3>
                                                        {!message.is_read && (
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--accent)] text-white uppercase tracking-wider shadow shadow-[var(--accent)]/40">
                                                                New
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                                                        <span className="text-[var(--accent)]">@{message.sender.username}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                                                        <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
                                                    </div>
                                                </div>

                                                {/* Desktop Actions */}
                                                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-4 group-hover:translate-x-0">
                                                    <button
                                                        onClick={(e) => handleDelete(message.id, e)}
                                                        disabled={deletingId === message.id}
                                                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        {deletingId === message.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Preview/Body */}
                                            <div className={`mt-4 p-4 rounded-xl border transition-colors
                                                ${message.is_read ? 'bg-white/5 border-white/5 text-gray-400' : 'bg-[#001540]/50 border-white/10 text-gray-300'}`}
                                            >
                                                <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base line-clamp-3 group-hover:line-clamp-none transition-all">
                                                    {message.body}
                                                </p>
                                            </div>

                                            {/* Mobile/Tablet Inline Actions */}
                                            <div className="mt-4 flex justify-end gap-3">
                                                <Button
                                                    size="sm"
                                                    onClick={(e) => openReplyModal(e, message)}
                                                    className="bg-white/10 hover:bg-[var(--accent)] hover:text-white border-white/5 text-gray-300 backdrop-blur-sm"
                                                >
                                                    <Reply className="w-4 h-4 mr-2" />
                                                    Reply
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <SendMessageModal
                isOpen={replyState.open}
                onClose={() => setReplyState({ ...replyState, open: false })}
                recipientUsername={replyState.username}
                replyToMessageId={replyState.messageId}
                initialSubject={replyState.subject}
            />
        </div>
    );
}
