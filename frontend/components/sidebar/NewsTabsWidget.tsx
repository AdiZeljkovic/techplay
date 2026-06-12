"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, TrendingUp, Hash, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { decodeHtml } from "@/lib/decode";
import { Article } from "@/types";

interface NewsTabsWidgetProps {
    latestNews: Article[];
    popularNews: Article[];
}

const CATEGORY_COLOR: Record<string, string> = {
    news:    '#3b82f6',
    reviews: '#f59e0b',
    tech:    '#10b981',
    guides:  '#8b5cf6',
    videos:  '#ec4899',
};

function getCategoryType(item: Article): string {
    return item.category?.type || 'news';
}

function getArticlePath(item: Article): string {
    const t = getCategoryType(item);
    if (t === 'reviews') return `/reviews/${item.slug}`;
    if (t === 'tech')    return `/hardware/${item.slug}`;
    if (t === 'guides')  return `/guides/${item.slug}`;
    return `/news/${item.slug}`;
}

export default function NewsTabsWidget({ latestNews, popularNews }: NewsTabsWidgetProps) {
    const [activeTab, setActiveTab] = useState<"latest" | "popular">("latest");
    const currentData = activeTab === "latest" ? latestNews : popularNews;

    return (
        <div className="rounded-xl overflow-hidden relative" style={{
            background: 'linear-gradient(180deg, #061830 0%, #041225 100%)',
            border: '1px solid #0d2444',
        }}>
            {/* Top accent corner */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: '28px', height: '2px', background: '#FC4100' }} />

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
                <div className="flex items-center gap-2">
                    <div className="w-[3px] h-4 rounded-full" style={{ background: '#FC4100' }} />
                    <span className="text-white font-black uppercase tracking-[0.14em]" style={{ fontSize: '11px' }}>
                        Latest &amp; Popular
                    </span>
                </div>
                {/* Live pulse dot */}
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#22c55e' }} />
                        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#22c55e' }} />
                    </span>
                    <span style={{ fontSize: '9px', color: '#22c55e', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>LIVE</span>
                </div>
            </div>

            {/* Tab switcher — Discord channel-style */}
            <div className="flex gap-1 px-3 pb-2">
                {(['latest', 'popular'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all"
                        style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            background: activeTab === tab ? 'rgba(252,65,0,0.15)' : 'transparent',
                            color: activeTab === tab ? '#FC4100' : 'rgba(255,255,255,0.38)',
                            border: activeTab === tab ? '1px solid rgba(252,65,0,0.3)' : '1px solid transparent',
                        }}
                    >
                        {tab === 'latest' ? <Clock style={{ width: 10, height: 10 }} /> : <TrendingUp style={{ width: 10, height: 10 }} />}
                        {tab}
                    </button>
                ))}
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'linear-gradient(90deg, #0d2444 0%, rgba(13,36,68,0.2) 100%)', marginBottom: '4px' }} />

            {/* Channel list */}
            <div key={activeTab} className="animate-tab-content py-1">
                {currentData.length === 0 && (
                    <div className="px-4 py-6 text-center" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                        No articles found.
                    </div>
                )}
                {currentData.map((item) => {
                    const catType = getCategoryType(item);
                    const catColor = CATEGORY_COLOR[catType] || '#3b82f6';
                    const href = getArticlePath(item);

                    return (
                        <Link
                            key={item.id}
                            href={href}
                            className="group flex items-start gap-3 py-2.5 transition-all"
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
                            {/* Channel hash icon with category color */}
                            <div className="flex-shrink-0 flex items-center justify-center rounded-md mt-0.5" style={{
                                width: '22px',
                                height: '22px',
                                background: `${catColor}18`,
                                border: `1px solid ${catColor}35`,
                            }}>
                                <Hash style={{ width: '11px', height: '11px', color: catColor, strokeWidth: 2.5 }} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                {/* Category + timestamp row */}
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="font-bold uppercase" style={{ fontSize: '9px', color: catColor, letterSpacing: '0.08em' }}>
                                        {decodeHtml(item.category?.name) || 'News'}
                                    </span>
                                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.22)' }}>—</span>
                                    <span className="font-medium" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)' }} suppressHydrationWarning>
                                        {activeTab === "latest"
                                            ? (item.published_at ? formatDistanceToNow(new Date(item.published_at), { addSuffix: true }) : '')
                                            : `${(item as any).views || 0} views`
                                        }
                                    </span>
                                </div>
                                {/* Title */}
                                <div className="font-medium leading-snug line-clamp-2 group-hover:text-white transition-colors" style={{
                                    fontSize: '12.5px',
                                    color: 'rgba(255,255,255,0.82)',
                                    lineHeight: '1.4',
                                }}>
                                    {decodeHtml(item.title)}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px solid #0d2444', marginTop: '4px' }}>
                <Link
                    href="/news"
                    className="flex items-center justify-center gap-1.5 py-3 transition-colors hover:text-white"
                    style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                    Browse All News <ArrowRight style={{ width: 11, height: 11 }} />
                </Link>
            </div>
        </div>
    );
}
