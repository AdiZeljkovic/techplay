import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const LINKS = [
    { art: "/quicklinks/game-database.webp",    title: "Game Database",    sub: "Search & discover 200,000+ games",   href: "/games",    cta: "Browse games" },
    { art: "/quicklinks/release-calendar.webp", title: "Release Calendar", sub: "Track upcoming game releases",       href: "/calendar", cta: "See what's next" },
    { art: "/quicklinks/my-games.webp",         title: "My Games",         sub: "Build your library and watchlist",   href: "/login",    cta: "Start tracking" },
    { art: "/quicklinks/community.webp",        title: "Community",        sub: "Forums, reviews & player discussions", href: "/forum",  cta: "Join the talk" },
];

/**
 * Platform quick links — four centred destination cards.
 *
 * The cards themselves do not move. The art already carries its own tile and
 * glow, and stacking a wash, a crown and a scale on top of it was three
 * effects competing for the same square. The button is the one thing that
 * responds, and it is accent-coloured at rest so the card reads as an action
 * before anyone hovers it.
 */
export default function QuickLinksBand() {
    return (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {LINKS.map((link) => (
                <Link
                    key={link.title}
                    href={link.href}
                    className="group relative overflow-hidden flex flex-col items-center text-center rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] p-5 pb-4"
                >
                    {/* The art brings its own tile and its own glow, so there is
                        no plate to draw around it. */}
                    <Image
                        src={link.art}
                        alt=""
                        aria-hidden
                        width={128}
                        height={128}
                        className="relative w-16 h-16"
                        unoptimized
                    />

                    <p className="relative mt-4 font-display text-[15px] font-bold text-[var(--ink-hi)] leading-tight">
                        {link.title}
                    </p>
                    <p className="relative mt-1 text-[12px] text-[var(--ink-low)] leading-snug max-w-[220px]">
                        {link.sub}
                    </p>

                    {/* The button is the affordance, so it carries the accent at
                        rest rather than waiting for a hover to earn it. */}
                    <span className="btn-command relative mt-4 inline-flex items-center justify-center gap-1.5 h-8 px-4 bg-[var(--accent)] font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white transition-[filter] duration-200 group-hover:brightness-110">
                        {link.cta}
                        <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                </Link>
            ))}
        </section>
    );
}
