import type { Metadata } from "next";
import { ArrowUpRight, Heart, LifeBuoy } from "lucide-react";
import { HELP_URL, SITE_URL } from "@/lib/help";

/**
 * The chrome the help centre wears instead of the site's.
 *
 * `AppShell` hides the main header, footer and tab bar under /help, and this
 * puts something honest in their place. That is not a style preference — it is
 * the only arrangement that works across two hostnames.
 *
 * The site header's links are written as bare paths: /news, /games, /forum. On
 * techplay.gg those are correct. On help.techplay.gg the host rewrite maps
 * every path onto /help/*, so `/news` would resolve to the help topic "news",
 * which does not exist — the entire navigation would 404, and a crawler
 * indexing this hostname would find a page whose every link is broken.
 *
 * So every link that leaves this section is **absolute** and names
 * techplay.gg. Every link that stays is a bare path, because the browser is
 * already on the subdomain. Nothing here is a bare path to the main site, and
 * nothing here is an absolute URL to the help centre.
 */

const nav = [
    { label: "News", href: `${SITE_URL}/news` },
    { label: "Reviews", href: `${SITE_URL}/reviews` },
    { label: "Games", href: `${SITE_URL}/games` },
    { label: "Forum", href: `${SITE_URL}/forum` },
];

const legal = [
    { label: "Privacy", href: `${SITE_URL}/privacy` },
    { label: "Terms", href: `${SITE_URL}/terms` },
    { label: "Cookies", href: `${SITE_URL}/cookies` },
    { label: "Impressum", href: `${SITE_URL}/impressum` },
];

/**
 * The whole subdomain is one property, and this is what it is called.
 *
 * Applied to every page under it unless a page overrides it, which is also
 * where `metadataBase` comes from — without it a relative canonical or OG URL
 * would resolve against techplay.gg and point every page on this host at the
 * wrong one.
 */
export const metadata: Metadata = {
    metadataBase: new URL(HELP_URL),
    title: { default: "TechPlay Help Centre", template: "%s | TechPlay Help" },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col" style={{ background: "var(--surface-0)" }}>
            <header
                className="sticky top-0 z-40 border-b backdrop-blur"
                style={{ background: "color-mix(in srgb, var(--surface-0) 88%, transparent)", borderColor: "var(--line)" }}
            >
                <div className="container-page h-14 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <a href={SITE_URL} className="shrink-0" aria-label="TechPlay">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`${SITE_URL}/techplay-logo.png`} alt="TechPlay" className="h-7 w-auto" />
                        </a>

                        <span aria-hidden className="h-5 w-px shrink-0" style={{ background: "var(--line-strong)" }} />

                        <a
                            href="/"
                            className="flex items-center gap-2 min-w-0 font-display text-[12px] font-black uppercase tracking-[0.14em] text-[var(--ink-hi)] hover:text-[var(--accent)] transition-colors"
                        >
                            <LifeBuoy className="w-4 h-4 shrink-0 text-[var(--accent)]" aria-hidden />
                            <span className="truncate">Help centre</span>
                        </a>
                    </div>

                    <a
                        href={`${SITE_URL}/contact?from=help`}
                        className="shrink-0 inline-flex items-center gap-1.5 font-display text-[10.5px] font-black uppercase tracking-[0.12em] transition-colors hover:text-[var(--ink-hi)]"
                        style={{ color: "var(--ink-low)" }}
                    >
                        Contact
                        <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
                    </a>
                </div>
            </header>

            <main className="flex-grow">{children}</main>

            <footer className="border-t mt-16" style={{ borderColor: "var(--line)" }}>
                <div className="container-page py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <h2 className="font-display text-[11px] font-black uppercase tracking-[0.14em] text-[var(--ink-hi)]">
                            Help centre
                        </h2>
                        <ul className="mt-3 space-y-2 text-[13px]">
                            <li>
                                <a href="/" className="hover:text-[var(--accent)] transition-colors" style={{ color: "var(--ink-low)" }}>
                                    All topics
                                </a>
                            </li>
                            <li>
                                {/* The index, at its search field — not /search,
                                    which without a query is a blank page whose
                                    only content is an apology for existing. The
                                    fragment is what keeps this a different
                                    destination from "All topics" above. */}
                                <a href="/#help-q" className="hover:text-[var(--accent)] transition-colors" style={{ color: "var(--ink-low)" }}>
                                    Search
                                </a>
                            </li>
                            <li>
                                <a
                                    href={`${SITE_URL}/contact?from=help`}
                                    className="hover:text-[var(--accent)] transition-colors"
                                    style={{ color: "var(--ink-low)" }}
                                >
                                    Contact us
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="font-display text-[11px] font-black uppercase tracking-[0.14em] text-[var(--ink-hi)]">
                            TechPlay
                        </h2>
                        <ul className="mt-3 space-y-2 text-[13px]">
                            {nav.map((item) => (
                                <li key={item.href}>
                                    <a
                                        href={item.href}
                                        className="hover:text-[var(--accent)] transition-colors"
                                        style={{ color: "var(--ink-low)" }}
                                    >
                                        {item.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/*
                     * Said out loud, because the two names are one keystroke
                     * apart and mean opposite things: help.techplay.gg is this,
                     * techplay.gg/support takes donations. Somebody who wanted
                     * the second and landed on the first should not have to
                     * guess, and for eight months the search result for
                     * /support promised them a support centre instead.
                     */}
                    <div>
                        <h2 className="font-display text-[11px] font-black uppercase tracking-[0.14em] text-[var(--ink-hi)]">
                            Looking to back the site?
                        </h2>
                        <p className="mt-3 text-[13px] leading-relaxed" style={{ color: "var(--ink-low)" }}>
                            This is the help centre. Donations and supporter tiers are somewhere else.
                        </p>
                        <a
                            href={`${SITE_URL}/support`}
                            className="mt-3 inline-flex items-center gap-2 font-display text-[11px] font-black uppercase tracking-[0.12em] text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                        >
                            <Heart className="w-3.5 h-3.5" aria-hidden />
                            Support us
                        </a>
                    </div>
                </div>

                <div className="border-t" style={{ borderColor: "var(--line)" }}>
                    <div className="container-page py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[12px]" style={{ color: "var(--ink-low)" }}>
                        <p>© {new Date().getFullYear()} TechPlay</p>
                        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            {legal.map((item) => (
                                <li key={item.href}>
                                    <a href={item.href} className="hover:text-[var(--accent)] transition-colors">
                                        {item.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </footer>
        </div>
    );
}
