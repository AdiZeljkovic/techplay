import { Metadata } from "next";
import Link from "next/link";
import { Map, ArrowRight, Calendar } from "lucide-react";

export const revalidate = 86400;

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg";

export const metadata: Metadata = {
    title: "GTA 6 Hub — News, Map & Info | TechPlay",
    description:
        "Everything GTA 6 in one place — interactive map, confirmed locations, release date info and latest news. Grand Theft Auto VI releases November 19, 2026.",
    openGraph: {
        title: "GTA 6 Hub | TechPlay",
        description: "Everything GTA 6 — interactive map, locations, release date and news.",
        url: `${SITE_URL}/gta6`,
        siteName: "TechPlay",
        type: "website",
    },
    alternates: { canonical: `${SITE_URL}/gta6` },
};

export default function Gta6HubPage() {
    return (
        <div className="min-h-screen bg-[#05070A]">
            {/* Hero */}
            <div className="relative bg-[#0B0E14] border-b border-[#161B22] overflow-hidden">
                <div className="absolute inset-0 bg-tech-grid opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent)]/5 via-transparent to-[#0B0E14]" />
                <div className="relative max-w-[1320px] mx-auto px-4 xl:px-8 py-16 md:py-24 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] text-[11px] font-bold uppercase tracking-widest mb-6">
                        <Calendar className="w-3 h-3" />
                        Releases November 19, 2026
                    </div>
                    <h1 className="font-display text-[40px] md:text-[64px] font-black text-white leading-none mb-4">
                        Grand Theft Auto VI
                    </h1>
                    <p className="text-[#A1A1AA] text-[17px] max-w-lg mx-auto">
                        Vice City returns. Explore everything we know about GTA 6 — locations, map, and the latest news.
                    </p>
                </div>
            </div>

            {/* Cards */}
            <div className="max-w-[1320px] mx-auto px-4 xl:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {/* Map card */}
                    <Link
                        href="/gta6/map"
                        className="group relative bg-[#0B0E14] border border-[#161B22] rounded-2xl p-6 hover:border-[var(--accent)]/40 transition-all overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mb-4">
                                <Map className="w-5 h-5 text-[var(--accent)]" />
                            </div>
                            <h2 className="font-display text-[20px] font-black text-white mb-2">Interactive Map</h2>
                            <p className="text-[#71717A] text-[13px] mb-4">
                                1,000+ confirmed locations across Vice City, Leonida Keys and beyond. Filter by category, search by name.
                            </p>
                            <span className="inline-flex items-center gap-1.5 text-[var(--accent)] text-[12px] font-semibold">
                                Explore map <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </div>
                    </Link>

                    {/* News card */}
                    <Link
                        href="/news?search=gta+6"
                        className="group relative bg-[#0B0E14] border border-[#161B22] rounded-2xl p-6 hover:border-white/20 transition-all overflow-hidden"
                    >
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-xl">
                                📰
                            </div>
                            <h2 className="font-display text-[20px] font-black text-white mb-2">GTA 6 News</h2>
                            <p className="text-[#71717A] text-[13px] mb-4">
                                Latest articles, trailers, leaks and official announcements about Grand Theft Auto VI.
                            </p>
                            <span className="inline-flex items-center gap-1.5 text-[#A1A1AA] text-[12px] font-semibold">
                                Read news <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
