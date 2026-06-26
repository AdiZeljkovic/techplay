import Link from "next/link";
import { MessageCircle, Bell, ArrowRight } from "lucide-react";

const DISCORD_URL = "https://discord.gg/techplaygg";

export default function Gta6NotifyCTA() {
    return (
        <div className="relative rounded-2xl overflow-hidden border border-[#161B22] bg-[#0B0E14] gta6-grain">
            <div className="absolute inset-0 gta6-grid opacity-40 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--gta-violet)]/15 via-transparent to-[var(--gta-pink)]/15 pointer-events-none" />
            <div className="relative p-8 md:p-10 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--gta-pink)]/15 border border-[var(--gta-pink)]/35 mb-4">
                    <Bell className="w-5 h-5 text-[var(--gta-pink)]" />
                </div>
                <h2 className="font-display text-[26px] md:text-[34px] font-black text-white leading-tight mb-3">
                    Don&apos;t miss a single GTA 6 drop
                </h2>
                <p className="text-[#A1A1AA] text-[14px] md:text-[15px] max-w-xl mx-auto mb-7">
                    New trailers, leaks, map updates and release news — straight to our community.
                    Join the TechPlay Discord and turn on GTA 6 alerts.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <a
                        href={DISCORD_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#5865F2] text-white text-[14px] font-bold hover:bg-[#4752c4] transition-colors"
                    >
                        <MessageCircle className="w-4 h-4" /> Join the Discord
                    </a>
                    <Link
                        href="/news?search=gta+6"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/8 border border-white/20 text-white text-[14px] font-bold hover:border-[var(--gta-cyan)]/60 transition-colors"
                    >
                        Follow the News <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
