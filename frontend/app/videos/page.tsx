"use client";

import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import { useState } from "react";
import {
    Play, Clock, Video, ChevronLeft, ChevronRight, Sparkles,
    Newspaper, Gamepad2, GraduationCap, Star, Cpu, Eye, TrendingUp,
    Film, Clapperboard
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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

    const { videos: realtimeVideos } = useRealTimeVideos([]);
    const fetchedVideos = data?.data || [];
    const displayVideos = page === 1
        ? [...realtimeVideos.filter(rt => !fetchedVideos.some(f => f.id === rt.id)), ...fetchedVideos]
        : fetchedVideos;

    const getThumbnail = (video: any) => {
        if (video.thumbnail_url) return video.thumbnail_url;
        if (video.youtube_id) return `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`;
        return '/placeholder-video.jpg';
    };

    const featuredVideo = displayVideos[0];
    const gridVideos = displayVideos.slice(1);

    return (
        <div className="min-h-screen bg-slate-950">
            {/* ═══════════════════════════════════════════════════════════════════
                HERO SECTION - Immersive Cinematic Experience
            ════════════════════════════════════════════════════════════════════ */}
            <section className="relative min-h-[90vh] flex items-center overflow-hidden">
                {/* Layered Background System */}
                <div className="absolute inset-0">
                    {/* Deep space gradient */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1e1b4b_0%,#0f0a1e_50%,#030014_100%)]" />

                    {/* Floating orbs with staggered animations */}
                    <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[150px] animate-pulse" />
                    <div className="absolute bottom-[10%] right-[5%] w-[600px] h-[600px] bg-fuchsia-600/15 rounded-full blur-[180px] animate-pulse" style={{ animationDelay: '1s', animationDuration: '4s' }} />
                    <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[1000px] h-[400px] bg-violet-500/10 rounded-full blur-[200px]" />
                    <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-pink-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

                    {/* Animated grid pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />

                    {/* Floating particles */}
                    <div className="absolute inset-0 overflow-hidden">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-1 h-1 bg-purple-400/60 rounded-full animate-pulse"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 3}s`,
                                    animationDuration: `${2 + Math.random() * 2}s`
                                }}
                            />
                        ))}
                    </div>

                    {/* Cinematic vignette */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
                </div>

                {/* Main Content */}
                <div className="container mx-auto px-4 relative z-10 py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">

                        {/* Left Content - 7 cols */}
                        <div className="lg:col-span-7 text-center lg:text-left">
                            {/* Logo with enhanced glow */}
                            <div className="inline-block mb-8 relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-fuchsia-500 blur-2xl opacity-40 scale-150" />
                                <img
                                    src="/privee-logo.png"
                                    alt="Privee"
                                    className="relative h-16 md:h-24 mx-auto lg:mx-0"
                                />
                            </div>

                            {/* Premium Title with layered effects */}
                            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.95] tracking-tighter mb-8">
                                <span className="block relative">
                                    <span className="absolute inset-0 bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent blur-2xl opacity-50">
                                        Join Privee
                                    </span>
                                    <span className="relative bg-gradient-to-r from-purple-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
                                        Join Privee
                                    </span>
                                </span>
                                <span className="block text-white/90 mt-2">and start your</span>
                                <span className="block relative mt-2">
                                    <span className="bg-gradient-to-r from-fuchsia-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
                                        cinematic journey!
                                    </span>
                                </span>
                            </h1>

                            {/* Description */}
                            <p className="text-lg md:text-xl text-gray-300/80 leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-10">
                                Your epic gaming moments and real-life adventures deserve
                                <span className="text-white font-semibold"> the big screen treatment</span>.
                                Blend your best clips into immersive narratives with
                                <span className="text-fuchsia-300 font-medium"> professional cinematic quality</span>.
                            </p>

                            {/* CTA Box */}
                            <div className="relative group inline-block mb-10">
                                <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-80 transition-all duration-700" />
                                <div className="relative bg-slate-900/90 backdrop-blur-2xl border border-white/20 rounded-2xl px-8 py-6 shadow-2xl">
                                    <div className="flex items-center gap-4 flex-wrap justify-center lg:justify-start">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/40">
                                            <Sparkles className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-semibold text-white">
                                                <span className="text-fuchsia-300">Register now</span> for your free Ultimate account
                                            </p>
                                            <p className="text-gray-400 text-sm">Turn your highlights into a masterpiece!</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Store badges with glass effect */}
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                                <a href="https://apps.apple.com/app/privee" target="_blank" rel="noopener noreferrer"
                                    className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 to-fuchsia-600/50 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="App Store" className="relative h-14 rounded-lg" />
                                </a>
                                <a href="https://play.google.com/store/apps/details?id=com.privee" target="_blank" rel="noopener noreferrer"
                                    className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 to-fuchsia-600/50 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="relative h-14 rounded-lg" />
                                </a>
                            </div>
                        </div>

                        {/* Right - Hero Image with orbital design */}
                        <div className="lg:col-span-5 hidden lg:flex justify-center items-center relative h-[600px]">
                            {/* Orbital rings */}
                            <div className="absolute w-[480px] h-[480px] rounded-full border border-purple-500/30 animate-[spin_25s_linear_infinite]" />
                            <div className="absolute w-[380px] h-[380px] rounded-full border border-fuchsia-500/20 animate-[spin_35s_linear_infinite_reverse]" />
                            <div className="absolute w-[280px] h-[280px] rounded-full border-2 border-dashed border-pink-500/10 animate-[spin_45s_linear_infinite]" />

                            {/* Orbital dots */}
                            <div className="absolute w-[480px] h-[480px] animate-[spin_25s_linear_infinite]">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-purple-400 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.8)]" />
                            </div>
                            <div className="absolute w-[380px] h-[380px] animate-[spin_35s_linear_infinite_reverse]">
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-fuchsia-400 rounded-full shadow-[0_0_15px_rgba(217,70,239,0.8)]" />
                            </div>

                            {/* Central glow */}
                            <div className="absolute w-[350px] h-[350px] bg-gradient-to-br from-purple-600/40 via-fuchsia-600/30 to-pink-600/40 rounded-full blur-3xl" />

                            {/* Hero image */}
                            <img
                                src="/privee-hero.png"
                                alt="Privee"
                                className="relative z-10 max-h-[520px] w-auto object-contain drop-shadow-[0_0_80px_rgba(168,85,247,0.4)] hover:scale-105 transition-transform duration-1000"
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom transition */}
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                CATEGORY FILTER - Floating Glass Bar
            ════════════════════════════════════════════════════════════════════ */}
            <section className="relative z-30 -mt-12">
                <div className="container mx-auto px-4">
                    <div className="relative">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-fuchsia-600/20 to-purple-600/20 rounded-2xl blur-2xl" />

                        <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 shadow-2xl shadow-purple-500/10">
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                {categories.map((category) => {
                                    const Icon = category.icon;
                                    const isActive = selectedCategory === category.id;
                                    return (
                                        <button
                                            key={category.id}
                                            onClick={() => setSelectedCategory(category.id)}
                                            className={`
                                                relative flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-500
                                                ${isActive
                                                    ? 'text-white'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                }
                                            `}
                                        >
                                            {isActive && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 rounded-xl shadow-lg shadow-fuchsia-500/30" />
                                            )}
                                            <Icon className={`relative w-4 h-4 ${isActive ? 'text-white' : 'text-fuchsia-400'}`} />
                                            <span className="relative hidden sm:inline">{category.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                FEATURED VIDEO - Hero Spotlight
            ════════════════════════════════════════════════════════════════════ */}
            {featuredVideo && !isLoading && (
                <section className="relative py-20">
                    <div className="container mx-auto px-4">
                        <Link
                            href={`/videos/${featuredVideo.slug}`}
                            className="group relative block rounded-3xl overflow-hidden"
                        >
                            {/* Background glow */}
                            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 via-fuchsia-600/20 to-pink-600/20 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                            <div className="relative bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden group-hover:border-purple-500/30 transition-all duration-500">
                                <div className="grid grid-cols-1 lg:grid-cols-2">
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video lg:aspect-auto lg:h-[450px] overflow-hidden">
                                        <img
                                            src={getThumbnail(featuredVideo)}
                                            alt={featuredVideo.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-slate-900/90 hidden lg:block" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent lg:hidden" />

                                        {/* Play button */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full blur-2xl opacity-40 group-hover:opacity-80 scale-150 transition-all duration-500" />
                                                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center group-hover:scale-110 transition-all duration-500 shadow-2xl shadow-purple-500/50">
                                                    <Play className="w-10 h-10 text-white ml-2" fill="white" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Featured badge */}
                                        <div className="absolute top-6 left-6">
                                            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full text-white text-sm font-bold shadow-lg shadow-purple-500/30">
                                                <TrendingUp className="w-4 h-4" />
                                                Featured
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-8 lg:p-12 flex flex-col justify-center">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                            <span className="text-green-400 text-sm font-medium">Latest Upload</span>
                                        </div>
                                        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 group-hover:text-fuchsia-300 transition-colors duration-500 line-clamp-2">
                                            {featuredVideo.title}
                                        </h2>
                                        <p className="text-gray-400 text-lg mb-6 line-clamp-2">
                                            Experience cinematic storytelling at its finest. Click to watch the full video.
                                        </p>
                                        <div className="flex items-center gap-6 text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-fuchsia-400" />
                                                <span>{formatDistanceToNow(new Date(featuredVideo.published_at), { addSuffix: true })}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clapperboard className="w-5 h-5 text-purple-400" />
                                                <span>HD Quality</span>
                                            </div>
                                        </div>

                                        <div className="mt-8">
                                            <span className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl text-white font-semibold shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all">
                                                <Play className="w-5 h-5" fill="white" />
                                                Watch Now
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </section>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                VIDEO GRID - Premium Cards
            ════════════════════════════════════════════════════════════════════ */}
            <section className="relative py-16 pb-24">
                {/* Background accents */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[150px]" />
                    <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-fuchsia-600/5 rounded-full blur-[120px]" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    {/* Section Header */}
                    <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/20 to-fuchsia-600/20 border border-purple-500/20 flex items-center justify-center">
                                    <Film className="w-5 h-5 text-fuchsia-400" />
                                </div>
                                <span className="text-fuchsia-400 font-semibold text-sm uppercase tracking-wider">Explore</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white">
                                All Videos
                            </h2>
                            <p className="text-gray-400 mt-2 max-w-lg">
                                Discover amazing content from creators around the world
                            </p>
                        </div>

                        <div className="flex items-center gap-3 px-5 py-3 bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl">
                            <Video className="w-5 h-5 text-fuchsia-400" />
                            <span className="text-2xl font-bold text-white">{data?.total || 0}</span>
                            <span className="text-gray-400">videos</span>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-slate-800/30 border border-white/5 rounded-2xl overflow-hidden">
                                    <div className="aspect-video bg-gradient-to-br from-purple-900/30 to-slate-800/50 animate-pulse" />
                                    <div className="p-6 space-y-4">
                                        <div className="h-6 bg-white/10 rounded-lg w-4/5 animate-pulse" />
                                        <div className="h-4 bg-white/5 rounded-lg w-2/3 animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : gridVideos.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                                {gridVideos.map((video: any, index: number) => (
                                    <Link
                                        key={video.id}
                                        href={`/videos/${video.slug}`}
                                        className="group relative block"
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    >
                                        {/* Card glow on hover */}
                                        <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/20 via-fuchsia-600/20 to-pink-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700" />

                                        <div className="relative bg-slate-800/40 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden group-hover:border-purple-500/40 transition-all duration-500">
                                            {/* Thumbnail */}
                                            <div className="relative aspect-video overflow-hidden">
                                                <img
                                                    src={getThumbnail(video)}
                                                    alt={video.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                                />
                                                {/* Overlays */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                                                <div className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/20 transition-all duration-500" />

                                                {/* Play button */}
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                                                    <div className="relative transform scale-75 group-hover:scale-100 transition-transform duration-500">
                                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full blur-xl opacity-60 scale-150" />
                                                        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-2xl">
                                                            <Play className="w-7 h-7 text-white ml-1" fill="white" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Duration badge placeholder */}
                                                <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 backdrop-blur-sm rounded-md text-xs text-white font-medium">
                                                    HD
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-5">
                                                <h3 className="font-semibold text-white text-lg group-hover:text-fuchsia-300 transition-colors duration-300 line-clamp-2 mb-3">
                                                    {video.title}
                                                </h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                                    <Clock className="w-4 h-4 text-fuchsia-400/70" />
                                                    <span>{formatDistanceToNow(new Date(video.published_at), { addSuffix: true })}</span>
                                                </div>
                                            </div>

                                            {/* Bottom gradient line */}
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1 || isValidating}
                                    className="flex items-center gap-2 px-6 py-3.5 bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-slate-700/50 hover:border-purple-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    <span className="hidden sm:inline">Previous</span>
                                </button>

                                <div className="flex items-center gap-3 px-8 py-3.5 bg-slate-800/80 backdrop-blur-sm border border-purple-500/30 rounded-xl">
                                    <span className="text-gray-400">Page</span>
                                    <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                                        {data?.current_page}
                                    </span>
                                    <span className="text-gray-400">of {data?.last_page}</span>
                                </div>

                                <button
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={!data?.next_page_url || isValidating}
                                    className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl text-sm font-semibold text-white hover:from-purple-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    <span className="hidden sm:inline">Next</span>
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </>
                    ) : !featuredVideo ? (
                        /* Empty State */
                        <div className="relative text-center py-32 rounded-3xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-white/10" />
                            <div className="absolute inset-0">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />
                            </div>

                            <div className="relative z-10">
                                <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-purple-600/20 to-fuchsia-600/20 border border-purple-500/20 flex items-center justify-center">
                                    <Video className="w-12 h-12 text-fuchsia-400" />
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-4">No videos yet</h3>
                                <p className="text-gray-400 text-lg max-w-md mx-auto">
                                    The Privee community is just getting started. Check back soon for amazing cinematic content!
                                </p>
                            </div>
                        </div>
                    ) : null}
                </div>
            </section>
        </div>
    );
}
