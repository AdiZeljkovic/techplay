"use client";

import useSWR, { mutate } from "swr";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useState, useMemo, useEffect, useRef } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Mail, Search, Send, User, MoreVertical, Trash2, ArrowLeft, UserX, Trash } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface UserLight {
    id: number;
    username: string;
    avatar_url?: string;
    display_name?: string;
}

interface Message {
    id: number;
    parent_id?: number | null;
    sender_id: number;
    receiver_id: number;
    sender: UserLight;
    receiver: UserLight;
    subject: string;
    body: string;
    is_read: boolean;
    created_at: string;
}

export default function MessagesPage() {
    const { user, isLoading: isAuthLoading } = useAuth({ middleware: 'auth' });
    const { data: messagesData, error, isLoading } = useSWR<{ data: Message[] }>('/messages', fetcher, { refreshInterval: 5000 });

    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Group messages by conversation (Other User)
    const conversations = useMemo(() => {
        if (!messagesData?.data || !user) return [];

        const groups: { [key: number]: { user: UserLight, messages: Message[], lastMessage: Message, unreadCount: number } } = {};

        messagesData.data.forEach(msg => {
            const isMeSender = msg.sender_id === user.id;
            const otherUser = isMeSender ? msg.receiver : msg.sender;

            // Safety check if user relations are missing
            if (!otherUser) return;

            if (!groups[otherUser.id]) {
                groups[otherUser.id] = {
                    user: otherUser,
                    messages: [],
                    lastMessage: msg,
                    unreadCount: 0
                };
            }

            groups[otherUser.id].messages.push(msg);

            // Update last message if this one is newer
            if (new Date(msg.created_at) > new Date(groups[otherUser.id].lastMessage.created_at)) {
                groups[otherUser.id].lastMessage = msg;
            }

            if (!isMeSender && !msg.is_read) {
                groups[otherUser.id].unreadCount++;
            }
        });

        // Convert to array and sort by last message date
        return Object.values(groups).sort((a, b) =>
            new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
        );
    }, [messagesData, user]);

    // Active Conversation
    const activeConversation = useMemo(() => {
        if (!selectedUserId) return null;
        return conversations.find(c => c.user.id === selectedUserId);
    }, [conversations, selectedUserId]);

    // Sorted messages for active chat
    const activeMessages = useMemo(() => {
        if (!activeConversation) return [];
        return [...activeConversation.messages].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
    }, [activeConversation]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [activeMessages, selectedUserId]);

    // Mark as read when opening conversation
    useEffect(() => {
        if (activeConversation && activeConversation.unreadCount > 0) {
            // Find unread messages from other user
            const unreadIds = activeConversation.messages
                .filter(m => m.receiver_id === user?.id && !m.is_read)
                .map(m => m.id);

            if (unreadIds.length > 0) {
                unreadIds.forEach(id => {
                    axios.patch(`/messages/${id}/read`).catch(console.error);
                });
                // Re-fetch to clear badges
                mutate('/messages');
            }
        }
    }, [selectedUserId, activeConversation, user]);

    // Close menu when clicking outside or changing conversation
    useEffect(() => {
        setShowMenu(false);
    }, [selectedUserId]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUserId || !user) return;

        setIsSending(true);
        try {
            await axios.post('/messages', {
                receiver_username: activeConversation?.user.username,
                subject: 'Chat Message',
                body: newMessage,
            });
            setNewMessage("");
            mutate('/messages');
        } catch (error) {
            console.error("Failed to send", error);
        } finally {
            setIsSending(false);
        }
    };

    const handleBlockUser = async () => {
        if (!activeConversation || !confirm(`Are you sure you want to block ${activeConversation.user.display_name || activeConversation.user.username}?`)) return;

        try {
            await axios.post(`/friends/block/${activeConversation.user.id}`);
            mutate('/messages'); // Refresh messages
            mutate('/friends'); // Refresh friends
            setSelectedUserId(null); // Deselect
            alert("User blocked.");
        } catch (error) {
            console.error(error);
            alert("Failed to block user.");
        }
    };

    const handleDeleteConversation = async () => {
        if (!activeConversation || !confirm("Are you sure you want to delete this conversation? This action cannot be undone.")) return;

        try {
            await axios.delete(`/messages/conversation/${activeConversation.user.id}`);
            mutate('/messages');
            setSelectedUserId(null);
        } catch (error) {
            console.error(error);
            alert("Failed to delete conversation.");
        }
    };

    if (isAuthLoading || isLoading) {
        return (
            <div className="h-screen pt-24 bg-[var(--bg-primary)] flex justify-center items-center">
                <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pt-24 pb-12 flex justify-center">
            {/* Main Container - Fixed Height Widget (Compact) */}
            <div className="container mx-auto px-4 max-w-5xl h-[600px] flex flex-col md:flex-row gap-3">

                {/* 1. SIDEBAR (User List) */}
                <div className={`w-full md:w-1/3 lg:w-1/4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl flex flex-col overflow-hidden
                    ${selectedUserId ? 'hidden md:flex' : 'flex'}
                `}>
                    {/* Sidebar Header */}
                    <div className="p-3 border-b border-[var(--border)] bg-[var(--bg-card)]">
                        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">Messages</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg py-1.5 pl-9 pr-4 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] placeholder-[var(--text-muted)]"
                            />
                        </div>
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {conversations.length === 0 ? (
                            <div className="p-8 text-center text-[var(--text-muted)]">
                                <p>No conversations yet.</p>
                            </div>
                        ) : (
                            conversations.map(chat => (
                                <div
                                    key={chat.user.id}
                                    onClick={() => setSelectedUserId(chat.user.id)}
                                    className={`p-3 border-b border-[var(--border)] cursor-pointer transition-all hover:bg-[var(--bg-elevated)]/30 flex gap-3
                                        ${selectedUserId === chat.user.id ? 'bg-[var(--bg-elevated)]/50 border-l-2 border-l-[var(--accent)]' : 'border-l-2 border-l-transparent'}
                                    `}
                                >
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] overflow-hidden border border-[var(--border)]">
                                            {chat.user.avatar_url ? (
                                                <img src={chat.user.avatar_url} alt={chat.user.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                                                    <User className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                        {chat.unreadCount > 0 && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-[var(--bg-card)]">
                                                {chat.unreadCount}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className={`text-sm font-semibold truncate ${chat.unreadCount > 0 ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                                                {chat.user.display_name || chat.user.username}
                                            </h3>
                                            <span className="text-[10px] text-[var(--text-muted)]">
                                                {formatDistanceToNow(new Date(chat.lastMessage.created_at), { addSuffix: false })}
                                            </span>
                                        </div>
                                        <p className={`text-xs truncate ${chat.unreadCount > 0 ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]'}`}>
                                            {chat.lastMessage.sender_id === user?.id ? 'You: ' : ''}
                                            {chat.lastMessage.body}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 2. MAIN CHAT AREA */}
                <div className={`flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl flex flex-col overflow-hidden relative
                     ${!selectedUserId ? 'hidden md:flex' : 'flex'}
                `}>
                    {!selectedUserId ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] p-8">
                            <div className="w-16 h-16 bg-[var(--bg-elevated)] rounded-full flex items-center justify-center mb-4">
                                <Mail className="w-6 h-6 opacity-50" />
                            </div>
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Select a conversation</h3>
                            <p className="text-sm">Choose a user from the sidebar to start chatting.</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="h-14 px-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-card)]">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setSelectedUserId(null)}
                                        className="md:hidden p-2 -ml-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>

                                    <Link href={`/profile/${activeConversation?.user.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                        <div className="w-9 h-9 rounded-full bg-[var(--bg-primary)] overflow-hidden border border-[var(--border)]">
                                            {activeConversation?.user.avatar_url ? (
                                                <img src={activeConversation?.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                                                    <User className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-[var(--text-primary)] leading-none mb-1">
                                                {activeConversation?.user.display_name || activeConversation?.user.username}
                                            </h3>
                                            <span className="text-[10px] text-[var(--accent)] flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></span>
                                                Online
                                            </span>
                                        </div>
                                    </Link>
                                </div>

                                <div className="relative">
                                    <button
                                        onClick={() => setShowMenu(!showMenu)}
                                        className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-[var(--bg-elevated)]"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>

                                    {/* Dropdown Menu */}
                                    <AnimatePresence>
                                        {showMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl shadow-xl z-50 overflow-hidden"
                                            >
                                                <button
                                                    onClick={handleBlockUser}
                                                    className="w-full text-left px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-card)] flex items-center gap-2"
                                                >
                                                    <UserX className="w-4 h-4 text-red-400" />
                                                    Block User
                                                </button>
                                                <button
                                                    onClick={handleDeleteConversation}
                                                    className="w-full text-left px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-card)] flex items-center gap-2 border-t border-[var(--border)]"
                                                >
                                                    <Trash className="w-4 h-4 text-red-400" />
                                                    Delete Chat
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Messages Scroll Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[var(--bg-primary)]/30">
                                {activeMessages.map((msg, i) => {
                                    const isMe = msg.sender_id === user?.id;
                                    const showAvatar = !isMe && (i === 0 || activeMessages[i - 1].sender_id !== msg.sender_id);

                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex gap-3 max-w-[80%] md:max-w-[70%] ${isMe ? 'flex-row-reverse' : ''}`}>

                                                {/* Avatar (Only for other user) */}
                                                {!isMe && (
                                                    <div className="w-8 h-8 flex-shrink-0">
                                                        {showAvatar && (
                                                            <div className="w-8 h-8 rounded-full bg-[var(--bg-primary)] overflow-hidden border border-[var(--border)]">
                                                                {msg.sender.avatar_url ? (
                                                                    <img src={msg.sender.avatar_url} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]"><User className="w-3 h-3" /></div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Bubble */}
                                                <div className={`group`}>
                                                    <div className={`p-3 px-4 rounded-2xl text-sm leading-relaxed shadow-sm
                                                        ${isMe
                                                            ? 'bg-[var(--accent)] text-white rounded-tr-sm'
                                                            : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-tl-sm border border-[var(--border)]'
                                                        }
                                                    `}>
                                                        {msg.body}
                                                    </div>
                                                    <div className={`text-[10px] text-[var(--text-muted)] mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'text-right' : 'text-left'}`}>
                                                        {format(new Date(msg.created_at), 'MMM d, HH:mm')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-[var(--bg-card)] border-t border-[var(--border)]">
                                <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                                    <div className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl overflow-hidden focus-within:border-[var(--accent)] transition-colors">
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage(e);
                                                }
                                            }}
                                            placeholder="Type a message..."
                                            className="w-full bg-transparent text-[var(--text-primary)] p-3 max-h-32 focus:outline-none resize-none custom-scrollbar placeholder-[var(--text-muted)]"
                                            rows={1}
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={!newMessage.trim() || isSending}
                                        className="h-12 w-12 rounded-xl flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-lg shadow-[var(--accent)]/20"
                                    >
                                        {isSending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5 text-white" />}
                                    </Button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
