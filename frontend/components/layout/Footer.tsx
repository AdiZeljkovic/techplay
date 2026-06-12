"use client";

import Link from "next/link";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const DiscordIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055A19.9 19.9 0 0 0 6.131 21.3a.077.077 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
    </svg>
);

const SOCIAL_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    twitter_url:   Twitter,
    facebook_url:  Facebook,
    instagram_url: Instagram,
    youtube_url:   Youtube,
    discord_url:   DiscordIcon,
    tiktok_url:    TikTokIcon,
};

const FOOTER_LINKS = {
    explore: [
        { name: "News",             href: "/news" },
        { name: "Reviews",          href: "/reviews" },
        { name: "Games",            href: "/games" },
        { name: "Release Calendar", href: "/calendar" },
        { name: "Hardware Lab",     href: "/hardware" },
        { name: "Guides",           href: "/guides" },
    ],
    database: [
        { name: "All Games",    href: "/games" },
        { name: "Platforms",    href: "/games" },
        { name: "Genres",       href: "/games" },
        { name: "Developers",   href: "/games" },
    ],
    community: [
        { name: "Forum",        href: "/forum" },
        { name: "Leaderboard",  href: "/leaderboard" },
        { name: "Achievements", href: "/leaderboard" },
        { name: "Discord",      href: "https://discord.gg/wPQG9gUMXH" },
    ],
    support: [
        { name: "About Us",         href: "/about" },
        { name: "Contact",          href: "/contact" },
        { name: "Privacy Policy",   href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
    ],
};

export default function Footer() {
    const { settings } = useSiteSettings();

    const socialLinks = Object.keys(SOCIAL_ICON_MAP)
        .filter(key => settings[key])
        .map(key => ({ Icon: SOCIAL_ICON_MAP[key], href: settings[key] || '#' }));

    return (
        <footer className="bg-zinc-50 dark:bg-[#0B0E14] border-t border-zinc-200 dark:border-[#12161E] pt-16 pb-0 transition-colors duration-300">
            <div className="max-w-[1320px] mx-auto px-4 xl:px-0">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">

                    {/* Brand column */}
                    <div className="flex flex-col max-w-sm flex-1">
                        <Link href="/" className="font-display font-bold text-[22px] tracking-tight flex items-center mb-4">
                            <span className="text-zinc-900 dark:text-white">TECH</span>
                            <span className="text-tp-accent">PLAY</span>
                            <span className="text-zinc-500 dark:text-slate-400 text-sm ml-[1px] mt-[1px]">.GG</span>
                        </Link>
                        <p className="text-zinc-500 dark:text-[#A1A1AA] text-[13px] leading-relaxed mb-6 max-w-[280px]">
                            Your gaming hub for news, reviews, releases, database and community.
                        </p>
                        <div className="flex items-center gap-[18px]">
                            {socialLinks.map((s, i) => (
                                <Link
                                    key={i}
                                    href={s.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-zinc-500 dark:text-[#A1A1AA] hover:text-[#FC4100] transition-colors"
                                >
                                    <s.Icon className="w-[18px] h-[18px]" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* 4-col nav grid */}
                    <div className="flex-[2] grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="flex flex-col gap-4">
                            <h4 className="font-sans font-bold uppercase tracking-wider text-zinc-900 dark:text-white text-[11px] mb-1">EXPLORE</h4>
                            {FOOTER_LINKS.explore.map(item => (
                                <Link key={item.name} href={item.href} className="text-[13px] text-zinc-500 dark:text-[#A1A1AA] hover:text-[#FC4100] transition-colors">{item.name}</Link>
                            ))}
                        </div>
                        <div className="flex flex-col gap-4">
                            <h4 className="font-sans font-bold uppercase tracking-wider text-zinc-900 dark:text-white text-[11px] mb-1">DATABASE</h4>
                            {FOOTER_LINKS.database.map(item => (
                                <Link key={item.name} href={item.href} className="text-[13px] text-zinc-500 dark:text-[#A1A1AA] hover:text-[#FC4100] transition-colors">{item.name}</Link>
                            ))}
                        </div>
                        <div className="flex flex-col gap-4">
                            <h4 className="font-sans font-bold uppercase tracking-wider text-zinc-900 dark:text-white text-[11px] mb-1">COMMUNITY</h4>
                            {FOOTER_LINKS.community.map(item => (
                                <Link key={item.name} href={item.href} className="text-[13px] text-zinc-500 dark:text-[#A1A1AA] hover:text-[#FC4100] transition-colors">{item.name}</Link>
                            ))}
                        </div>
                        <div className="flex flex-col gap-4">
                            <h4 className="font-sans font-bold uppercase tracking-wider text-zinc-900 dark:text-white text-[11px] mb-1">SUPPORT</h4>
                            {FOOTER_LINKS.support.map(item => (
                                <Link key={item.name} href={item.href} className="text-[13px] text-zinc-500 dark:text-[#A1A1AA] hover:text-[#FC4100] transition-colors">{item.name}</Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="w-full border-t border-zinc-200 dark:border-[#12161E] mt-12 py-3 bg-zinc-100/50 dark:bg-[#0B0E14]/40 transition-colors duration-300">
                <div className="max-w-[1320px] mx-auto px-4 xl:px-0 flex flex-col md:flex-row items-center justify-between gap-2">
                    <p className="text-[12px] text-zinc-500 dark:text-[#A1A1AA]">
                        © 2026 TechPlay Gaming Portal. All rights reserved.
                    </p>
                    <p className="text-[12px] text-zinc-500 dark:text-[#A1A1AA]">
                        Made by <span className="text-zinc-900 dark:text-white font-medium">Luminor Solutions</span>
                    </p>
                </div>
            </div>
        </footer>
    );
}
