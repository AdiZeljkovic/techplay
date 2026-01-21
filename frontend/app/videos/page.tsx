"use client";

import Link from "next/link";

import useSWR from "swr";
import axios from "@/lib/axios";
import { useState } from "react";
import { Play, Clock, Video, ChevronLeft, ChevronRight, Sparkles, Newspaper, Gamepad2, GraduationCap, Star, Cpu } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import PageHero from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";
import { useRealTimeVideos } from "@/hooks";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface VideoItem {
    id: number;
    title: string;
    slug: string;
    youtube_url: string;
    youtube_id: string;
    thumbnail_url?: string;
    published_at: string;
}

interface VideoResponse {
    data: VideoItem[];
    current_page: number;
    last_page: number;
    total: number;
    next_page_url: string | null;
}

export default function VideosPage() {
    const [page, setPage] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const categories = [
        { id: 'all', name: 'All Videos', icon: Video },
        { id: 'news', name: 'News', icon: Newspaper },
        { id: 'game-for-fun', name: 'Game For Fun', icon: Gamepad2 },
        { id: 'education', name: 'Education', icon: GraduationCap },
        { id: 'reviews', name: 'Reviews', icon: Star },
        { id: 'tech-reviews', name: 'Tech Reviews', icon: Cpu },
    ];
    const { data, isLoading, isValidating } = useSWR<VideoResponse>(
        `/videos?page=${page}`,
        fetcher
    );

    // Real-time hook
    const { videos: realtimeVideos, newCount } = useRealTimeVideos([]);

    // Combine real-time with fetched
    const fetchedVideos = data?.data || [];
    const displayVideos = page === 1
        ? [...realtimeVideos.filter(rt => !fetchedVideos.some(f => f.id === rt.id)), ...fetchedVideos]
        : fetchedVideos;

    const getThumbnail = (video: VideoItem) => {
        if (video.thumbnail_url) return video.thumbnail_url;
        return `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`;
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Privee Hero Section - Premium Cinematic Design */}
            <section className="relative min-h-[85vh] flex items-center overflow-hidden">
                {/* Multi-layer Background */}
                <div className="absolute inset-0">
                    {/* Base gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-950/50 to-slate-900" />

                    {/* Animated orbs */}
                    <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[150px] animate-pulse" />
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-fuchsia-600/25 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-pink-500/15 rounded-full blur-[180px]" />

                    {/* Grid overlay for depth */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />

                    {/* Top vignette */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20" />
                </div>

                <div className="container mx-auto px-4 relative z-10 py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center">

                        {/* Left: Text Content - takes 7 columns */}
                        <div className="lg:col-span-7 text-center lg:text-left space-y-8">
                            {/* Privee Logo with glow */}
                            <div className="inline-block">
                                <img
                                    src="/privee-logo.png"
                                    alt="Privee"
                                    className="h-14 md:h-20 mx-auto lg:mx-0 drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                                />
                            </div>

                            {/* Premium Gradient Title */}
                            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] tracking-tight">
                                <span className="block bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(217,70,239,0.3)]">
                                    Join Privee and start
                                </span>
                                <span className="block bg-gradient-to-r from-fuchsia-400 via-pink-400 to-rose-400 bg-clip-text text-transparent mt-2">
                                    your cinematic journey!
                                </span>
                            </h1>

                            {/* Description with better typography */}
                            <p className="text-base md:text-lg lg:text-xl text-gray-300/90 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                Your epic gaming moments and real-life adventures deserve more than just a standard upload—they deserve
                                <span className="text-white font-semibold"> the big screen treatment</span>.
                                Privee allows you to seamlessly blend your best clips and photos into immersive, movie-like narratives with
                                <span className="text-fuchsia-300 font-medium"> professional cinematic quality</span>.
                                Take total control of your content and share your journey with a global community of storytellers.
                            </p>

                            {/* Premium CTA Box */}
                            <div className="relative group inline-block">
                                {/* Glow behind */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-500" />

                                <div className="relative bg-gradient-to-r from-purple-900/80 via-fuchsia-900/80 to-pink-900/80 backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-5 shadow-2xl">
                                    <p className="text-base md:text-lg font-medium text-white flex items-center gap-3 flex-wrap justify-center lg:justify-start">
                                        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 shadow-lg shadow-fuchsia-500/30">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </span>
                                        <span>
                                            <span className="text-fuchsia-300 font-bold">Register now</span> to claim your free Ultimate account—
                                            <br className="hidden md:block" />
                                            unlock Privee and turn your highlights into a masterpiece!
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* App Store Badges */}
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-8">
                                <a
                                    href="https://apps.apple.com/app/privee"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="transition-transform hover:scale-105 hover:brightness-110"
                                >
                                    <img
                                        src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                                        alt="Download on the App Store"
                                        className="h-12 md:h-14"
                                    />
                                </a>
                                <a
                                    href="https://play.google.com/store/apps/details?id=com.privee"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="transition-transform hover:scale-105 hover:brightness-110"
                                >
                                    <img
                                        src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                                        alt="Get it on Google Play"
                                        className="h-12 md:h-14"
                                    />
                                </a>
                            </div>
                        </div>

                        {/* Right: Hero Image - takes 5 columns */}
                        <div className="lg:col-span-5 hidden lg:flex justify-center items-center relative">
                            {/* Decorative ring behind image */}
                            <div className="absolute w-[450px] h-[450px] rounded-full border border-purple-500/20 animate-[spin_30s_linear_infinite]" />
                            <div className="absolute w-[500px] h-[500px] rounded-full border border-fuchsia-500/10 animate-[spin_40s_linear_infinite_reverse]" />

                            {/* Glow behind image */}
                            <div className="absolute w-[400px] h-[400px] bg-gradient-to-br from-purple-600/30 via-fuchsia-600/20 to-pink-600/30 rounded-full blur-3xl" />

                            {/* The Image */}
                            <img
                                src="/privee-hero.png"
                                alt="Privee cinematic experience"
                                className="relative z-10 max-h-[550px] w-auto object-contain drop-shadow-[0_0_60px_rgba(168,85,247,0.3)] hover:scale-105 transition-transform duration-700"
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom fade into content */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
            </section>

            {/* Category Filter Bar */}
            <section className="relative z-20 -mt-8">
                <div className="container mx-auto px-4">
                    <div className="bg-gradient-to-r from-slate-900/90 via-purple-950/50 to-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            {categories.map((category) => {
                                const Icon = category.icon;
                                const isActive = selectedCategory === category.id;
                                return (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`
                                            flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-300
                                            ${isActive
                                                ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-500/30'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }
                                        `}
                                    >
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-fuchsia-400'}`} />
                                        <span className="hidden sm:inline">{category.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Videos Grid Section */}
            <section className="relative py-16">
                {/* Subtle background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-fuchsia-600/5 rounded-full blur-[100px]" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    {/* Section Header */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                                <span className="w-1.5 h-8 bg-gradient-to-b from-purple-500 to-fuchsia-500 rounded-full" />
                                Latest Videos
                            </h2>
                            <p className="text-gray-400 mt-2">Discover content from the Privee community</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                            <Video className="w-4 h-4 text-fuchsia-400" />
                            <span className="text-sm font-medium text-gray-300">
                                <span className="text-white font-bold">{data?.total || 0}</span> videos
                            </span>
                        </div>
                    </div>

                    {isLoading ? (
                        /* Premium Loading Skeleton */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
                                    <div className="aspect-video bg-gradient-to-br from-purple-900/20 to-slate-800/50 animate-pulse" />
                                    <div className="p-5 space-y-3">
                                        <div className="h-5 bg-white/10 rounded-lg w-3/4 animate-pulse" />
                                        <div className="h-4 bg-white/5 rounded-lg w-1/2 animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : displayVideos.length > 0 ? (
                        <>
                            {/* Premium Video Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                                {displayVideos.map((video: any) => (
                                    <Link
                                        key={video.id}
                                        href={`/videos/${video.slug}`}
                                        className="group relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(168,85,247,0.15)] block"
                                    >
                                        {/* Thumbnail Container */}
                                        <div className="relative aspect-video overflow-hidden">
                                            <img
                                                src={getThumbnail(video)}
                                                alt={video.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            {/* Gradient Overlays */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                                            <div className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/10 transition-colors duration-500" />

                                            {/* Play Button */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="relative">
                                                    {/* Glow ring */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 scale-150" />
                                                    {/* Button */}
                                                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-2xl">
                                                        <Play className="w-7 h-7 text-white ml-1" fill="white" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5">
                                            <h3 className="font-semibold text-white group-hover:text-fuchsia-300 transition-colors duration-300 line-clamp-2 text-lg">
                                                {video.title}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-3">
                                                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                                                    <Clock className="w-3.5 h-3.5 text-fuchsia-400" />
                                                    <span>{formatDistanceToNow(new Date(video.published_at), { addSuffix: true })}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom accent line */}
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    </Link>
                                ))}
                            </div>

                            {/* Premium Pagination */}
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1 || isValidating}
                                    className="flex items-center gap-2 px-5 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 hover:border-purple-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Previous
                                </button>

                                <div className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-900/50 to-fuchsia-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl">
                                    <span className="text-sm text-gray-400">Page</span>
                                    <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                                        {data?.current_page}
                                    </span>
                                    <span className="text-sm text-gray-400">of {data?.last_page}</span>
                                </div>

                                <button
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={!data?.next_page_url || isValidating}
                                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl text-sm font-medium text-white hover:from-purple-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    ) : (
                        /* Premium Empty State */
                        <div className="relative text-center py-24 bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden">
                            {/* Background decoration */}
                            <div className="absolute inset-0 overflow-hidden">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px]" />
                            </div>

                            <div className="relative z-10">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-600/20 to-fuchsia-600/20 border border-purple-500/20 flex items-center justify-center">
                                    <Video className="w-10 h-10 text-fuchsia-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">No videos yet</h3>
                                <p className="text-gray-400 max-w-md mx-auto">
                                    The Privee community is just getting started. Check back soon for amazing cinematic content!
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Modal removed in favor of /videos/[slug] */}
        </div>
    );
}
