"use client";

import Link from "next/link";
import { Article } from "@/types";
import HeroSlider from "./HeroSlider";
import SearchDropdown from "@/components/layout/SearchDropdown";

/**
 * Public homepage hero. Left: the promise, search, CTAs and a stat row.
 * Right: featured-stories slider behind a signature diagonal seam.
 *
 * Rewritten 17 Aug 2026. What stood here sold the wrong product and one of its
 * claims was false:
 *
 *   - "Your gaming world. All in one place." describes an aggregator, and every
 *     gaming portal on the internet says a version of it. What this site
 *     actually has that they do not is a record of how somebody plays — Steam
 *     playtime read into a library, taste derived from a collection, a match
 *     percentage whose weights are published.
 *   - "200K+ games" was wrong: the catalogue holds about 141,000 after two
 *     cleanups. It is now read from the API, so it cannot go stale again.
 *   - "Live — player community" pointed at fifty-one members and an empty
 *     forum. A claim a visitor can disprove in two clicks is worse than no
 *     claim, so it is gone until there is a room worth showing.
 *
 * The tone is deliberately flat. On a site whose argument is that its numbers
 * can be checked, restraint is not a style choice — it is the argument.
 */
export default function HomeHero({
    heroArticles,
    gameCount,
}: {
    heroArticles: Article[];
    /** Omitted entirely when the API could not confirm it. */
    gameCount?: number | null;
}) {

    // Grouped to the thousand: "141,580" reads as a moving meter and invites
    // nobody to check it, while "141,000 games" is both true and legible.
    const catalogue = gameCount ? `${Math.floor(gameCount / 1000).toLocaleString("en-US")},000` : null;

    const stats = [
        { value: "3", label: "Platforms in one place" },
        catalogue ? { value: catalogue, label: "Games in the catalogue" } : null,
        { value: "Free", label: "To keep a library" },
    ].filter(Boolean) as { value: string; label: string }[];

    return (
        <section className="relative rounded-[var(--radius-panel)] overflow-hidden bg-[var(--surface-1)] border border-[var(--line)] lg:min-h-[500px]">
            {/* Crown */}
            <span aria-hidden className="absolute top-0 left-6 right-6 h-[2px] z-20 bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent" />

            {/* Ambient: HUD grid fading out to the right + accent glow behind the copy */}
            <div
                aria-hidden
                className="absolute inset-0 bg-hud-grid pointer-events-none"
                style={{ maskImage: "linear-gradient(to right, black 0%, transparent 55%)", WebkitMaskImage: "linear-gradient(to right, black 0%, transparent 55%)" }}
            />
            <span
                aria-hidden
                className="pointer-events-none absolute -left-32 -top-32 w-[520px] h-[520px] rounded-full opacity-[0.08]"
                style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
            />

            <div className="relative grid grid-cols-1 lg:grid-cols-2">
                {/* ── Copy + search + CTAs ── */}
                <div className="relative z-10 p-5 py-6 md:p-12 flex flex-col justify-center">
                    <p className="flex items-center gap-2.5 font-display text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-2.5 md:mb-4">
                        <span className="w-1 h-4 rounded-full bg-[var(--accent)]" />
                        Gaming, on the record
                    </p>

                    {/* The headline is the thing no platform gives you.
                        Steam shows Steam. PSN shows PlayStation. Nobody shows
                        you what you own across all of them, and that — not
                        "we track your games" — is the reason to be here.
                        An earlier version led with Steam alone, which sold a
                        third of the product. */}
                    <h1 className="font-display text-[30px] md:text-[50px] font-black leading-[1.02] text-[var(--ink-hi)]">
                        One library for
                        <br />
                        <span className="text-[var(--accent)]">everything you play.</span>
                    </h1>

                    <p className="hidden md:block mt-5 text-[15px] text-[var(--ink-mid)] leading-relaxed max-w-[440px]">
                        Connect Steam, PlayStation and Xbox and your games arrive on their own —
                        with the hours you put in. Add anything else by hand. Then TechPlay reads
                        it back: your taste, your year, and what to play tonight.
                    </p>

                    {/* The header's search box, at hero size.
                        It was a plain form: type, press Enter, land on the
                        catalogue and read a grid. Now the five best matches
                        appear as you type and one tap goes straight to the
                        game — which is what a search box on a front page is
                        for. Same component as the header rather than a second
                        one, so the debounce, the abort, the keyboard handling
                        and the click-outside exist once. */}
                    <SearchDropdown
                        variant="hero"
                        className="mt-4 md:mt-7 max-w-[440px]"
                        placeholder={catalogue ? `Search ${catalogue} games…` : "Search the catalogue…"}
                        seeAllHref={(q) => `/games?search=${encodeURIComponent(q)}`}
                    />

                    {/* Same 440px as the search field above, split in two — the
                        pair reads as one block with it rather than a shorter
                        row starting under it. */}
                    <div className="mt-3 md:mt-6 max-w-[440px] flex flex-wrap sm:flex-nowrap items-center gap-2.5 md:gap-3">
                        <Link
                            href="/register"
                            className="btn-command flex-1 inline-flex items-center justify-center gap-2 px-5 h-12 bg-[var(--accent)] text-white font-display text-[13px] font-bold uppercase tracking-wider whitespace-nowrap hover:bg-[var(--accent-hover)] transition-colors duration-300"
                        >
                            Start your library
                        </Link>
                        <Link
                            href="/games"
                            className="btn-command btn-command-quiet flex-1 inline-flex items-center justify-center gap-2 px-5 h-12 bg-[var(--fill-2)] text-[var(--ink-hi)] font-display text-[13px] font-bold uppercase tracking-wider whitespace-nowrap hover:bg-[var(--fill-3)] transition-colors duration-300"
                        >
                            Browse the catalogue
                        </Link>
                    </div>

                    {/* Stat row — Command Numerals over hairline dividers */}
                    <div className="hidden md:grid mt-9 pt-6 border-t border-[var(--line)] grid-cols-3 max-w-[440px]">
                        {stats.map((stat, i) => (
                            <div key={stat.label} className={i > 0 ? "pl-5 border-l border-[var(--line)]" : ""}>
                                <p className="font-display text-[20px] font-bold tabular-nums text-[var(--ink-hi)] leading-none">
                                    {stat.value}
                                </p>
                                <p className="mt-1.5 text-[10px] uppercase tracking-wider text-[var(--ink-faint)] leading-tight">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Featured stories slider behind the diagonal seam ── */}
                <div className="relative min-h-[190px] sm:min-h-[400px] lg:min-h-0">
                    {/* accent sliver along the diagonal cut */}
                    <div
                        aria-hidden
                        className="hidden lg:block absolute inset-0 bg-gradient-to-b from-[color-mix(in_srgb,var(--accent)_55%,transparent)] to-transparent"
                        style={{ clipPath: "polygon(9.5% 0, 10% 0, 0.5% 100%, 0% 100%)" }}
                    />
                    <div
                        className="absolute inset-0 lg:[clip-path:polygon(10%_0,100%_0,100%_100%,0%_100%)]"
                    >
                        <HeroSlider articles={heroArticles} />
                    </div>
                </div>
            </div>
        </section>
    );
}
