"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MessageCircle, MessagesSquare, MessageSquare, Reply } from "lucide-react";
import { decodeHtml } from "@/lib/decode";

interface ForumThread {
    id: number;
    title: string;
    slug: string;
    posts_count: number;
}

const ICONS = [MessageCircle, MessagesSquare, MessageSquare, Reply];
const ICON_COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#10b981'];

export default function ActiveDiscussionsWidget() {
    const [threads, setThreads] = useState<ForumThread[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/proxy/forum/active`);
                if (res.ok) {
                    const data = await res.json();
                    setThreads((Array.isArray(data) ? data : data.data || []).slice(0, 4));
                }
            } catch {}
            finally { setLoading(false); }
        }
        load();
    }, []);

    if (!loading && threads.length === 0) return null;

    return (
        <div className="rounded-xl overflow-hidden relative" style={{
            background: 'linear-gradient(180deg, #061830 0%, #041225 100%)',
            border: '1px solid #0d2444',
        }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '28px', height: '2px', background: 'var(--accent)' }} />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #0d2444' }}>
                <div className="flex items-center gap-2.5">
                    <div className="w-[3px] h-4 rounded-full" style={{ background: 'var(--accent, #f97316)' }} />
                    <h3 className="text-white text-[11px] font-black uppercase tracking-[0.14em]">
                        Active Discussions
                    </h3>
                </div>
                <Link href="/forum" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    View Forum <ArrowRight className="w-3 h-3" />
                </Link>
            </div>

            {/* List */}
            <div className="py-1">
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-start gap-3 px-4 py-3.5 animate-pulse">
                            <div className="rounded-md flex-shrink-0 mt-0.5" style={{ width: '20px', height: '20px', background: 'rgba(255,255,255,0.06)' }} />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 rounded w-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                                <div className="h-3 rounded w-4/5" style={{ background: 'rgba(255,255,255,0.06)' }} />
                                <div className="h-2 rounded w-1/4" style={{ background: 'rgba(255,255,255,0.04)' }} />
                            </div>
                        </div>
                    ))
                    : threads.map((thread, idx) => {
                        const Icon = ICONS[idx % ICONS.length];
                        const iconColor = ICON_COLORS[idx % ICON_COLORS.length];

                        return (
                            <Link
                                key={thread.id}
                                href={`/forum/thread/${thread.slug}`}
                                className="group flex items-start gap-3 py-3 transition-all"
                                style={{
                                    borderLeft: '2px solid transparent',
                                    paddingLeft: '14px',
                                    paddingRight: '14px',
                                    transition: 'all 0.12s',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = '#051830';
                                    e.currentTarget.style.borderLeftColor = 'rgba(252,65,0,0.5)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.borderLeftColor = 'transparent';
                                }}
                            >
                                {/* Colored icon badge */}
                                <div className="flex-shrink-0 flex items-center justify-center rounded-md mt-0.5" style={{
                                    width: '22px',
                                    height: '22px',
                                    background: `${iconColor}18`,
                                    border: `1px solid ${iconColor}35`,
                                }}>
                                    <Icon style={{ width: '11px', height: '11px', color: iconColor, strokeWidth: 2 }} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="font-medium leading-snug line-clamp-2 group-hover:text-white transition-colors" style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.82)', lineHeight: '1.4' }}>
                                        {decodeHtml(thread.title)}
                                    </div>
                                    <div className="mt-1 flex items-center gap-1.5">
                                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', fontWeight: 600 }}>
                                            {thread.posts_count || 0} replies
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                }
            </div>
        </div>
    );
}
