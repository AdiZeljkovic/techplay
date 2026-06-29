"use client";

import Link from "next/link";
import { Gamepad2, Facebook, Twitter, Instagram, Youtube } from "lucide-react";
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

const SOCIAL_ICON_MAP: Record<string, { Icon: React.ComponentType<{ className?: string }>; label: string }> = {
    twitter_url:   { Icon: Twitter,     label: "Twitter" },
    facebook_url:  { Icon: Facebook,    label: "Facebook" },
    instagram_url: { Icon: Instagram,   label: "Instagram" },
    youtube_url:   { Icon: Youtube,     label: "YouTube" },
    discord_url:   { Icon: DiscordIcon, label: "Discord" },
    tiktok_url:    { Icon: TikTokIcon,  label: "TikTok" },
};

const NAV = [
    {
        heading: "EXPLORE",
        links: [
            { name: "News",         href: "/news" },
            { name: "Reviews",      href: "/reviews" },
            { name: "Videos",       href: "/videos" },
            { name: "Guides",       href: "/guides" },
            { name: "Hardware Lab", href: "/hardware" },
            { name: "GTA 6 Hub",    href: "/gta6" },
            { name: "Giveaways",    href: "/giveaways" },
        ],
    },
    {
        heading: "DATABASE",
        links: [
            { name: "All Games",        href: "/games" },
            { name: "Release Calendar", href: "/calendar" },
            { name: "WoW Analyzer",     href: "/wow-analyzer" },
            { name: "Backlog Advisor",  href: "/backlog-advisor" },
            { name: "Shop",             href: "/shop" },
        ],
    },
    {
        heading: "COMMUNITY",
        links: [
            { name: "Forum",       href: "/forum" },
            { name: "Leaderboard", href: "/leaderboard" },
            { name: "Clans",       href: "/clans" },
            { name: "Discord",     href: "https://discord.gg/wPQG9gUMXH" },
        ],
    },
    {
        heading: "SUPPORT",
        links: [
            { name: "About Us",         href: "/about" },
            { name: "Contact",          href: "/contact" },
            { name: "Roadmap",          href: "/roadmap" },
            { name: "Privacy Policy",   href: "/privacy" },
            { name: "Terms of Service", href: "/terms" },
        ],
    },
];

export default function Footer() {
    const { settings } = useSiteSettings();

    const socialLinks = Object.keys(SOCIAL_ICON_MAP)
        .filter(key => settings[key])
        .map(key => ({ ...SOCIAL_ICON_MAP[key], href: settings[key] || '#' }));

    return (
        <footer className="relative bg-[#070A10] border-t border-white/[0.06] overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute -top-[200px] left-[10%] w-[500px] h-[400px] bg-tp-accent/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute -top-[100px] right-[15%] w-[300px] h-[300px] bg-blue-500/3 blur-[100px] rounded-full pointer-events-none" />

            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-tp-accent/60 to-transparent" />

            <div className="relative max-w-[1320px] mx-auto px-4 xl:px-0 pt-16 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-16">

                    {/* Brand column */}
                    <div className="flex flex-col">
                        <Link href="/" className="flex items-center gap-3 group mb-5">
                            <div className="w-10 h-10 bg-tp-accent rounded-lg flex items-center justify-center shadow-lg shadow-tp-accent/30 group-hover:bg-tp-accent-hover transition-colors">
                                <Gamepad2 className="w-5 h-5 text-white" strokeWidth={2} />
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="font-display font-bold text-[18px] text-white tracking-tight leading-none">TECHPLAY</span>
                                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mt-[3px]">GAMING PORTAL</span>
                            </div>
                        </Link>

                        <p className="text-[13px] text-[#6B7280] leading-relaxed mb-8 max-w-[260px]">
                            Your home for gaming news, honest reviews, release dates, and a community that actually cares about games.
                        </p>

                        {/* Social icons */}
                        {socialLinks.length > 0 && (
                            <div className="flex items-center gap-2">
                                {socialLinks.map((s, i) => (
                                    <Link
                                        key={i}
                                        href={s.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={s.label}
                                        className="w-9 h-9 rounded-lg bg-white/5 border border-white/[0.08] flex items-center justify-center text-[#6B7280] hover:text-white hover:bg-tp-accent/10 hover:border-tp-accent/30 transition-all duration-200"
                                    >
                                        <s.Icon className="w-[16px] h-[16px]" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Nav columns */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {NAV.map((col) => (
                            <div key={col.heading}>
                                <div className="flex items-center gap-2 mb-5">
                                    <span className="w-[3px] h-3 rounded-full bg-tp-accent" />
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.14em] text-white">
                                        {col.heading}
                                    </h4>
                                </div>
                                <ul className="flex flex-col gap-3">
                                    {col.links.map(item => (
                                        <li key={item.name}>
                                            <Link
                                                href={item.href}
                                                className="text-[13px] text-[#6B7280] hover:text-white transition-colors duration-150 hover:translate-x-0.5 inline-block"
                                            >
                                                {item.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="relative border-t border-white/[0.06]">
                <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-[12px] text-[#4B5563]">
                        © 2026 TechPlay Gaming Portal. All rights reserved.
                    </p>
                    <p className="text-[12px] text-[#4B5563]">
                        Made by <Link href="https://luminor.agency" target="_blank" rel="noopener noreferrer" className="text-[#6B7280] hover:text-white transition-colors font-medium">Luminor Solutions</Link>
                    </p>
                </div>
            </div>
        </footer>
    );
}
