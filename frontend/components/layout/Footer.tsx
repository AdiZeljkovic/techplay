"use client";

import Link from "next/link";
import { Facebook, Instagram, Youtube, ArrowRight, ArrowUp, Rss } from "lucide-react";
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

/** X, not the old bird — lucide still ships Twitter's. */
const XIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
    </svg>
);

/** Bluesky's butterfly. */
const BlueskyIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M5.769 3.383C8.322 5.298 11.07 9.18 12 11.264c.93-2.084 3.678-5.966 6.231-7.881C20.067 2.005 23 .935 23 4.28c0 .668-.383 5.611-.607 6.414-.783 2.79-3.628 3.502-6.158 3.071 4.421.752 5.546 3.245 3.116 5.738-4.615 4.734-6.634-1.187-7.151-2.705-.095-.278-.139-.408-.14-.297-.001-.111-.045.019-.14.297-.517 1.518-2.536 7.439-7.151 2.705-2.43-2.493-1.305-4.986 3.116-5.738-2.53.431-5.375-.281-6.158-3.071C1.383 9.891 1 4.948 1 4.28c0-3.345 2.933-2.275 4.769-.897z" />
    </svg>
);

/**
 * The social row, in the order it is shown. Discord is deliberately absent —
 * it has its own panel above, because it is where the community actually is
 * rather than another place to follow us.
 *
 * Each entry only renders when its URL is filled in the admin, so a network we
 * are not on yet leaves no dead icon behind.
 */
const SOCIAL_ICON_MAP: Record<string, { Icon: React.ComponentType<{ className?: string }>; label: string }> = {
    facebook_url:  { Icon: Facebook,     label: "Facebook" },
    instagram_url: { Icon: Instagram,    label: "Instagram" },
    youtube_url:   { Icon: Youtube,      label: "YouTube" },
    tiktok_url:    { Icon: TikTokIcon,   label: "TikTok" },
    bluesky_url:   { Icon: BlueskyIcon,  label: "Bluesky" },
    twitter_url:   { Icon: XIcon,        label: "X" },
};

const DISCORD_FALLBACK = "https://discord.gg/wPQG9gUMXH";

/**
 * What the footer is for now.
 *
 * It used to repeat the header: four columns of section links a reader had
 * already been given at the top of every page. This carries only what the bar
 * up there does not — who runs the site, how to reach us, and how to work with
 * us — laid out as one rail rather than a grid of columns.
 */
const ABOUT = [
    { name: "About Us",          href: "/about" },
    { name: "Contact",           href: "/contact" },
    { name: "Advertise With Us", href: "/marketing" },
    { name: "Media Kit",         href: "/media-kit" },
    { name: "Our Rating System", href: "/rating-system" },
    { name: "Roadmap",           href: "/roadmap" },
    { name: "Shop",              href: "/shop" },
    { name: "Support Us",        href: "/support" },
];

const LEGAL = [
    { name: "Privacy",   href: "/privacy" },
    { name: "Terms",     href: "/terms" },
    { name: "Cookies",   href: "/cookies" },
    { name: "Impressum", href: "/impressum" },
];

export default function Footer() {
    const { settings } = useSiteSettings();

    const socialLinks = Object.keys(SOCIAL_ICON_MAP)
        .filter((key) => settings[key])
        .map((key) => ({ ...SOCIAL_ICON_MAP[key], href: settings[key] || "#" }));

    const discordUrl = settings.discord_url || DISCORD_FALLBACK;

    return (
        <footer className="relative bg-[var(--surface-0)] border-t border-[var(--line)] overflow-hidden">
            {/* The crown, and a single wash of accent behind the wordmark */}
            <span aria-hidden className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent" />
            <span aria-hidden className="absolute inset-0 bg-hud-grid opacity-40 pointer-events-none" />
            <span
                aria-hidden
                className="pointer-events-none absolute -top-32 left-0 w-[560px] h-[380px] rounded-full opacity-[0.06]"
                style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
            />

            {/* ── Band: the brand on the left, the community door on the right ── */}
            <div className="relative container-page pt-8 md:pt-14 pb-7 md:pb-10">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 md:gap-10">
                    <div className="max-w-[440px]">
                        <Link href="/" className="group inline-block" aria-label="TechPlay — home">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/techplay-logo.png"
                                alt="TechPlay"
                                width={252}
                                height={42}
                                className="h-[34px] md:h-[42px] w-auto group-hover:brightness-110 transition-[filter]"
                            />
                        </Link>

                        <p className="mt-4 md:mt-5 text-[13px] md:text-[14px] text-[var(--ink-low)] leading-relaxed">
                            Your home for gaming news, honest reviews, release dates, and a
                            community that actually cares about games.
                        </p>
                    </div>

                    <div className="flex flex-col items-start lg:items-end gap-3">
                        <Link
                            href={discordUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group w-full sm:w-[320px] flex items-center gap-3 h-[56px] pl-3 pr-4 rounded-[var(--radius-card)] bg-[var(--fill-1)] border border-[var(--line)] hover:border-[color-mix(in_srgb,#5865F2_55%,transparent)] transition-colors duration-300"
                        >
                            {/* Discord's own blurple, not our accent — it is their
                                mark, and an orange tile made it read as our icon. */}
                            <span className="shrink-0 w-10 h-10 rounded-[var(--radius-inner)] flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-105" style={{ backgroundColor: "#5865F2" }}>
                                <DiscordIcon className="w-[22px] h-[22px]" />
                            </span>
                            <span className="flex-1 min-w-0">
                                <span className="block font-display text-[13px] font-bold text-[var(--ink-hi)] leading-tight">
                                    Join our Discord
                                </span>
                                <span className="block text-[11px] text-[var(--ink-faint)] leading-tight">
                                    Talk games with the community
                                </span>
                            </span>
                            <ArrowRight className="w-4 h-4 shrink-0 text-[var(--ink-faint)] group-hover:translate-x-0.5 transition-all duration-300" style={{ transitionProperty: "transform, color" }} />
                        </Link>

                        {socialLinks.length > 0 && (
                            <div className="w-full sm:w-[320px] grid grid-cols-6 gap-2">
                                {socialLinks.map((s) => (
                                    <Link
                                        key={s.label}
                                        href={s.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={s.label}
                                        title={s.label}
                                        className="h-[42px] rounded-[var(--radius-inner)] bg-[var(--fill-2)] border border-[var(--line-strong)] flex items-center justify-center text-[var(--ink-low)] hover:text-white hover:bg-[var(--accent)] hover:border-transparent transition-colors duration-300"
                                    >
                                        <s.Icon className="w-[17px] h-[17px]" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Rail: one line of links instead of a grid of columns ── */}
            <div className="relative border-t border-[var(--line)]">
                <nav aria-label="About TechPlay" className="container-page py-4 md:py-5">
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:flex sm:flex-wrap sm:items-center sm:gap-x-1 sm:gap-y-2">
                        {ABOUT.map((item, i) => (
                            <li key={item.name} className="flex items-center">
                                {i > 0 && (
                                    <span aria-hidden className="hidden sm:block w-1 h-1 mx-3 rounded-full bg-[var(--line-strong)]" />
                                )}
                                <Link
                                    href={item.href}
                                    className="font-display text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--ink-low)] hover:text-[var(--accent)] transition-colors duration-150"
                                >
                                    {item.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>

            {/* ── Small print ── */}
            <div className="relative border-t border-[var(--line)]">
                <div className="container-page py-4 flex flex-col lg:flex-row items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                        <p className="text-[12px] text-[var(--ink-faint)]">
                            © {new Date().getFullYear()} TechPlay
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
                        {/* The feed has existed all along and nothing pointed at it. */}
                        <a
                            href="/rss"
                            className="inline-flex items-center gap-1.5 text-[12px] text-[var(--ink-faint)] hover:text-[var(--accent)] transition-colors duration-150"
                        >
                            <Rss className="w-3.5 h-3.5" />
                            RSS
                        </a>
                        <span aria-hidden className="hidden sm:block w-px h-3 bg-[var(--line-strong)]" />
                        <p className="text-[12px] text-[var(--ink-faint)]">
                            Made by{" "}
                            <Link
                                href="https://luminor.agency"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--ink-low)] hover:text-[var(--accent)] transition-colors font-medium"
                            >
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
