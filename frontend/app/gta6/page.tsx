import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getServerApiUrl } from "@/lib/api";
import Gta6HubHero from "@/components/gta6/Gta6HubHero";
import Gta6HypeBar from "@/components/gta6/Gta6HypeBar";
import Gta6Trailers from "@/components/gta6/Gta6Trailers";
import Gta6PreOrder from "@/components/gta6/Gta6PreOrder";
import Gta6NotifyCTA from "@/components/gta6/Gta6NotifyCTA";
import {
    Map, Users, Car, Crosshair, BookOpen, ArrowRight, ChevronRight, Clapperboard,
} from "lucide-react";

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg";

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

async function fetchLocationCount(): Promise<number> {
    try {
        const res = await fetch(`${getServerApiUrl()}/gta6/locations`, {
            next: { revalidate: 86400 },
            headers: { Accept: "application/json" },
        });
        if (!res.ok) return 1058;
        const json = await res.json();
        return (json.data ?? []).length || 1058;
    } catch {
        return 1058;
    }
}

function newsImage(image: string | null): string | null {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    return `${process.env.NEXT_PUBLIC_STORAGE_URL}/${image}`;
}

export default async function Gta6HubPage() {
    const [news, locationCount] = await Promise.all([fetchGta6News(), fetchLocationCount()]);

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

            <div className="min-h-screen bg-[#05070A]">
                <Gta6HubHero />
                <Gta6HypeBar locations={locationCount} />

                {/* Bento explore grid */}
                <section className="max-w-[1320px] mx-auto px-4 xl:px-8 py-14">
                    <SectionHeading kicker="Explore" title="Everything GTA 6, in one place" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-7">
                        {/* Map — big feature */}
                        <Link href="/gta6/map" className="group relative md:col-span-2 rounded-2xl overflow-hidden border border-[#161B22] bg-[#0B0E14] gta6-card min-h-[260px] md:min-h-[320px]">
                            <div className="absolute inset-0 gta6-grid opacity-50" />
                            <div className="absolute inset-0 gta6-sunset opacity-40" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/40 to-transparent" />
                            <div className="relative h-full p-7 flex flex-col justify-end">
                                <div className="w-12 h-12 rounded-xl bg-[var(--gta-pink)]/15 border border-[var(--gta-pink)]/35 flex items-center justify-center mb-4">
                                    <Map className="w-6 h-6 text-[var(--gta-pink)]" />
                                </div>
                                <h3 className="font-display text-[26px] md:text-[32px] font-black text-white mb-2">Interactive Map</h3>
                                <p className="text-[#A1A1AA] text-[14px] max-w-md mb-4">
                                    <span className="text-white font-bold">{locationCount.toLocaleString()}</span> locations across Vice City &amp; Leonida — filter, search and explore in detail.
                                </p>
                                <span className="inline-flex items-center gap-1.5 text-[var(--gta-cyan)] text-[13px] font-bold">
                                    Open the map <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </div>
                        </Link>

                        {/* Characters — image feature */}
                        <Link href="/gta6/characters" className="group relative rounded-2xl overflow-hidden border border-[#161B22] bg-[#0B0E14] gta6-card min-h-[260px] md:min-h-[320px]">
                            <Image src="/gta6/hero.jpg" alt="GTA 6 characters" fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/40 to-transparent" />
                            <div className="relative h-full p-7 flex flex-col justify-end">
                                <div className="w-12 h-12 rounded-xl bg-[var(--gta-pink)]/20 border border-[var(--gta-pink)]/40 flex items-center justify-center mb-4 backdrop-blur-sm">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-display text-[24px] font-black text-white mb-1">Characters</h3>
                                <p className="text-[#D4D4D8] text-[13px] mb-3">Jason, Lucia &amp; the cast of Leonida</p>
                                <span className="inline-flex items-center gap-1.5 text-[var(--gta-cyan)] text-[13px] font-bold">
                                    Meet the cast <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </div>
                        </Link>

                        {/* Three smaller cards */}
                        <BentoCard href="/gta6/vehicles" icon={Car} title="Vehicles" desc="Cars, bikes, boats & aircraft" />
                        <BentoCard href="/gta6/weapons" icon={Crosshair} title="Weapons" desc="The confirmed arsenal" />
                        <BentoCard href="/gta6/everything-we-know" icon={BookOpen} title="Everything We Know" desc="Release date, story, map & more" />
                    </div>
                </section>

                {/* Trailers */}
                <section className="max-w-[1320px] mx-auto px-4 xl:px-8 pb-14">
                    <SectionHeading kicker="Watch" title="Official trailers" icon={Clapperboard} />
                    <div className="mt-7"><Gta6Trailers /></div>
                </section>

                {/* Pre-order */}
                <section className="max-w-[1320px] mx-auto px-4 xl:px-8 pb-14">
                    <Gta6PreOrder />
                </section>

                {/* Latest news */}
                {news.length > 0 && (
                    <section className="max-w-[1320px] mx-auto px-4 xl:px-8 pb-14">
                        <div className="flex items-center justify-between mb-7">
                            <SectionHeading kicker="Fresh" title="Latest GTA 6 news" noMargin />
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

                {/* Notify / Discord */}
                <section className="max-w-[1320px] mx-auto px-4 xl:px-8 pb-16">
                    <Gta6NotifyCTA />
                </section>
            </div>
        </>
    );
}

function SectionHeading({ kicker, title, icon: Icon, noMargin }: { kicker: string; title: string; icon?: React.ComponentType<{ className?: string }>; noMargin?: boolean }) {
    return (
        <div className={noMargin ? "" : ""}>
            <p className="text-[var(--gta-cyan)] font-bold tracking-[0.25em] text-[11px] uppercase mb-2 flex items-center gap-2">
                {Icon && <Icon className="w-3.5 h-3.5" />} {kicker}
            </p>
            <h2 className="font-display text-[26px] md:text-[34px] font-black text-white leading-tight">{title}</h2>
        </div>
    );
}

function BentoCard({ href, icon: Icon, title, desc }: { href: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
    return (
        <Link href={href} className="group relative rounded-2xl overflow-hidden border border-[#161B22] bg-[#0B0E14] gta6-card p-6 min-h-[160px] flex flex-col justify-between">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--gta-pink)]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-[var(--gta-pink)]/12 border border-[var(--gta-pink)]/30 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[var(--gta-pink)]" />
                </div>
                <h3 className="font-display text-[19px] font-black text-white mb-1 group-hover:text-[var(--gta-pink)] transition-colors">{title}</h3>
                <p className="text-[#71717A] text-[13px]">{desc}</p>
            </div>
            <span className="relative inline-flex items-center gap-1.5 text-[var(--gta-cyan)] text-[12px] font-bold mt-4">
                Open <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
        </Link>
    );
}
