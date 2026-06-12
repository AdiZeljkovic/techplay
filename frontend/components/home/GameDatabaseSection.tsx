"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    ArrowRight, Search, Database, LayoutGrid,
    Swords, Shield, Globe, Gamepad2, Lightbulb,
    Compass, Crosshair, Castle, Car, Layers, MonitorSmartphone, Star,
    type LucideIcon,
} from "lucide-react";
import { AmbientShell, SectionHeader, HUD, ScoreRing, CircuitLine } from "./homeUI";

interface TrendingGame {
    id: number;
    slug: string;
    name: string;
    background_image: string;
    rating?: number;
    genres?: { name: string }[];
}

const POPULAR_TAGS: { label: string; icon: LucideIcon; genre?: string; platform?: string }[] = [
    { label: "Action",        icon: Swords,   genre: "action" },
    { label: "RPG",           icon: Shield,   genre: "role-playing-games-rpg" },
    { label: "Open World",    icon: Globe,    genre: "open-world" },
    { label: "PlayStation 5", icon: Gamepad2, platform: "playstation5" },
    { label: "Indie",         icon: Lightbulb, genre: "indie" },
];

const GENRES: { label: string; icon: LucideIcon; slug: string; count: string }[] = [
    { label: "Action",    icon: Swords,    slug: "action",                 count: "7,300+" },
    { label: "RPG",       icon: Shield,    slug: "role-playing-games-rpg", count: "6,100+" },
    { label: "Adventure", icon: Compass,   slug: "adventure",              count: "4,300+" },
    { label: "Shooter",   icon: Crosshair, slug: "shooter",                count: "3,900+" },
    { label: "Strategy",  icon: Castle,    slug: "strategy",               count: "2,800+" },
    { label: "Racing",    icon: Car,       slug: "racing",                 count: "2,100+" },
];

const DB_STATS: { icon: LucideIcon; value: string; label: string }[] = [
    { icon: Gamepad2,          value: "28K+", label: "Games" },
    { icon: Layers,            value: "42+",  label: "Genres" },
    { icon: MonitorSmartphone, value: "25+",  label: "Platforms" },
    { icon: Star,              value: "12M+", label: "Ratings" },
];

export default function GameDatabaseSection() {
    const [featured, setFeatured] = useState<TrendingGame | null>(null);
    const [query, setQuery] = useState("");
    const router = useRouter();

    useEffect(() => {
        fetch("/api/proxy/games?ordering=-rating&page_size=1")
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                const results = data?.results || [];
                if (results[0]) setFeatured(results[0]);
            })
            .catch(() => {});
    }, []);

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (query.trim()) router.push(`/games?search=${encodeURIComponent(query.trim())}`);
    }

    return (
        <AmbientShell padding={32}>

            <SectionHeader
                title="GAME DATABASE"
                viewAllLink="/games"
                viewAllLabel="VIEW ALL GAMES"
            />

            {/* ── 3-Column Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">

                {/* LEFT: Search + Tags + Stats */}
                <div className="lg:col-span-4 flex flex-col gap-5">

                    {/* Search */}
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'rgba(255,255,255,0.3)' }} />
                            <input
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search for games, genres, platforms..."
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    background: 'rgba(2,8,22,0.8)',
                                    border: '1px solid rgba(59,130,246,0.2)',
                                    borderRadius: '10px',
                                    padding: '14px 16px 14px 44px',
                                    fontSize: '13px', fontWeight: 500,
                                    color: '#fff', outline: 'none',
                                    transition: 'border-color 0.15s',
                                }}
                                onFocus={e => (e.target.style.borderColor = 'rgba(252,65,0,0.5)')}
                                onBlur={e => (e.target.style.borderColor = 'rgba(59,130,246,0.2)')}
                            />
                        </div>
                        <button
                            type="submit"
                            style={{
                                padding: '0 24px',
                                background: '#FC4100',
                                border: 'none', borderRadius: '10px',
                                fontSize: '12px', fontWeight: 900,
                                color: '#fff', textTransform: 'uppercase',
                                letterSpacing: '0.12em', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: '0 4px 20px rgba(252,65,0,0.35)',
                                transition: 'all 0.15s', flexShrink: 0,
                                whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#e03a00'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#FC4100'; }}
                        >
                            SEARCH <ArrowRight size={14} />
                        </button>
                    </form>

                    {/* Popular searches */}
                    <div>
                        <p style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: '10px' }}>
                            Popular Searches
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {POPULAR_TAGS.map(tag => (
                                <button
                                    key={tag.label}
                                    onClick={() => {
                                        if (tag.genre) router.push(`/games?genre=${tag.genre}`);
                                        else if (tag.platform) router.push(`/games?platform=${tag.platform}`);
                                    }}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '7px',
                                        padding: '7px 14px',
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(59,130,246,0.18)',
                                        borderRadius: '8px',
                                        fontSize: '11px', fontWeight: 700,
                                        color: 'rgba(255,255,255,0.5)',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => {
                                        const el = e.currentTarget as HTMLElement;
                                        el.style.background = 'rgba(252,65,0,0.12)';
                                        el.style.borderColor = 'rgba(252,65,0,0.4)';
                                        el.style.color = '#FC4100';
                                    }}
                                    onMouseLeave={e => {
                                        const el = e.currentTarget as HTMLElement;
                                        el.style.background = 'rgba(255,255,255,0.04)';
                                        el.style.borderColor = 'rgba(59,130,246,0.18)';
                                        el.style.color = 'rgba(255,255,255,0.5)';
                                    }}
                                >
                                    <tag.icon size={13} />
                                    {tag.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats bar */}
                    <div className="glass-card grid grid-cols-2 md:grid-cols-4 rounded-xl overflow-hidden glow-border">
                        {DB_STATS.map((stat, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '18px 20px',
                                borderRight: i < 3 ? '1px solid rgba(59,130,246,0.1)' : 'none',
                            }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                                    background: 'rgba(252,65,0,0.1)',
                                    border: '1px solid rgba(252,65,0,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#FC4100',
                                }}>
                                    <stat.icon size={18} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#FC4100', lineHeight: 1 }}>{stat.value}</div>
                                    <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* MIDDLE: Featured Game */}
                <div className="lg:col-span-4 h-[380px] lg:h-auto">
                    {featured ? (
                        <Link
                            href={`/games/${featured.slug}`}
                            className="glass-card glow-border group relative block overflow-hidden h-full min-h-[280px] transition-all duration-300"
                            style={{ borderRadius: HUD.radius.lg }}
                            onMouseEnter={e => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.transform = 'translateY(-3px)';
                                el.style.boxShadow = '0 24px 60px rgba(0,0,0,0.65), 0 0 40px rgba(252,65,0,0.1)';
                                el.style.borderColor = 'rgba(252,65,0,0.4)';
                            }}
                            onMouseLeave={e => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.transform = 'translateY(0)';
                                el.style.boxShadow = '0 8px 40px rgba(0,0,0,0.5)';
                                el.style.borderColor = 'rgba(59,130,246,0.2)';
                            }}
                        >
                            {/* Image fills card */}
                            <div className="absolute inset-0">
                                {featured.background_image && (
                                    <Image src={featured.background_image} alt={featured.name} fill sizes="38vw" quality={80}
                                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                                )}
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(2,6,18,0.98) 0%, rgba(2,6,18,0.6) 40%, rgba(2,6,18,0.1) 75%, transparent 100%)' }} />
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(252,65,0,0.06) 0%, transparent 30%)' }} />
                            </div>

                            {/* FEATURED badge */}
                            <div style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 2 }}>
                                <span style={{
                                    padding: '5px 12px', borderRadius: '4px',
                                    background: '#FC4100', fontSize: '8px',
                                    fontWeight: 900, color: '#fff',
                                    textTransform: 'uppercase', letterSpacing: '0.16em',
                                    boxShadow: '0 4px 14px rgba(252,65,0,0.5)',
                                }}>
                                    Featured
                                </span>
                            </div>

                            {/* Content — bottom */}
                            <div className="absolute inset-x-0 bottom-0" style={{ padding: '20px', zIndex: 2 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    {typeof featured.rating === 'number' && featured.rating > 0 && (
                                        <ScoreRing score={Math.round(featured.rating * 20) / 10} size={52} showLabel={false} />
                                    )}
                                    <div>
                                        <h3
                                            className="group-hover:text-[var(--accent)] transition-colors"
                                            style={{ fontSize: '20px', fontWeight: 900, color: '#fff', lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: '0.02em' }}
                                        >
                                            {featured.name}
                                        </h3>
                                        {featured.genres && featured.genres[0] && (
                                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                                {featured.genres[0].name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ) : (
                        <div className="animate-pulse" style={{ borderRadius: HUD.radius.lg, height: '100%', minHeight: '280px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.12)' }} />
                    )}
                </div>

                {/* RIGHT: Genres */}
                <div className="lg:col-span-4 flex flex-col justify-between gap-4">
                    <p style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.16em', margin: 0 }}>
                        Browse By Genre
                    </p>
                    <div className="grid grid-cols-2 gap-3 h-full">
                        {GENRES.map(genre => (
                            <Link
                                key={genre.slug}
                                href={`/games?genre=${genre.slug}`}
                                className="group relative flex flex-col items-center justify-center text-center overflow-hidden glass-card glow-border transition-all duration-300"
                                style={{ borderRadius: '12px', padding: '20px 10px' }}
                            >
                                <div style={{
                                    width: '34px', height: '34px', borderRadius: '8px',
                                    background: 'rgba(252,65,0,0.1)',
                                    border: '1px solid rgba(252,65,0,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#FC4100', marginBottom: '12px',
                                }}>
                                    <genre.icon size={17} />
                                </div>
                                <div style={{ fontSize: '11px', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>
                                    {genre.label}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

            </div>

            {/* ── CTA button ── */}
            <div className="flex items-center gap-4">
                <CircuitLine className="flex-1 hidden md:flex" />
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Link
                    href="/games"
                    className="group flex items-center gap-3"
                    style={{
                        padding: '15px 40px',
                        background: 'transparent',
                        border: '1px solid rgba(252,65,0,0.45)',
                        borderRadius: '10px',
                        fontSize: '13px', fontWeight: 900,
                        color: '#fff', textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        transition: 'all 0.2s',
                        boxShadow: '0 0 30px rgba(252,65,0,0.08)',
                    }}
                    onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = '#FC4100';
                        el.style.borderColor = '#FC4100';
                        el.style.boxShadow = '0 8px 30px rgba(252,65,0,0.4)';
                    }}
                    onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = 'transparent';
                        el.style.borderColor = 'rgba(252,65,0,0.45)';
                        el.style.boxShadow = '0 0 30px rgba(252,65,0,0.08)';
                    }}
                >
                    <LayoutGrid size={16} />
                    BROWSE ALL GAMES
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
            <CircuitLine className="flex-1 hidden md:flex" />
        </div>

        </AmbientShell>
    );
}
