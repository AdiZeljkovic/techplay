"use client";

import Link from "next/link";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const DiscordIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055A19.9 19.9 0 0 0 6.131 21.3a.077.077 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
);

export default function DiscordWidget() {
    const { settings } = useSiteSettings();
    const discordUrl = settings.discord_url || "https://discord.gg/wPQG9gUMXH";
    const siteName = settings.site_name || "TechPlay.gg";

    return (
        <aside className="w-full h-full flex flex-col bg-zinc-50/80 dark:bg-[#0B0E14]/80 backdrop-blur-md border border-zinc-200 dark:border-[#161B22] rounded-[24px] p-6 lg:p-8 relative overflow-hidden shadow-sm dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-colors duration-300">
            <div className="absolute top-0 right-[10%] w-[50%] h-[1px] bg-gradient-to-r from-transparent via-[#5865F2]/20 dark:via-[#5865F2]/40 to-transparent" />
            <div className="absolute -top-[100px] -right-[50px] w-[250px] h-[250px] bg-[#5865F2]/5 dark:bg-[#5865F2]/10 blur-[80px] rounded-full pointer-events-none" />

            <h2 className="text-[17px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-8 relative z-10">
                COMMUNITY DISCORD
            </h2>

            <div className="flex flex-col relative z-10 flex-1 px-1">
                <div className="flex items-center gap-5 mb-6">
                    <div className="w-[54px] h-[54px] rounded-[16px] bg-[#5865F2] flex items-center justify-center shrink-0 shadow-sm dark:shadow-lg dark:shadow-[#5865F2]/20">
                        <DiscordIcon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-zinc-900 dark:text-white font-bold text-[18px] leading-tight mb-1 block">{siteName}</span>
                        <span className="text-zinc-500 dark:text-[#8B949E] text-[13px]">Official Discord Server</span>
                    </div>
                </div>

                <p className="text-zinc-600 dark:text-[#A1A1AA] text-[14px] leading-relaxed mb-8 flex-1">
                    Join the conversation. Chat with the editors, find teammates, and discuss the latest gaming news and rumors in real-time.
                </p>

                <div className="flex flex-col gap-4 mb-2">
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-white/[0.04]">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#23a559] shadow-[0_0_8px_rgba(35,165,89,0.2)] dark:shadow-[0_0_8px_rgba(35,165,89,0.5)]" />
                            <span className="text-zinc-800 dark:text-[#E4E4E5] text-[14px] font-medium">Online Members</span>
                        </div>
                        <strong className="text-zinc-900 dark:text-white text-[15px] tracking-wide">1,248</strong>
                    </div>
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-white/[0.04]">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-400 dark:bg-[#80848e]" />
                            <span className="text-zinc-800 dark:text-[#E4E4E5] text-[14px] font-medium">Total Members</span>
                        </div>
                        <strong className="text-zinc-900 dark:text-white text-[15px] tracking-wide">15,402</strong>
                    </div>
                </div>
            </div>

            <Link
                href={discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 bg-[#5865F2] hover:bg-[#4752C4] text-white h-[46px] rounded font-bold transition-colors uppercase tracking-[0.08em] text-[12px] flex items-center justify-center shadow-lg shadow-[#5865F2]/20 relative z-10"
            >
                JOIN DISCORD
            </Link>
        </aside>
    );
}
