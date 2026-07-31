"use client";

import Link from "next/link";
import { Gamepad2, Facebook, Twitter, Instagram, Youtube, ArrowRight, ArrowUp } from "lucide-react";
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

const DISCORD_FALLBACK = "https://discord.gg/wPQG9gUMXH";

const NAV = [
    {
        heading: "Explore",
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
        heading: "Database",
        links: [
            { name: "All Games",        href: "/games" },
            { name: "Release Calendar", href: "/calendar" },
            { name: "WoW Analyzer",     href: "/wow-analyzer" },
            { name: "Backlog Advisor",  href: "/backlog-advisor" },
            { name: "Shop",             href: "/shop" },
        ],
    },
    {
        heading: "Community",
        links: [
            { name: "Forum",       href: "/forum" },
            { name: "Leaderboard", href: "/leaderboard" },
            { name: "Clans",       href: "/clans" },
            { name: "Discord",     href: DISCORD_FALLBACK },
        ],
    },
    {
        heading: "Company",
        links: [
            { name: "About Us",          href: "/about" },
            { name: "Contact",           href: "/contact" },
            { name: "Advertise With Us", href: "/marketing" },
            { name: "Our Rating System", href: "/rating-system" },
            { name: "Roadmap",           href: "/roadmap" },
        ],
    },
];

const LEGAL = [
    { name: "Privacy Policy",   href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookies",          href: "/cookies" },
    { name: "Impressum",        href: "/impressum" },
];

export default function Footer() {
    const { settings } = useSiteSettings();

    const socialLinks = Object.keys(SOCIAL_ICON_MAP)
        .filter(key => settings[key])
        .map(key => ({ ...SOCIAL_ICON_MAP[key], href: settings[key] || '#' }));

    const discordUrl = settings.discord_url || DISCORD_FALLBACK;

    return (
        <footer className="relative bg-[var(--surface-0)] border-t border-[var(--line)] overflow-hidden">
            {/* The Crown */}
            <span aria-hidden className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent" />
            {/* ambient depth */}
            <span aria-hidden className="absolute inset-0 bg-hud-grid opacity-50 pointer-events-none" />
            <span
                aria-hidden
                className="pointer-events-none absolute -top-40 left-[8%] w-[520px] h-[420px] rounded-full opacity-[0.07]"
                style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
            />

            <div className="relative container-page pt-14 pb-10">
                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12 lg:gap-16">

                    {/* Brand column */}
                    <div className="flex flex-col">
                        <Link href="/" className="flex items-center gap-3 group mb-5 w-fit">
                            <span className="w-10 h-10 bg-[var(--accent)] rounded-[var(--radius-inner)] flex items-center justify-center shadow-[var(--glow-accent)] group-hover:bg-[var(--accent-hover)] transition-colors duration-300">
                                <Gamepad2 className="w-5 h-5 text-white" strokeWidth={2} />
                            </span>
                            <span className="flex flex-col leading-none">
                                <span className="font-display font-bold text-[18px] text-[var(--ink-hi)] tracking-tight leading-none">TECHPLAY</span>
                                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--ink-low)] mt-[3px]">GAMING PORTAL</span>
                            </span>
                        </Link>

                        <p className="text-[13px] text-[var(--ink-low)] leading-relaxed mb-6 max-w-[280px]">
                            Your home for gaming news, honest reviews, release dates, and a community that actually cares about games.
                        </p>

                        {/* Discord CTA — the community door, and it earns the column its space */}
                        <Link
                            href={discordUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 p-3 rounded-[var(--radius-card)] bg-[var(--fill-1)] border border-[var(--line)] hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-colors duration-300 mb-6 max-w-[280px]"
                        >
                            <span className="shrink-0 w-9 h-9 rounded-[var(--radius-inner)] bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white transition-colors duration-300">
                                <DiscordIcon className="w-[18px] h-[18px]" />
                            </span>
                            <span className="flex-1 min-w-0">
                                <span className="block font-display text-[12px] font-bold text-[var(--ink-hi)]">Join our Discord</span>
                                <span className="block text-[11px] text-[var(--ink-faint)]">Talk games with the community</span>
                            </span>
                            <ArrowRight className="w-4 h-4 shrink-0 text-[var(--ink-faint)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all duration-300" />
                        </Link>

                        {socialLinks.length > 0 && (
                            <div className="flex items-center gap-2">
                                {socialLinks.map((s, i) => (
                                    <Link
                                        key={i}
                                        href={s.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={s.label}
                                        title={s.label}
                                        className="w-9 h-9 rounded-[var(--radius-inner)] bg-[var(--fill-2)] border border-[var(--line-strong)] flex items-center justify-center text-[var(--ink-low)] hover:text-white hover:bg-[var(--accent)] hover:border-transparent transition-colors duration-300"
                                    >
                                        <s.Icon className="w-[16px] h-[16px]" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Nav columns */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10">
                        {NAV.map((col) => (
                            <div key={col.heading}>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="w-1 h-4 rounded-full bg-[var(--accent)]" />
                                    <h4 className="font-display text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                                        {col.heading}
                                    </h4>
                                </div>
                                <ul className="flex flex-col gap-2.5">
                                    {col.links.map(item => (
                                        <li key={item.name}>
                                            <Link
                                                href={item.href}
                                                className="group inline-flex items-center gap-1.5 text-[13px] text-[var(--ink-low)] hover:text-[var(--ink-hi)] transition-colors duration-150"
                                            >
                                                {/* accent tick slides in on hover */}
                                                <span aria-hidden className="w-0 h-px bg-[var(--accent)] group-hover:w-2.5 transition-all duration-300 ease-[var(--ease-hud)]" />
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
            <div className="relative border-t border-[var(--line)]">
                <div className="container-page py-4 flex flex-col lg:flex-row items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                        <p className="text-[12px] text-[var(--ink-faint)]">
                            © {new Date().getFullYear()} TechPlay Gaming Portal
                        </p>
                        <span aria-hidden className="hidden sm:block w-px h-3 bg-[var(--line-strong)]" />
                        {LEGAL.map((l) => (
                            <Link
                                key={l.name}
                                href={l.href}
                                className="text-[12px] text-[var(--ink-faint)] hover:text-[var(--accent)] transition-colors duration-150"
                            >
                                {l.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <p className="text-[12px] text-[var(--ink-faint)]">
                            Made by{" "}
                            <Link href="https://luminor.agency" target="_blank" rel="noopener noreferrer" className="text-[var(--ink-low)] hover:text-[var(--accent)] transition-colors font-medium">
                                Luminor Solutions
                            </Link>
                        </p>
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                            aria-label="Back to top"
                            title="Back to top"
                            className="w-8 h-8 rounded-[var(--radius-inner)] bg-[var(--fill-2)] border border-[var(--line-strong)] flex items-center justify-center text-[var(--ink-low)] hover:text-white hover:bg-[var(--accent)] hover:border-transparent transition-colors duration-300"
                        >
                            <ArrowUp className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}
