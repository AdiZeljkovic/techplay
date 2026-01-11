"use client";

import useSWR, { mutate } from "swr";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Mail, MailOpen, User, Reply, Trash2, Loader2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { SendMessageModal } from "@/components/messaging/SendMessageModal";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface Message {
    id: number;
    parent_id?: number | null;
    sender: {
        id: number;
        username: string;
        avatar_url?: string; // Assuming we fixed this in backend or handle it safely
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
            alert("Failed to delete message");
        } finally {
            setDeletingId(null);
        }
    };

    const openReplyModal = (e: React.MouseEvent, msg: Message) => {
        e.stopPropagation();
        setReplyState({
            open: true,
            username: msg.sender.username,
            messageId: msg.id, // Threading: Reply to this ID (which acts as parent)
            subject: msg.subject
        });
    };

    if (isAuthLoading || isLoading) {
        return (
            <div className="min-h-screen pt-24 bg-[var(--bg-primary)] flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    const messages = messagesData?.data || [];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pt-24 pb-12">

            {/* Ambient Background Glow */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-[var(--accent)]/5 blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 max-w-4xl relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Inbox</h1>
                        <p className="text-[var(--text-secondary)] text-lg">
                            Keep up with your <span className="text-[var(--accent)] font-bold">Game Comms</span>
                        </p>
                    </div>
                    <div className="bg-[var(--bg-elevated)] px-4 py-2 rounded-full border border-[var(--border)] flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[var(--accent)]" />
                        <span className="text-sm font-bold text-white">{messages.filter(m => !m.is_read).length} Unread</span>
                    </div>
                </div>

                <div className="space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center py-24 bg-[var(--bg-card)]/50 backdrop-blur-sm rounded-3xl border border-[var(--border)] dashed-border">
                            <div className="w-20 h-20 mx-auto bg-[var(--bg-elevated)] rounded-full flex items-center justify-center mb-6">
                                <Mail className="w-8 h-8 text-[var(--text-muted)]" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">No messages yet</h3>
                            <p className="text-[var(--text-secondary)] max-w-sm mx-auto">Your inbox is empty. Waiting for the squad to ping you.</p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`group relative bg-[var(--bg-card)] border rounded-2xl overflow-hidden transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl
                                    ${message.is_read
                                        ? 'border-[var(--border)]/50 opacity-90'
                                        : 'border-[var(--accent)]/50 shadow-[0_4px_20px_rgba(var(--accent-rgb),0.1)]'
                                    }`}
                            >
                                {/* Left Accent Bar for Unread */}
                                {!message.is_read && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent)]" />
                                )}

                                <div
                                    onClick={() => handleRead(message.id, message.is_read)}
                                    className="p-6 cursor-pointer"
                                >
                                    <div className="flex flex-col md:flex-row gap-6">

                                        {/* Avatar Section */}
                                        <div className="flex-shrink-0">
                                            <Link href={`/profile/${message.sender.username}`} onClick={(e) => e.stopPropagation()}>
                                                <div className="relative">
                                                    <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] border-2 border-[var(--border)] flex items-center justify-center overflow-hidden hover:border-[var(--accent)] transition-colors">
                                                        {message.sender.avatar_url ? (
                                                            <img src={message.sender.avatar_url} alt={message.sender.username} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-6 h-6 text-[var(--text-muted)]" />
                                                        )}
                                                    </div>
                                                    {!message.is_read && (
                                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--accent)]"></span>
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>
                                        </div>

                                        {/* Content Section */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h4 className={`text-lg font-bold truncate pr-4 ${message.is_read ? 'text-[var(--text-primary)]' : 'text-white'}`}>
                                                        {message.subject}
                                                    </h4>
                                                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                                        <span>from</span>
                                                        <Link href={`/profile/${message.sender.username}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-[var(--accent)] hover:underline">
                                                            @{message.sender.username}
                                                        </Link>
                                                        <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                                                        <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="hover:bg-red-500/10 hover:text-red-500 text-[var(--text-muted)] h-9 w-9 p-0 rounded-full"
                                                        onClick={(e) => handleDelete(message.id, e)}
                                                        disabled={deletingId === message.id}
                                                    >
                                                        {deletingId === message.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Message Body Preview */}
                                            <div className="bg-[var(--bg-elevated)]/50 rounded-xl p-4 mt-3 border border-[var(--border)]">
                                                <p className="text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                                                    {message.body}
                                                </p>
                                            </div>

                                            <div className="mt-4 flex justify-end">
                                                <Button
                                                    size="sm"
                                                    className="bg-[var(--bg-elevated)] hover:bg-[var(--accent)] hover:text-black transition-all border border-[var(--border)] group-hover:border-[var(--accent)]/50"
                                                    onClick={(e) => openReplyModal(e, message)}
                                                >
                                                    <Reply className="w-4 h-4 mr-2" />
                                                    Reply
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <SendMessageModal
                isOpen={replyState.open}
                onClose={() => setReplyState({ ...replyState, open: false })}
                recipientUsername={replyState.username}
                replyToMessageId={replyState.messageId} // Passing parent ID
                initialSubject={replyState.subject}
            />
        </div>
    );
}
