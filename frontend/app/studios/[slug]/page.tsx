import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Building2, MapPin, CalendarDays, Globe, Gamepad2 } from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { fetchContent } from "@/lib/fetchContent";
import DataAttribution from "@/components/games/DataAttribution";
import Panel from "@/components/ui/Panel";
import { ROBOTS_INDEX, ROBOTS_NOINDEX } from "@/lib/seo";

/* ─── shapes ─────────────────────────────────────────────────────────────── */

interface StudioGame {
    name: string;
    slug: string;
    cover_url: string | null;
    released: string | null;
    rating: number | null;
}

interface Studio {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
    country: { code: number; alpha2: string; name: string } | null;
    founded: string | null;
    website: string | null;
    indexable: boolean;
    status: "active" | "defunct" | "merged" | "renamed" | null;
    changed_at: string | null;
    became: { name: string; slug: string } | null;
    kind: string | null;
    games_count: number;
    developed_count: number;
    published_count: number;
    ported_count: number;
    supported_count: number;
    parent: { name: string; slug: string } | null;
    subsidiaries: { name: string; slug: string; logo_url: string | null; games_count: number }[];
    developed: StudioGame[];
    published: StudioGame[];
    ported: StudioGame[];
    supported: StudioGame[];
    /** Year → releases that year, over everything it shipped. */
    years: Record<string, number>;
}

interface Envelope {
    data: Studio;
}

/**
 * One request, shared by generateMetadata and the body.
 *
 * Next deduplicates identical fetches within a render, so the pair costs one
 * call — the same arrangement the game page uses, and for the same reason: this
 * API meters per IP and every server render leaves from one address.
 */
function loadStudio(slug: string) {
    return fetchContent<Envelope>(`${getApiUrl()}/studios/${slug}`, { next: { revalidate: 3600 } });
}

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;

    try {
        const envelope = await loadStudio(slug);
        if (!envelope) return { title: "Studio Not Found" };

        const studio = envelope.data;
        const where = studio.country?.name;
        const founded = studio.founded ? new Date(studio.founded).getFullYear() : null;

        const description =
            studio.description?.slice(0, 155) ??
            `Every game developed and published by ${studio.name}${where ? `, a studio from ${where}` : ""}${founded ? `, founded in ${founded}` : ""}.`;

        return {
            title: `${studio.name} — games, releases and history`,
            description,
            alternates: { canonical: `/studios/${studio.slug}` },
            /* Two thirds of studios have one game and nothing written about
               them. They keep their page, because game pages link straight to
               it, but asking Google to index 35,000 of those would be asking
               for a thin-content problem. */
            /*
             * `undefined` here does not mean "inherit the root" — it wipes it.
             *
             * Next merges metadata top-down, but a segment that sets the key to
             * undefined sets it to undefined; the parent's value does not come
             * back. Measured on production: /studios/rockstar-games and
             * /profile/adi emitted no robots tag at all, so neither carried
             * max-image-preview:large and neither was eligible for Discover — the
             * one directive the whole site had just been given.
             */
            robots: studio.indexable ? ROBOTS_INDEX : { index: false, follow: true },
            openGraph: {
                title: studio.name,
                description,
                type: "profile",
                ...(studio.logo_url ? { images: [{ url: studio.logo_url }] } : {}),
            },
        };
    } catch {
        return { title: "Studio" };
    }
}

/* ─── page ───────────────────────────────────────────────────────────────── */

export default async function StudioPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const envelope = await loadStudio(slug);

    if (!envelope) notFound();

    const studio = envelope.data;
    const founded = studio.founded ? new Date(studio.founded).getFullYear() : null;

    /* A studio that publishes its own games was listing the same titles under
       both headings — six games printed twice, which is true and is not two
       facts. Split by which side of the pair each game is actually on. */
    const publishedSlugs = new Set((studio.published ?? []).map((g) => g.slug));
    const developedSlugs = new Set((studio.developed ?? []).map((g) => g.slug));

    const both = (studio.developed ?? []).filter((g) => publishedSlugs.has(g.slug));
    const developedOnly = (studio.developed ?? []).filter((g) => !publishedSlugs.has(g.slug));
    const publishedOnly = (studio.published ?? []).filter((g) => !developedSlugs.has(g.slug));

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: studio.name,
        ...(studio.description ? { description: studio.description } : {}),
        ...(studio.logo_url ? { logo: studio.logo_url } : {}),
        ...(studio.website ? { url: studio.website } : {}),
        ...(founded ? { foundingDate: String(founded) } : {}),
        ...(studio.country ? { address: { "@type": "PostalAddress", addressCountry: studio.country.alpha2 } } : {}),
        ...(studio.parent ? { parentOrganization: { "@type": "Organization", name: studio.parent.name } } : {}),
    };

    return (
        <main className="bg-[var(--surface-0)] min-h-screen">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            {/* ── hero ──────────────────────────────────────────────────────

                The house backdrop, the same one the studios listing and the
                games database open with. A studio has no key art of its own, and
                a flat gradient made its page the one place in the section that
                arrived without any. */}
            <div className="relative overflow-hidden border-b border-white/[0.07]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/page-hero.webp"
                    alt=""
                    aria-hidden
                    className="absolute inset-0 h-full w-full object-cover object-center"
                />
                {/* Weighted to the left, where the name and the logo sit — the
                    listing's backdrop is centred because its title is. */}
                <span aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_140%_at_18%_40%,rgba(5,7,10,0.88),rgba(5,7,10,0.62)_70%)]" />
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--surface-0)] to-transparent" />

                <div className="relative z-10 container-page pt-6 pb-10">
                <nav className="mb-6 flex items-center gap-1.5 font-display text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
                    <Link href="/games" className="hover:text-white transition-colors">Games</Link>
                    <span className="text-white/45">/</span>
                    <Link href="/studios" className="hover:text-white transition-colors">Studios</Link>
                </nav>

                {/* `items-start` keeps the logo level with the title; the
                    figures block opts out of it with `self-end` so it finishes
                    where the description does. */}
                <header className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-6 sm:flex-wrap lg:flex-nowrap">
                    {/* On a light plate, not on the page's own black.

                        These are transparent PNGs drawn for white backgrounds —
                        Square Enix, Activision, Hudson Soft and a dozen others
                        are near-black wordmarks, and on a dark tile they showed
                        as an empty square. A logo nobody can see is worse than
                        no logo, because the space is spent either way. */}
                    <span className="flex h-[104px] w-[104px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-white/[0.12] bg-[#f2f3f5] shadow-[0_16px_44px_-14px_rgba(0,0,0,0.9)]">
                        {studio.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={studio.logo_url} alt={studio.name} className="h-full w-full object-contain p-3.5" />
                        ) : (
                            <Building2 className="h-9 w-9 text-black/25" />
                        )}
                    </span>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                            <h1 className="font-display text-[26px] sm:text-[34px] font-black leading-tight tracking-tight text-white">
                                {studio.name}
                            </h1>
                            <StatusBadge status={studio.status} />
                            {/* Only Solo Dev earns a badge. "Main Company" is
                                what a reader assumes of any studio, and 5,011
                                of them carry it — a label on all of those says
                                nothing about any of them. */}
                            {studio.kind === "Solo Dev" && (
                                <span className="inline-flex h-[22px] items-center rounded-[5px] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-2 font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-[var(--accent)]">
                                    Solo dev
                                </span>
                            )}
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-white/50">
                            <span className="inline-flex items-center gap-1.5">
                                <Gamepad2 className="h-3.5 w-3.5 text-white/50" />
                                <span className="tabular-nums">{studio.games_count.toLocaleString()}</span>
                                {studio.games_count === 1 ? "game" : "games"}
                            </span>
                            {studio.country && (
                                <span className="inline-flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-white/30" />
                                    {studio.country.name}
                                </span>
                            )}
                            {founded && (
                                <span className="inline-flex items-center gap-1.5">
                                    <CalendarDays className="h-3.5 w-3.5 text-white/30" />
                                    Founded {founded}
                                </span>
                            )}
                            {studio.website && (
                                <a
                                    href={studio.website}
                                    target="_blank"
                                    rel="noopener noreferrer nofollow"
                                    className="inline-flex items-center gap-1.5 hover:text-white/80 transition-colors"
                                >
                                    <Globe className="h-3.5 w-3.5 text-white/30" />
                                    Website
                                </a>
                            )}
                        </div>

                        {/* What became of it. A studio that closed in 1995 reads
                            like one shipping games this year unless the page
                            says otherwise. */}
                        {studio.status && studio.status !== "active" && (
                            <p className="mt-2.5 text-[13px] text-white/50">
                                {ENDED[studio.status]}
                                {studio.changed_at && ` in ${new Date(studio.changed_at).getFullYear()}`}
                                {studio.became && (
                                    <>
                                        {" — became "}
                                        <Link
                                            href={`/studios/${studio.became.slug}`}
                                            className="text-[var(--accent)] hover:underline"
                                        >
                                            {studio.became.name}
                                        </Link>
                                    </>
                                )}
                            </p>
                        )}

                        {studio.parent && (
                            <p className="mt-2.5 text-[13px] text-white/45">
                                Part of{" "}
                                <Link
                                    href={`/studios/${studio.parent.slug}`}
                                    className="text-[var(--accent)] hover:underline"
                                >
                                    {studio.parent.name}
                                </Link>
                            </p>
                        )}

                        {studio.description && (
                            <p className="mt-4 max-w-[70ch] text-[14px] leading-relaxed text-white/65">
                                {studio.description}
                            </p>
                        )}
                    </div>

                    {/* The figures, filling the half of the header that was
                        black. Same instrument face the rest of the site uses
                        for a block of readouts. */}
                    <StudioFigures studio={studio} years={studio.years ?? {}} />
                </header>
                </div>
            </div>

            <div className="container-page py-6 space-y-5">
                {studio.subsidiaries.length > 0 && (
                    <Panel title={`Studios under ${studio.name}`} meta={
                        <span className="font-display text-[10px] font-bold tabular-nums text-white/45">
                            {studio.subsidiaries.length}
                        </span>
                    }>
                        {/* The site's own segmented-bar treatment, the one the
                            leaderboard uses for its boards: an inset tray, and
                            inside it items at one height in display caps. They
                            were mixed-case links in outlined boxes, which is a
                            different language from every other row of choices
                            on the site. */}
                        <div className="flex flex-wrap gap-1 rounded-[10px] border border-white/[0.07] bg-[var(--surface-1)] p-1">
                            {studio.subsidiaries.map((sub) => (
                                <Link
                                    key={sub.slug}
                                    href={`/studios/${sub.slug}`}
                                    className="group/sub inline-flex h-10 items-center gap-2 rounded-[8px] px-3 font-display text-[11px] font-bold uppercase tracking-[0.06em] text-white/50 transition-colors duration-200 hover:bg-[var(--accent)] hover:text-white"
                                >
                                    <Building2 className="h-3.5 w-3.5 text-white/45 transition-colors group-hover/sub:text-white/80" />
                                    {sub.name}
                                    <span className="rounded-[4px] bg-white/[0.06] px-1.5 py-0.5 text-[10px] tabular-nums text-white/55 transition-colors group-hover/sub:bg-black/25 group-hover/sub:text-white/85">
                                        {sub.games_count}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </Panel>
                )}

                <ReleaseHistory years={studio.years ?? {}} />

                {/* A studio that publishes its own work had the same six games
                    printed twice, once under each heading. Which is true, and
                    is not two facts. */}
                <GameShelf title="Developed & published" games={both} total={both.length} />
                <GameShelf title={both.length > 0 ? "Developed for others" : "Developed"} games={developedOnly} total={developedOnly.length} />
                <GameShelf title={both.length > 0 ? "Published for others" : "Published"} games={publishedOnly} total={publishedOnly.length} />

                {/* Never merged into those: a porting house did not write the
                    game, and 719 studios in the catalogue have no other kind of
                    credit at all. */}
                <GameShelf title="Ported" games={studio.ported ?? []} total={studio.ported_count ?? 0} />
                <GameShelf title="Worked on" games={studio.supported ?? []} total={studio.supported_count ?? 0} />

                {studio.developed.length === 0 && studio.published.length === 0 &&
                 (studio.ported ?? []).length === 0 && (studio.supported ?? []).length === 0 && (
                    <Panel>
                        <p className="text-[14px] text-white/55">
                            No games from this studio are in the database yet.
                        </p>
                    </Panel>
                )}

                <DataAttribution className="mt-12 border-t border-white/[0.05] pt-5" />
            </div>
        </main>
    );
}

/* ─── pieces ─────────────────────────────────────────────────────────────── */

/**
 * A studio's output, year by year.
 *
 * The page ended after two shelves of covers, which says what a studio made but
 * nothing about the shape of its life — whether it shipped steadily for twenty
 * years or everything it has in one burst and then stopped. Bars answer that at
 * a glance in the space a sentence would take.
 *
 * Counted over everything it shipped, not over the shelves above, which stop at
 * forty-eight.
 */
function ReleaseHistory({ years }: { years: Record<string, number> }) {
    const entries = Object.entries(years ?? {}).sort(([a], [b]) => Number(a) - Number(b));

    /* Two bars is a pair of numbers, not a history. */
    if (entries.length < 3) return null;

    const peak = Math.max(...entries.map(([, count]) => count));
    const first = entries[0][0];
    const last = entries[entries.length - 1][0];
    const total = entries.reduce((sum, [, count]) => sum + count, 0);

    return (
        <Panel
            material="instrument"
            title="Releases by year"
            meta={
                <span className="font-display text-[10px] font-bold tabular-nums text-white/50">
                    {total.toLocaleString()} across {first}–{last}
                </span>
            }
        >
            {/* Bars, capped in width.

                `flex-1` alone gave a studio with six years six blocks two
                hundred pixels wide, each at full height because each year held
                one release — which is not a chart, it is six red rectangles.
                A bar has a bar's width whether there are six of them or forty. */}
            <div className="flex items-end gap-[3px] h-[92px]">
                {entries.map(([year, count]) => (
                    <span
                        key={year}
                        title={`${year}: ${count} ${count === 1 ? "release" : "releases"}`}
                        className="relative flex-1 min-w-[3px] max-w-[22px] rounded-t-[2px] bg-[color-mix(in_srgb,var(--accent)_55%,transparent)] hover:bg-[var(--accent)] transition-colors"
                        style={{ height: `${Math.max(8, (count / peak) * 100)}%` }}
                    />
                ))}
            </div>
            <div className="mt-2 flex justify-between font-display text-[10px] font-bold tabular-nums text-white/45">
                <span>{first}</span>
                <span className="text-white/50">peak {peak} in one year</span>
                <span>{last}</span>
            </div>
        </Panel>
    );
}

/**
 * The studio in figures, in the header's empty half.
 *
 * The right side of this header was black from the logo down. These are the
 * numbers already on the record — what it made, what it published, how long it
 * has been shipping — so the space costs nothing to fill and answers the
 * questions the shelves below only imply.
 */
function StudioFigures({ studio, years }: { studio: Studio; years: Record<string, number> }) {
    const seasons = Object.keys(years ?? {}).sort();

    /* A studio that made and published all of its own work read "6 games,
       6 developed, 6 published" — the same number three times, which tells a
       reader nothing they did not have from the first one. The split is only
       shown where there is one. */
    const selfPublished =
        studio.developed_count === studio.games_count &&
        studio.published_count === studio.games_count;

    const figures = [
        { label: "Games", value: studio.games_count },
        ...(selfPublished ? [] : [
            { label: "Developed", value: studio.developed_count },
            { label: "Published", value: studio.published_count },
        ]),
        { label: "Ported", value: studio.ported_count ?? 0 },
        { label: "Worked on", value: studio.supported_count ?? 0 },
    ].filter((f) => f.value > 0);

    if (figures.length === 0) return null;

    return (
        /* Bottom-right, level with the end of the description.

           The header row aligns its children to the top, which left this block
           floating beside the first two lines with the rest of the text running
           on under it. `self-end` sets it on the same baseline the paragraph
           finishes on; `ml-auto` keeps it in the corner when the description is
           short enough not to push it there. */
        <div className="shrink-0 rounded-[14px] border border-white/[0.09] bg-black/45 backdrop-blur-sm p-4 sm:ml-auto sm:self-end sm:min-w-[210px]">
            {/* Flowing, not a fixed two-column grid. Three figures in two
                columns left a hole where a fourth would be, which reads as a
                number that failed to load. */}
            <div className="flex flex-wrap gap-x-6 gap-y-3">
                {figures.map((figure) => (
                    <div key={figure.label} className="min-w-[74px]">
                        <p className="font-display text-[22px] font-black leading-none tabular-nums text-white">
                            {figure.value.toLocaleString()}
                        </p>
                        <p className="mt-1 font-display text-[9px] font-black uppercase tracking-[0.12em] text-white/50">
                            {figure.label}
                        </p>
                    </div>
                ))}
            </div>

            {seasons.length > 1 && (
                <p className="mt-3.5 border-t border-white/[0.07] pt-3 font-display text-[10px] font-bold tabular-nums text-white/50">
                    Shipping {seasons[0]}–{seasons[seasons.length - 1]}
                </p>
            )}
        </div>
    );
}

/** How a studio's ending reads in a sentence. */
const ENDED: Record<string, string> = {
    defunct: "Closed",
    merged: "Merged",
    renamed: "Renamed",
};

/**
 * A studio that is no longer working says so beside its name.
 *
 * Only the endings get a badge. "Active" is the assumption a reader already
 * holds, and a badge that says what somebody already believes is noise — the
 * information here is entirely in the exceptions: 1,698 closed, 469 renamed,
 * 374 merged away.
 */
function StatusBadge({ status }: { status: string | null }) {
    if (!status || status === "active") return null;

    return (
        <span className="inline-flex h-[22px] items-center rounded-[5px] border border-white/[0.12] bg-white/[0.05] px-2 font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/55">
            {ENDED[status] ?? status}
        </span>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="mb-3 font-display text-[11px] font-black uppercase tracking-[0.16em] text-white/45">
            {children}
        </h2>
    );
}

/**
 * The two lists stay apart.
 *
 * A reader asking what Arkane made should not be handed what Bethesda put out,
 * which is the reason the role sits on the pivot rather than being flattened
 * into one list of everything a company touched.
 */
function GameShelf({ title, games, total }: { title: string; games: StudioGame[]; total: number }) {
    if (games.length === 0) return null;

    return (
        <Panel
            title={title}
            meta={
                <span className="font-display text-[10px] font-bold tabular-nums text-white/45">
                    {total.toLocaleString()}
                </span>
            }
        >
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                {games.map((game) => (
                    <Link key={game.slug} href={`/games/${game.slug}`} className="group block">
                        <span className="relative block h-[150px] overflow-hidden rounded-[9px] border border-white/[0.07] group-hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors">
                            {game.cover_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={game.cover_url}
                                    alt={game.name}
                                    loading="lazy"
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                                />
                            ) : (
                                <span className="flex h-full w-full items-center justify-center bg-white/[0.03] text-white/15">
                                    <Gamepad2 className="h-6 w-6" />
                                </span>
                            )}

                            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/15 to-transparent" />

                            {game.released && (
                                <span className="absolute left-1.5 top-1.5 inline-flex h-[18px] items-center rounded-[4px] bg-black/65 px-1.5 font-display text-[9px] font-black tabular-nums text-white/80 backdrop-blur-sm">
                                    {new Date(game.released).getFullYear()}
                                </span>
                            )}

                            <span className="absolute inset-x-0 bottom-0 p-2">
                                <span className="block font-display text-[11px] font-black leading-tight text-white line-clamp-2">
                                    {game.name}
                                </span>
                            </span>
                        </span>
                    </Link>
                ))}
            </div>
        </Panel>
    );
}
