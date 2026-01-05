"use client";

import useSWR, { mutate } from "swr";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth"; // Might need to ensure user is logged in
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Mail, MailOpen, User, Reply, Trash2, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { SendMessageModal } from "@/components/messaging/SendMessageModal";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface Message {
    id: number;
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

    // State for Reply Modal
    const [replyToUser, setReplyToUser] = useState<string | null>(null);

    // Mark as read
    const handleRead = async (id: number, isRead: boolean) => {
        if (isRead) return;
        try {
            await axios.patch(`/messages/${id}/read`);
            mutate('/messages'); // Refresh list
        } catch (error) {
            console.error("Failed to mark read", error);
        }
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
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Inbox</h1>
                        <p className="text-[var(--text-secondary)]">
                            You have <span className="text-[var(--accent)] font-bold">{messages.filter(m => !m.is_read).length}</span> unread messages
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center py-20 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
                            <Mail className="w-16 h-16 mx-auto text-[var(--text-muted)] mb-4" />
                            <h3 className="text-xl font-medium text-[var(--text-primary)]">No messages yet</h3>
                            <p className="text-[var(--text-secondary)] mt-2">When people send you messages, they'll appear here.</p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`group bg-[var(--bg-card)] border rounded-xl overflow-hidden transition-all duration-200
                                    ${message.is_read
                                        ? 'border-[var(--border)] opacity-80 hover:opacity-100'
                                        : 'border-[var(--accent)] shadow-[0_0_10px_rgba(var(--accent-rgb),0.15)] ring-1 ring-[var(--accent)]/20'
                                    }`}
                            >
                                {/* Header / Preview */}
                                <div
                                    onClick={() => handleRead(message.id, message.is_read)}
                                    className="p-5 cursor-pointer flex flex-col md:flex-row gap-4 md:items-center justify-between hover:bg-[var(--bg-elevated)] transition-colors"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        {/* Sender Avatar */}
                                        <Link href={`/profile/${message.sender.username}`} onClick={(e) => e.stopPropagation()}>
                                            <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center overflow-hidden">
                                                {message.sender.avatar_url ? (
                                                    <img src={message.sender.avatar_url} alt={message.sender.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-5 h-5 text-[var(--text-muted)]" />
                                                )}
                                            </div>
                                        </Link>

                                        <div>
                                            <h4 className={`font-semibold text-lg ${message.is_read ? 'text-[var(--text-primary)]' : 'text-[var(--accent)]'}`}>
                                                {message.subject}
                                            </h4>
                                            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mt-1">
                                                <span>From</span>
                                                <Link href={`/profile/${message.sender.username}`} onClick={(e) => e.stopPropagation()} className="hover:text-[var(--accent)] hover:underline">
                                                    {message.sender.username}
                                                </Link>
                                                <span>•</span>
                                                <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {!message.is_read && (
                                            <div className="px-3 py-1 rounded-full bg-[var(--accent)] text-black text-xs font-bold uppercase tracking-wider">
                                                New
                                            </div>
                                        )}
                                        {message.is_read && (
                                            <MailOpen className="w-5 h-5 text-[var(--text-muted)]" />
                                        )}
                                    </div>
                                </div>

                                {/* Body (Expanded details - simplified here to always show for now, or just show body normally) */}
                                {/* For better UX, let's just show the body inside nicely, maybe hidden if too long? 
                                    Or simpler: Just show the body block. */}
                                <div className="px-5 pb-5 pl-[4.5rem] pt-2">
                                    <p className="text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                                        {message.body}
                                    </p>

                                    <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => setReplyToUser(message.sender.username)}
                                        >
                                            <Reply className="w-4 h-4 mr-2" />
                                            Reply
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {replyToUser && (
                <SendMessageModal
                    isOpen={!!replyToUser}
                    onClose={() => setReplyToUser(null)}
                    recipientUsername={replyToUser}
                />
            )}
        </div>
    );
}
