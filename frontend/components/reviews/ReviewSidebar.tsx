"use client";

import { Article } from "@/types";
import dynamic from 'next/dynamic';
import { Gamepad2, Monitor, Trophy, Building2, Calendar, Clock, ShoppingCart, ThumbsUp, ThumbsDown, Star, Zap, Meh, Medal } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Lazy load recharts for better performance (reduces initial bundle by ~200KB)
const ResponsiveContainer = dynamic(
    () => import('recharts').then(mod => mod.ResponsiveContainer),
    { ssr: false }
);
const RadarChart = dynamic(
    () => import('recharts').then(mod => mod.RadarChart),
    { ssr: false }
);
const PolarGrid = dynamic(
    () => import('recharts').then(mod => mod.PolarGrid),
    { ssr: false }
);
const PolarAngleAxis = dynamic(
    () => import('recharts').then(mod => mod.PolarAngleAxis),
    { ssr: false }
);
const PolarRadiusAxis = dynamic(
    () => import('recharts').then(mod => mod.PolarRadiusAxis),
    { ssr: false }
);
const Radar = dynamic(
    () => import('recharts').then(mod => mod.Radar),
    { ssr: false }
);

interface ReviewSidebarProps {
    article: Article;
}

export default function ReviewSidebar({ article }: ReviewSidebarProps) {
    const { review_data, review_score } = article;

    if (!review_data) return null;

    // Transform ratings for Radar Chart
    const ratings = review_data.ratings || {};
    const chartData = [
        { subject: 'Gameplay', A: ratings.gameplay || 0, fullMark: 10 },
        { subject: 'Visuals', A: ratings.visuals || 0, fullMark: 10 },
        { subject: 'Audio', A: ratings.audio || 0, fullMark: 10 },
        { subject: 'Narrative', A: ratings.narrative || 0, fullMark: 10 },
        { subject: 'Replayability', A: ratings.replayability || 0, fullMark: 10 },
    ].map(i => ({ ...i, A: i.A || 0 })); // Ensure A is never undefined for chart

    const getScoreDetails = (score: number) => {
        if (score === 10) return { label: 'Masterpiece', color: 'text-cyan-400', gradient: 'from-cyan-400 to-blue-600', icon: Trophy };
        if (score >= 9) return { label: 'Amazing', color: 'text-emerald-400', gradient: 'from-emerald-400 to-green-600', icon: Medal };
        if (score >= 8) return { label: 'Great', color: 'text-green-400', gradient: 'from-green-400 to-emerald-600', icon: ThumbsUp };
        if (score >= 7) return { label: 'Good', color: 'text-yellow-400', gradient: 'from-yellow-400 to-orange-500', icon: Zap };
        if (score >= 5) return { label: 'Average', color: 'text-orange-400', gradient: 'from-orange-400 to-red-500', icon: Meh };
        return { label: 'Poor', color: 'text-red-500', gradient: 'from-red-500 to-pink-600', icon: ThumbsDown };
    };

    const scoreDetails = getScoreDetails(Number(review_score || 0));
    const ScoreIcon = scoreDetails.icon;

    const formattedDate = review_data.release_date
        ? new Date(review_data.release_date).toLocaleDateString('en-GB')
        : 'TBA';

    // Helper to ensure valid URL
    const getStoreUrl = (url: string) => {
        if (!url) return '#';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `https://${url}`;
    };

    const getVerdictBadge = (cta: string) => {
        switch (cta) {
            case 'must_play':
                return <span className="px-3 py-1 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 text-xs font-black uppercase tracking-wider animate-pulse">Must Play</span>;
            case 'recommended':
                return <span className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 text-xs font-black uppercase tracking-wider">Recommended</span>;
            case 'wait_sale':
                return <span className="px-3 py-1 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 text-xs font-black uppercase tracking-wider">Wait for Sale</span>;
            case 'skip':
                return <span className="px-3 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/50 text-xs font-black uppercase tracking-wider">Skip</span>;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Main Review Card - Wide Layout */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl relative group">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-b from-[var(--accent)]/10 to-transparent opacity-20 blur-xl px-1" />

                <div className="relative md:grid md:grid-cols-12 bg-[var(--bg-card)] backdrop-blur-sm">

                    {/* LEFT COLUMN: Radar & Visuals (5/12) */}
                    <div className="md:col-span-5 bg-black/20 border-b md:border-b-0 md:border-r border-[var(--border)] flex flex-col">
                        {/* Radar Chart Section */}
                        <div className="p-6 h-72 relative flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                    <PolarGrid stroke="var(--border)" strokeOpacity={0.5} />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 'bold' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                    <Radar
                                        name="Score"
                                        dataKey="A"
                                        stroke="var(--accent)"
                                        strokeWidth={3}
                                        fill="var(--accent)"
                                        fillOpacity={0.2}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Score Footer in Left Col */}
                        <div className="p-6 border-t border-[var(--border)] bg-gradient-to-br from-black/40 to-transparent flex items-center justify-between">
                            <div className="text-left">
                                <span className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Total Score</span>
                                <div className={`text-4xl font-black ${scoreDetails.color} flex items-center gap-3`}>
                                    {Number(review_score || 0).toFixed(1)}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${scoreDetails.gradient} text-white shadow-lg`}>
                                        <ScoreIcon className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`block text-sm font-bold uppercase tracking-wider ${scoreDetails.color}`}>{scoreDetails.label}</span>
                                {review_data.cta && getVerdictBadge(review_data.cta)}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: info & Verdict (7/12) */}
                    <div className="md:col-span-7 flex flex-col">

                        {/* Header Info */}
                        <div className="p-6 border-b border-[var(--border)]">
                            <h3 className="text-2xl font-bold text-white leading-tight mb-2">{review_data.game_title}</h3>
                            <div className="flex flex-wrap gap-4 text-xs font-medium text-[var(--text-secondary)]">
                                {review_data.developer && (
                                    <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-[var(--accent)]" /> {review_data.developer}</span>
                                )}
                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[var(--accent)]" /> {formattedDate}</span>
                                {review_data.play_time && (
                                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[var(--accent)]" /> {review_data.play_time}</span>
                                )}
                            </div>
                        </div>

                        {/* Platforms & Tested On */}
                        <div className="px-6 py-4 bg-[var(--bg-elevated)]/30 border-b border-[var(--border)] flex flex-wrap gap-3 items-center">
                            <span className="text-xs font-bold text-[var(--text-muted)] uppercase">Available On:</span>
                            {review_data.platforms && review_data.platforms.map(p => (
                                <span key={p} className="px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border)] text-xs font-bold text-white flex items-center gap-1">
                                    <Gamepad2 className="w-3 h-3 text-[var(--text-secondary)]" /> {p}
                                </span>
                            ))}
                            {review_data.tested_on && (
                                <>
                                    <span className="w-px h-4 bg-[var(--border)] mx-1" />
                                    <span className="text-xs text-[var(--text-secondary)]">Tested on: <span className="text-white font-bold">{review_data.tested_on}</span></span>
                                </>
                            )}
                        </div>

                        {/* Pros & Cons Grid */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
                            {/* Good */}
                            <div className="p-5 bg-emerald-950/10">
                                <h4 className="flex items-center gap-2 font-bold text-emerald-400 mb-3 text-xs uppercase tracking-wider">
                                    <ThumbsUp className="w-4 h-4" /> The Good
                                </h4>
                                <ul className="space-y-2">
                                    {review_data.pros?.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-emerald-100/80 leading-relaxed">
                                            <span className="text-emerald-500 mt-1">●</span> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Bad */}
                            <div className="p-5 bg-red-950/10">
                                <h4 className="flex items-center gap-2 font-bold text-red-400 mb-3 text-xs uppercase tracking-wider">
                                    <ThumbsDown className="w-4 h-4" /> The Bad
                                </h4>
                                <ul className="space-y-2">
                                    {review_data.cons?.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-red-100/80 leading-relaxed">
                                            <span className="text-red-500 mt-1">●</span> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* CTA Footer */}
                        {review_data.store_link && (
                            <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-elevated)]/50">
                                <a
                                    href={getStoreUrl(review_data.store_link)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold uppercase tracking-wider rounded-lg transition-all shadow-lg hover:shadow-[var(--accent)]/40 hover:-translate-y-0.5"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    {review_data.price ? `Buy Now - ${review_data.price}` : 'Buy Now'}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Trailer Embed */}
            {review_data.trailer_url && (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 shadow-lg">
                    <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                        <div className="w-1 h-4 bg-red-500 rounded-full" />
                        Video Review / Trailer
                    </h4>
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                        <iframe
                            src={review_data.trailer_url.replace('watch?v=', 'embed/')}
                            title="Trailer"
                            className="absolute inset-0 w-full h-full"
                            allowFullScreen
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
