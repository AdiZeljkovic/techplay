import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getServerApiUrl } from "@/lib/api";
import Gta6HubHero from "@/components/gta6/Gta6HubHero";
import Gta6HypeBar, { type HypeStat } from "@/components/gta6/Gta6HypeBar";
import Gta6Trailers from "@/components/gta6/Gta6Trailers";
import Gta6PreOrder from "@/components/gta6/Gta6PreOrder";
import Gta6NewsletterCTA from "@/components/gta6/Gta6NewsletterCTA";
import {
    Map, Users, Car, Crosshair, BookOpen, Gamepad2, ArrowRight, ChevronRight,
} from "lucide-react";

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg";
const RELEASE_DATE = new Date("2026-11-19T00:00:00");
const TRAILER_COUNT = 2;

export const metadata: Metadata = {
    title: "GTA 6 Hub — Map, Characters, Vehicles, Weapons & Countdown | TechPlay",
    description:
        "The ultimate Grand Theft Auto VI hub — interactive map, characters, vehicles, weapons, live release countdown, trailers and the latest GTA 6 news. Releases November 19, 2026.",
    openGraph: {
        title: "GTA 6 Hub | TechPlay",
        description: "Interactive map, characters, vehicles, weapons, countdown, trailers and the latest GTA 6 news.",
        url: `${SITE_URL}/gta6`,
        siteName: "TechPlay",
        type: "website",
        images: [{ url: `${SITE_URL}/gta6/hero.jpg` }],
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

async function fetchJson(path: string, revalidate = 3600): Promise<unknown> {
    try {
        const res = await fetch(`${getServerApiUrl()}${path}`, {
            next: { revalidate },
            headers: { Accept: "application/json" },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

function newsImage(image: string | null): string | null {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    return `${process.env.NEXT_PUBLIC_STORAGE_URL}/${image}`;
}

function daysToLaunch(): number {
    const diff = RELEASE_DATE.getTime() - Date.now();
    return diff <= 0 ? 0 : Math.ceil(diff / 86400000);
}

export default async function Gta6HubPage() {
    const [newsJson, locJson, charJson] = await Promise.all([
        fetchJson(`/search/articles?q=${encodeURIComponent("gta 6")}`),
        fetchJson(`/gta6/locations`, 86400),
        fetchJson(`/gta6/characters`, 86400),
    ]);

    const news: NewsItem[] = ((newsJson as { results?: NewsItem[] })?.results ?? []).slice(0, 4);
    const locationCount = ((locJson as { data?: unknown[] })?.data ?? []).length || 1058;
    const characterCount = ((charJson as { data?: unknown[] })?.data ?? []).length || 0;

    const stats: HypeStat[] = [
        { icon: "Hourglass",    value: daysToLaunch(),  label: "Days to launch", sub: "Until Nov 19" },
        { icon: "MapPin",       value: locationCount,   label: "Map locations",  sub: "Vice City & Leonida" },
        { icon: "Users",        value: characterCount,  label: "Characters",     sub: "Confirmed cast" },
        { icon: "Clapperboard", value: TRAILER_COUNT,   label: "Trailers",       sub: "Official" },
        { icon: "Newspaper",    value: news.length,     label: "News",           sub: "Latest updates" },
    ];

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
        "image": `${SITE_URL}/gta6/hero.jpg`,
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <div className="min-h-screen bg-[#05070A] pb-16">
                <Gta6HubHero />
                <Gta6HypeBar stats={stats} />

                {/* Bento explore grid */}
                <section className="max-w-[1320px] mx-auto px-4 xl:px-8 py-14">
                    <SectionHeading kicker="Explore" title="Explore the GTA 6 Hub" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-7">
                        {/* Map — big feature */}
                        <Link href="/gta6/map" className="group relative md:col-span-2 rounded-2xl overflow-hidden border border-[#161B22] bg-[#0B0E14] gta6-card min-h-[240px] md:min-h-[300px]">
                            <Image src="/gta6/card-map.png" alt="GTA 6 interactive map" fill sizes="(max-width:768px) 100vw, 66vw" className="object-cover group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/55 to-[#05070A]/10" />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#05070A]/70 to-transparent" />
                            <div className="relative h-full p-7 flex flex-col justify-end">
                                <div className="w-12 h-12 rounded-xl bg-[var(--gta-pink)]/15 border border-[var(--gta-pink)]/35 flex items-center justify-center mb-4">
                                    <Map className="w-6 h-6 text-[var(--gta-pink)]" />
                                </div>
                                <h3 className="font-display text-[24px] md:text-[30px] font-black text-white mb-2">Interactive Map</h3>
                                <p className="text-[#A1A1AA] text-[14px] max-w-md mb-4">
                                    Explore Vice City and beyond — <span className="text-white font-bold">{locationCount.toLocaleString()}</span> points of interest, locations and more.
                                </p>
                                <span className="inline-flex items-center gap-1.5 text-[var(--gta-cyan)] text-[13px] font-bold">
                                    Open map <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </div>
                        </Link>

                        {/* Characters — image feature */}
                        <Link href="/gta6/characters" className="group relative rounded-2xl overflow-hidden border border-[#161B22] bg-[#0B0E14] gta6-card min-h-[240px] md:min-h-[300px]">
                            <Image src="/gta6/hero.jpg" alt="GTA 6 characters" fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/40 to-transparent" />
                            <div className="relative h-full p-7 flex flex-col justify-end">
                                <h3 className="font-display text-[24px] font-black text-white mb-1">Characters</h3>
                                <p className="text-[#D4D4D8] text-[13px] mb-3">Meet Lucia, Jason and the rest of the cast.</p>
                                <span className="inline-flex items-center gap-1.5 text-[var(--gta-cyan)] text-[13px] font-bold">
                                    View characters <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </div>
                        </Link>

                        {/* Smaller cards */}
                        <BentoCard href="/gta6/vehicles" icon={Car} title="Vehicles" desc="Cars, bikes, boats & much more." cta="View all" image="/gta6/card-vehicles.png" />
                        <BentoCard href="/gta6/weapons" icon={Crosshair} title="Weapons" desc="All confirmed weapons." cta="View all" image="/gta6/card-weapons.png" />
                        <BentoCard href="/gta6/everything-we-know" icon={Gamepad2} title="Gameplay" desc="Gameplay features, mechanics & more." cta="Learn more" image="/gta6/card-gameplay.png" />
                        <BentoCard href="/gta6/everything-we-know" icon={BookOpen} title="Everything We Know" desc="A complete summary of all confirmed info." cta="Read now" image="/gta6/card-everything.png" />
                    </div>
                </section>

                {/* Trailers */}
                <section id="trailers" className="max-w-[1320px] mx-auto px-4 xl:px-8 pb-14 scroll-mt-24">
                    <div className="flex items-center justify-between mb-7">
                        <SectionHeading kicker="Watch" title="Official Trailers" noMargin />
                        <a href="https://www.youtube.com/@RockstarGames" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#71717A] hover:text-[var(--gta-pink)] text-[13px] font-semibold transition-colors">
                            View all <ChevronRight className="w-4 h-4" />
                        </a>
                    </div>
                    <Gta6Trailers />
                </section>

                {/* Pre-order */}
                <section className="max-w-[1320px] mx-auto px-4 xl:px-8 pb-14">
                    <Gta6PreOrder />
                </section>

                {/* Latest news */}
                {news.length > 0 && (
                    <section className="max-w-[1320px] mx-auto px-4 xl:px-8 pb-14">
                        <div className="flex items-center justify-between mb-7">
                            <SectionHeading kicker="Fresh" title="Latest GTA 6 News" noMargin />
                            <Link href="/news?search=gta+6" className="inline-flex items-center gap-1 text-[#71717A] hover:text-[var(--gta-pink)] text-[13px] font-semibold transition-colors">
                                View all <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {news.map(item => {
                                const img = newsImage(item.image);
                                return (
                                    <Link key={item.id} href={item.url} className="group rounded-xl overflow-hidden border border-[#161B22] bg-[#0B0E14] gta6-card">
                                        <div className="relative h-36 w-full overflow-hidden bg-[#10141B]">
                                            {img ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={img} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="absolute inset-0 gta6-sunset opacity-60" />
                                            )}
                                            {item.category && (
                                                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[var(--gta-pink)] text-white text-[9px] font-bold rounded uppercase tracking-wider">{item.category}</span>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-[14px] font-bold text-white leading-snug line-clamp-2 group-hover:text-[var(--gta-pink)] transition-colors">{item.title}</h3>
                                            {item.excerpt && <p className="text-[12px] text-[#71717A] leading-relaxed line-clamp-2 mt-1.5">{item.excerpt}</p>}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Newsletter */}
                <section className="max-w-[1320px] mx-auto px-4 xl:px-8">
                    <Gta6NewsletterCTA />
                </section>
            </div>
        </>
    );
}

function SectionHeading({ kicker, title, noMargin }: { kicker: string; title: string; noMargin?: boolean }) {
    return (
        <div className={noMargin ? "" : ""}>
            <p className="text-[var(--gta-cyan)] font-bold tracking-[0.25em] text-[11px] uppercase mb-2">{kicker}</p>
            <h2 className="font-display text-[24px] md:text-[32px] font-black text-white leading-tight">{title}</h2>
        </div>
    );
}

function BentoCard({ href, icon: Icon, title, desc, cta, image }: { href: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string; cta: string; image?: string }) {
    return (
        <Link href={href} className="group relative rounded-2xl overflow-hidden border border-[#161B22] bg-[#0B0E14] gta6-card p-6 min-h-[190px] flex flex-col justify-end">
            {image ? (
                <>
                    <Image src={image} alt={title} fill sizes="(max-width:768px) 100vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/55 to-[#05070A]/10" />
                </>
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--gta-pink)]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
            <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-[var(--gta-pink)]/15 border border-[var(--gta-pink)]/35 flex items-center justify-center mb-3 backdrop-blur-sm">
                    <Icon className="w-5 h-5 text-[var(--gta-pink)]" />
                </div>
                <h3 className="font-display text-[18px] font-black text-white mb-1 group-hover:text-[var(--gta-pink)] transition-colors">{title}</h3>
                <p className="text-[#D4D4D8] text-[12px] leading-relaxed">{desc}</p>
                <span className="inline-flex items-center gap-1.5 text-[var(--gta-cyan)] text-[12px] font-bold mt-3">
                    {cta} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
            </div>
        </Link>
    );
}
