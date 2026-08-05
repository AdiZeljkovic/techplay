import { MapPin, Calendar, ExternalLink, Map as MapIcon, Gamepad2 } from "lucide-react";

interface Gta6MapHeroProps {
    totalLocations: number;
}

const RELEASE_DATE = new Date("2026-11-19T00:00:00");

function getReleaseInfo(): { label: string; days: number } {
    const now = new Date();
    const diff = RELEASE_DATE.getTime() - now.getTime();
    if (diff <= 0) return { label: "Out Now", days: 0 };
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return { label: `${days} days left`, days };
}

export default function Gta6MapHero({ totalLocations }: Gta6MapHeroProps) {
    const release = getReleaseInfo();

    return (
        <div className="relative bg-[#0B0E14] border-b border-[#161B22] overflow-hidden gta6-grain">
            {/* Vice City flair */}
            <div className="absolute inset-0 gta6-grid opacity-30" />
            <div className="absolute inset-0 gta6-sunset opacity-40" />
            <div className="gta6-accent-line absolute top-0 left-0 right-0" />

            <div className="relative container-page py-4 md:py-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
                    {/* Left: icon + title */}
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex w-11 h-11 rounded-xl bg-[var(--gta-pink)]/15 border border-[var(--gta-pink)]/35 items-center justify-center shrink-0 gta6-glow-pink">
                            <MapIcon className="w-5 h-5 text-[var(--gta-pink)]" />
                        </div>
                        <div>
                            <h1 className="font-display text-[22px] md:text-[26px] font-black text-white leading-none">
                                GTA 6 Interactive Map
                            </h1>
                            <p className="text-[#71717A] text-[12px] md:text-[13px] mt-1">
                                Vice City · Leonida Keys · all known locations from trailers &amp; community
                            </p>
                        </div>
                    </div>

                    {/* Right: stat pills + attribution */}
                    <div className="flex items-center gap-2 md:gap-2.5 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#05070A] border border-[#161B22] text-[12px] text-[#A1A1AA]">
                            <MapPin className="w-3.5 h-3.5 text-[var(--gta-pink)]" />
                            <span className="text-white font-bold">{totalLocations.toLocaleString()}</span>
                            <span className="hidden sm:inline">locations</span>
                        </span>

                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--gta-pink)]/12 border border-[var(--gta-pink)]/30 text-[12px] text-[var(--gta-pink)] font-semibold">
                            <Calendar className="w-3.5 h-3.5" />
                            {release.days > 0 ? release.label : "Out Now"}
                        </span>

                        <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#05070A] border border-[#161B22] text-[12px] text-[#71717A]">
                            <Gamepad2 className="w-3.5 h-3.5" />
                            PS5 · Xbox Series X/S
                        </span>

                        <a
                            href="https://gtadb.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden md:inline-flex items-center gap-1 pl-2 text-[10px] text-[#4A4A55] hover:text-[var(--accent)] transition-colors leading-tight"
                            title="Map tiles & location data: GTADB.org (CC BY 4.0)"
                        >
                            GTADB.org <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
