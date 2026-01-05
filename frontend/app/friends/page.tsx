"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { UserCheck, UserX, Clock, Users, UserPlus, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface User {
    id: number;
    username: string;
    display_name?: string;
    avatar_url?: string;
    friendship_status?: 'none' | 'friend' | 'sent' | 'received';
}

export default function FriendsPage() {
    const { user } = useAuth({ middleware: 'auth' });
    const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'find'>('friends');
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const { data: friends, isLoading: loadingFriends } = useSWR<User[]>('/friends', fetcher);
    const { data: requests, isLoading: loadingRequests } = useSWR<User[]>('/friends/pending', fetcher);

    // Search Users
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await axios.get(`/friends/search?query=${searchQuery}`);
            setSearchResults(res.data);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSendRequest = async (username: string) => {
        try {
            await axios.post('/friends/request', { username });
            // Update local state for search results
            setSearchResults(prev => prev.map(u =>
                u.username === username ? { ...u, friendship_status: 'sent' } : u
            ));
            alert("Friend request sent!");
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to send request");
        }
    };

    const handleAccept = async (senderId: number) => {
        try {
            await axios.post(`/friends/accept/${senderId}`);
            mutate('/friends');
            mutate('/friends/pending');
        } catch (error) {
            console.error(error);
        }
    };

    const handleDecline = async (senderId: number) => {
        try {
            await axios.post(`/friends/decline/${senderId}`);
            mutate('/friends/pending');
        } catch (error) {
            console.error(error);
        }
    };

    const TabButton = ({ id, label, icon: Icon, count }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-all border-b-2 ${activeTab === id
                    ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-elevated)]/50'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/30'
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
            {count !== undefined && count > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-[var(--accent)] text-black text-xs font-bold">
                    {count}
                </span>
            )}
        </button>
    );

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pt-24 pb-12">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2 flex items-center gap-3">
                        <Users className="w-8 h-8 text-[var(--accent)]" />
                        Social Hub
                    </h1>
                    <p className="text-[var(--text-secondary)]">Manage your friends and discover new players.</p>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm min-h-[500px]">
                    {/* Tabs */}
                    <div className="flex border-b border-[var(--border)] bg-[var(--bg-card)]">
                        <TabButton id="friends" label="My Friends" icon={UserCheck} count={friends?.length} />
                        <TabButton id="pending" label="Requests" icon={Clock} count={requests?.length} />
                        <TabButton id="find" label="Find People" icon={UserPlus} />
                    </div>

                    <div className="p-6 md:p-8">
                        {/* MY FRIENDS TAB */}
                        {activeTab === 'friends' && (
                            <div className="space-y-6">
                                {loadingFriends ? (
                                    <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[var(--accent)]" /></div>
                                ) : friends && friends.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {friends.map((friend) => (
                                            <Link key={friend.id} href={`/profile/${friend.username}`}
                                                className="group flex items-center gap-4 p-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl hover:border-[var(--accent)] transition-all">
                                                <div className="relative">
                                                    <div className="w-12 h-12 rounded-full bg-[var(--bg-primary)] overflow-hidden border border-[var(--border)] group-hover:border-[var(--accent)]">
                                                        <img src={friend.avatar_url || `https://ui-avatars.com/api/?name=${friend.username}&background=random`} alt={friend.username} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--bg-elevated)]" title="Online"></div>
                                                </div>
                                                <div className="overflow-hidden">
                                                    <h3 className="font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)]">
                                                        {friend.display_name || friend.username}
                                                    </h3>
                                                    <span className="text-xs text-[var(--text-muted)]">@{friend.username}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 text-[var(--text-secondary)]">
                                        <Users className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)] opacity-50" />
                                        <h3 className="text-lg font-medium">No friends yet</h3>
                                        <p className="mb-6">Start building your squad by finding people!</p>
                                        <Button onClick={() => setActiveTab('find')}>Find Friends</Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* REQUESTS TAB */}
                        {activeTab === 'pending' && (
                            <div>
                                {loadingRequests ? (
                                    <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[var(--accent)]" /></div>
                                ) : requests && requests.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {requests.map((request) => (
                                            <div key={request.id} className="flex items-center justify-between p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)]">
                                                <Link href={`/profile/${request.username}`} className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-[var(--bg-primary)] overflow-hidden">
                                                        <img src={request.avatar_url || `https://ui-avatars.com/api/?name=${request.username}&background=random`} alt={request.username} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-[var(--text-primary)]">{request.display_name || request.username}</h3>
                                                        <span className="text-xs text-[var(--text-muted)]">@{request.username}</span>
                                                    </div>
                                                </Link>
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={() => handleAccept(request.id)} className="bg-green-600 hover:bg-green-700 text-white">
                                                        <UserCheck className="w-4 h-4 mr-1" /> Accept
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => handleDecline(request.id)} className="text-red-400 border-red-900/50 hover:bg-red-900/20">
                                                        <UserX className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 text-[var(--text-secondary)]">
                                        <Clock className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)] opacity-50" />
                                        <h3 className="text-lg font-medium">No pending requests</h3>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* FIND TAB */}
                        {activeTab === 'find' && (
                            <div className="max-w-2xl mx-auto space-y-8">
                                <form onSubmit={handleSearch} className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                        <Input
                                            placeholder="Search by username..."
                                            className="pl-9 bg-[var(--bg-elevated)] border-[var(--border)]"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <Button type="submit" disabled={isSearching}>
                                        {isSearching ? <Loader2 className="animate-spin" /> : 'Search'}
                                    </Button>
                                </form>

                                <div className="space-y-4">
                                    {searchResults.map((result) => (
                                        <div key={result.id} className="flex items-center justify-between p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)]">
                                            <Link href={`/profile/${result.username}`} className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-[var(--bg-primary)] overflow-hidden">
                                                    <img src={result.avatar_url || `https://ui-avatars.com/api/?name=${result.username}&background=random`} alt={result.username} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-[var(--text-primary)]">{result.display_name || result.username}</h3>
                                                    <span className="text-xs text-[var(--text-muted)]">@{result.username} • Level 1</span>
                                                </div>
                                            </Link>

                                            {result.friendship_status === 'friend' && (
                                                <span className="text-green-500 text-sm font-medium flex items-center gap-1"><UserCheck className="w-4 h-4" /> Friend</span>
                                            )}
                                            {result.friendship_status === 'sent' && (
                                                <span className="text-[var(--text-muted)] text-sm font-medium flex items-center gap-1"><Clock className="w-4 h-4" /> Sent</span>
                                            )}
                                            {result.friendship_status === 'received' && (
                                                <span className="text-yellow-500 text-sm font-medium flex items-center gap-1"><Clock className="w-4 h-4" /> Pending</span>
                                            )}
                                            {(result.friendship_status === 'none' || !result.friendship_status) && (
                                                <Button size="sm" onClick={() => handleSendRequest(result.username)}>
                                                    <UserPlus className="w-4 h-4 mr-2" /> Add Friend
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    {isSearching && <div className="text-center text-[var(--text-muted)]">Searching...</div>}
                                    {!isSearching && searchQuery && searchResults.length === 0 && (
                                        <div className="text-center text-[var(--text-muted)]">No users found.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
