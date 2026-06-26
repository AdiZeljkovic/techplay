import { Metadata } from "next";
import Link from "next/link";
import { getServerApiUrl } from "@/lib/api";
import Gta6Countdown from "@/components/gta6/Gta6Countdown";
import {
    Map, Users, Car, Crosshair, BookOpen, Newspaper,
    ArrowRight, Calendar, ChevronRight,
} from "lucide-react";

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg";

export const metadata: Metadata = {
    title: "GTA 6 Hub — Map, Characters, Vehicles, Weapons & News | TechPlay",
    description:
        "Everything Grand Theft Auto VI in one place — interactive map, characters, vehicles, weapons, release countdown, the full 'everything we know' guide and the latest GTA 6 news. Releases November 19, 2026.",
    openGraph: {
        title: "GTA 6 Hub | TechPlay",
        description: "Interactive map, characters, vehicles, weapons, countdown and the latest GTA 6 news.",
        url: `${SITE_URL}/gta6`,
        siteName: "TechPlay",
        type: "website",
    },
    alternates: { canonical: `${SITE_URL}/gta6` },
};

interface NewsItem {
    id: number;
    title: string;
    excerpt: string | null;
    image: string | null;
    category: string | null;
    url: string;
}

async function fetchGta6News(): Promise<NewsItem[]> {
    try {
        const res = await fetch(`${getServerApiUrl()}/search/articles?q=${encodeURIComponent("gta 6")}`, {
            next: { revalidate: 3600 },
            headers: { Accept: "application/json" },
        });
        if (!res.ok) return [];
        const json = await res.json();
        return (json.results ?? []).slice(0, 4);
    } catch {
        return [];
    }
}

function newsImage(image: string | null): string | null {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    return `${process.env.NEXT_PUBLIC_STORAGE_URL}/${image}`;
}

const SECTIONS = [
    { href: "/gta6/map",                icon: Map,       title: "Interactive Map",   desc: "1,000+ locations across Vice City & Leonida. Filter, search, explore.", accent: true },
    { href: "/gta6/characters",         icon: Users,     title: "Characters",        desc: "Jason, Lucia and the full cast of Leonida — bios and roles." },
    { href: "/gta6/vehicles",           icon: Car,       title: "Vehicles",          desc: "Cars, bikes, boats and aircraft confirmed for GTA 6." },
    { href: "/gta6/weapons",            icon: Crosshair, title: "Weapons",           desc: "Every confirmed weapon and gear in the arsenal." },
    { href: "/gta6/everything-we-know", icon: BookOpen,  title: "Everything We Know", desc: "Release date, story, map, platforms, price — the full guide." },
    { href: "/news?search=gta+6",       icon: Newspaper, title: "GTA 6 News",        desc: "Latest articles, trailers, leaks and official announcements." },
];

export default async function Gta6HubPage() {
    const news = await fetchGta6News();

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "VideoGame",
        "name": "Grand Theft Auto VI",
        "alternateName": "GTA 6",
        "description": "Open-world action-adventure game set in Vice City and Leonida, releasing November 19, 2026.",
        "gamePlatform": ["PlayStation 5", "Xbox Series X", "Xbox Series S"],
        "applicationCategory": "Game",
        "publisher": { "@type": "Organization", "name": "Rockstar Games" },
        "url": `${SITE_URL}/gta6`,
        "datePublished": "2026-11-19",
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <div className="min-h-screen bg-[#05070A]">
                {/* Hero */}
                <div className="relative bg-[#0B0E14] border-b border-[#161B22] overflow-hidden">
                    <div className="absolute inset-0 bg-tech-grid opacity-20" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent)]/8 via-transparent to-[#0B0E14]" />
                    <div className="absolute top-0 left-[5%] w-[90%] h-[1px] bg-gradient-to-r from-transparent via-[var(--accent)]/30 to-transparent" />

                    <div className="relative max-w-[1320px] mx-auto px-4 xl:px-8 py-14 md:py-20 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] text-[11px] font-bold uppercase tracking-widest mb-6">
                            <Calendar className="w-3 h-3" />
                            Releases November 19, 2026
                        </div>
                        <h1 className="font-display text-[40px] md:text-[64px] font-black text-white leading-none mb-4">
                            Grand Theft Auto VI
                        </h1>
                        <p className="text-[#A1A1AA] text-[16px] md:text-[17px] max-w-xl mx-auto mb-9">
                            Vice City returns. Your complete hub for GTA 6 — map, characters, vehicles, weapons and everything we know.
                        </p>

                        <div className="flex justify-center mb-9">
                            <Gta6Countdown />
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <Link href="/gta6/map" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent)] text-white text-[14px] font-bold hover:bg-[var(--accent-hover)] transition-colors">
                                <Map className="w-4 h-4" /> Explore the Map
                            </Link>
                            <Link href="/gta6/everything-we-know" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#05070A] border border-[#161B22] text-white text-[14px] font-bold hover:border-[var(--accent)]/40 transition-colors">
                                <BookOpen className="w-4 h-4" /> Everything We Know
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Section grid */}
                <div className="max-w-[1320px] mx-auto px-4 xl:px-8 py-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {SECTIONS.map(({ href, icon: Icon, title, desc, accent }) => (
                            <Link
                                key={href}
                                href={href}
                                className="group relative bg-[#0B0E14] border border-[#161B22] rounded-2xl p-6 hover:border-[var(--accent)]/40 hover:-translate-y-0.5 transition-all overflow-hidden"
                            >
                                <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--accent)] scale-y-0 group-hover:scale-y-100 origin-center transition-transform duration-300" />
                                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 border ${accent ? "bg-[var(--accent)]/12 border-[var(--accent)]/30" : "bg-white/5 border-white/10"}`}>
                                        <Icon className={`w-5 h-5 ${accent ? "text-[var(--accent)]" : "text-white"}`} />
                                    </div>
                                    <h2 className="font-display text-[19px] font-black text-white mb-2 group-hover:text-[var(--accent)] transition-colors">{title}</h2>
                                    <p className="text-[#71717A] text-[13px] leading-relaxed mb-4">{desc}</p>
                                    <span className="inline-flex items-center gap-1.5 text-[var(--accent)] text-[12px] font-semibold">
                                        Open <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Latest GTA 6 news */}
                {news.length > 0 && (
                    <div className="max-w-[1320px] mx-auto px-4 xl:px-8 pb-16">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-display text-[22px] font-black text-white">Latest GTA 6 News</h2>
                            <Link href="/news?search=gta+6" className="inline-flex items-center gap-1 text-[#71717A] hover:text-[var(--accent)] text-[13px] font-semibold transition-colors">
                                View all <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {news.map(item => {
                                const img = newsImage(item.image);
                                return (
                                    <Link
                                        key={item.id}
                                        href={item.url}
                                        className="group bg-[#0B0E14] border border-[#161B22] rounded-xl overflow-hidden hover:border-[var(--accent)]/40 transition-all"
                                    >
                                        <div className="relative h-36 w-full overflow-hidden bg-[#10141B]">
                                            {img ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/15 to-[#1A1F26]" />
                                            )}
                                            {item.category && (
                                                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[var(--accent)] text-white text-[9px] font-bold rounded uppercase tracking-wider">
                                                    {item.category}
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-[14px] font-bold text-white leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                                                {item.title}
                                            </h3>
                                            {item.excerpt && (
                                                <p className="text-[12px] text-[#71717A] leading-relaxed line-clamp-2 mt-1.5">{item.excerpt}</p>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
