import { MapPin, Calendar, ExternalLink } from "lucide-react";

interface Gta6MapHeroProps {
    totalLocations: number;
}

const RELEASE_DATE = new Date("2026-11-19T00:00:00");

function getReleaseInfo(): { label: string; days: number } {
    const now = new Date();
    const diff = RELEASE_DATE.getTime() - now.getTime();
    if (diff <= 0) return { label: "Out Now", days: 0 };
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return { label: `${days} days until release`, days };
}

export default function Gta6MapHero({ totalLocations }: Gta6MapHeroProps) {
    const release = getReleaseInfo();

    return (
        <div className="relative bg-[#0B0E14] border-b border-[#161B22] overflow-hidden">
            {/* Background grid */}
            <div className="absolute inset-0 bg-tech-grid opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent)]/5 via-transparent to-[#0B0E14]" />
            <div className="absolute top-0 left-[5%] w-[90%] h-[1px] bg-gradient-to-r from-transparent via-[var(--accent)]/30 to-transparent" />

            <div className="relative max-w-[1320px] mx-auto px-4 xl:px-8 py-10 md:py-14">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        {/* Release badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] text-[11px] font-bold uppercase tracking-widest mb-4">
                            <Calendar className="w-3 h-3" />
                            {release.days > 0 ? `Releases Nov 19, 2026 · ${release.label}` : "Out Now"}
                        </div>

                        <h1 className="font-display text-[28px] md:text-[38px] font-black text-white leading-tight mb-2">
                            GTA 6 Interactive Map
                        </h1>
                        <p className="text-[#A1A1AA] text-[15px] max-w-xl">
                            All known locations from Grand Theft Auto VI — Vice City, Leonida Keys and beyond. Based on official trailers and community analysis.
                        </p>

                        {/* Stats */}
                        <div className="flex flex-wrap items-center gap-4 mt-4 text-[13px] text-[#71717A]">
                            <span className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
                                <span className="text-white font-bold">{totalLocations.toLocaleString()}</span> locations
                            </span>
                            <span>•</span>
                            <span>PS5 · Xbox Series X/S · Nov 19, 2026</span>
                        </div>
                    </div>

                    {/* Attribution */}
                    <div className="shrink-0 text-[11px] text-[#4A4A55] text-right leading-relaxed">
                        <p>Map tiles &amp; location data:</p>
                        <a
                            href="https://gtadb.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#71717A] hover:text-[var(--accent)] transition-colors"
                        >
                            GTADB.org <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        <p className="mt-0.5">CC BY 4.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
