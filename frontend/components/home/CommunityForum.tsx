"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

interface ForumThread {
    id: number;
    title: string;
    slug: string;
    posts_count: number;
    updated_at: string;
}

export default function CommunityForum() {
    const [threads, setThreads] = useState<ForumThread[]>([]);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/forum/active?limit=5`)
            .then(r => r.ok ? r.json() : null)
            .then(json => {
                const data = json?.data ?? json;
                if (Array.isArray(data)) setThreads(data.slice(0, 5));
            })
            .catch(() => {});
    }, []);

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    return (
        <aside className="w-full h-full flex flex-col bg-zinc-50/80 dark:bg-[#0B0E14]/80 backdrop-blur-md border border-zinc-200 dark:border-[#161B22] rounded-[24px] p-6 lg:p-8 relative overflow-hidden shadow-sm dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-colors duration-300">
            <div className="absolute top-0 right-[10%] w-[50%] h-[1px] bg-gradient-to-r from-transparent via-[#FC4100]/20 dark:via-[#FC4100]/40 to-transparent" />
            <div className="absolute -top-[100px] -right-[50px] w-[250px] h-[250px] bg-[#FC4100]/10 blur-[80px] rounded-full pointer-events-none" />

            <h2 className="text-[17px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-8 relative z-10">
                JOIN THE COMMUNITY
            </h2>

            <div className="flex flex-col w-full px-1 relative z-10 flex-1">
                {threads.map((thread, i) => (
                    <div key={thread.id} className={`flex-1 py-[16px] flex flex-col justify-center ${i !== threads.length - 1 ? 'border-b border-zinc-200 dark:border-white/[0.04]' : ''}`}>
                        <Link href={`/forum/threads/${thread.slug}`} className="group flex items-center gap-[20px] h-full">
                            <div className="w-[36px] h-[36px] rounded-full bg-white dark:bg-[#1A1F26] border border-zinc-200 dark:border-white/5 flex items-center justify-center text-zinc-500 dark:text-[#8B949E] group-hover:text-[#FC4100] dark:group-hover:text-[#FC4100] hover:border-[#FC4100]/30 transition-colors shrink-0">
                                <MessageSquare className="w-[18px] h-[18px]" />
                            </div>
                            <div className="flex flex-col justify-center min-w-0 flex-1">
                                <h4 className="font-sans font-medium text-[15px] text-zinc-800 dark:text-[#E4E4E5] leading-snug group-hover:text-tp-accent transition-colors mb-[6px] truncate">
                                    {thread.title}
                                </h4>
                                <div className="flex items-center justify-between text-[13px] text-zinc-500 dark:text-[#A1A1AA] w-full">
                                    <span>{thread.posts_count} replies</span>
                                    <span className="text-[12px]">{formatDate(thread.updated_at)}</span>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}

                {threads.length === 0 && (
                    <div className="flex items-center justify-center flex-1 py-8">
                        <p className="text-zinc-500 dark:text-[#8B949E] text-[13px]">Loading discussions...</p>
                    </div>
                )}
            </div>

            <Link
                href="/forum/create"
                className="mt-8 shrink-0 bg-tp-accent hover:bg-tp-accent-hover text-white h-[46px] rounded font-bold transition-colors uppercase tracking-[0.08em] text-[12px] flex items-center justify-center shadow-lg shadow-[#FC4100]/20 relative z-10"
            >
                START A DISCUSSION
            </Link>
        </aside>
    );
}
