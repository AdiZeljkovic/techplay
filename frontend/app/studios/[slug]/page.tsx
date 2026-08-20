import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Building2, MapPin, CalendarDays, Globe, Gamepad2 } from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { fetchContent } from "@/lib/fetchContent";
import DataAttribution from "@/components/games/DataAttribution";

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
    games_count: number;
    developed_count: number;
    published_count: number;
    parent: { name: string; slug: string } | null;
    subsidiaries: { name: string; slug: string; logo_url: string | null; games_count: number }[];
    developed: StudioGame[];
    published: StudioGame[];
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
            robots: studio.indexable ? undefined : { index: false, follow: true },
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

            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <nav className="mb-6 flex items-center gap-1.5 text-[12px] text-white/35">
                    <Link href="/games" className="hover:text-white/70 transition-colors">Games</Link>
                    <span>/</span>
                    <Link href="/studios" className="hover:text-white/70 transition-colors">Studios</Link>
                </nav>

                <header className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-6">
                    <span className="flex h-[92px] w-[92px] shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-white/[0.08] bg-white/[0.04]">
                        {studio.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={studio.logo_url} alt={studio.name} className="h-full w-full object-contain p-3" />
                        ) : (
                            <Building2 className="h-8 w-8 text-white/20" />
                        )}
                    </span>

                    <div className="min-w-0">
                        <h1 className="font-display text-[26px] sm:text-[34px] font-black leading-tight tracking-tight text-white">
                            {studio.name}
                        </h1>

                        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-white/50">
                            <span className="inline-flex items-center gap-1.5">
                                <Gamepad2 className="h-3.5 w-3.5 text-white/30" />
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
                </header>

                {studio.subsidiaries.length > 0 && (
                    <section className="mt-9">
                        <SectionTitle>Studios under {studio.name}</SectionTitle>
                        <div className="flex flex-wrap gap-2">
                            {studio.subsidiaries.map((sub) => (
                                <Link
                                    key={sub.slug}
                                    href={`/studios/${sub.slug}`}
                                    className="inline-flex items-center gap-2 rounded-[9px] border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-[13px] text-white/75 hover:border-white/20 transition-colors"
                                >
                                    {sub.name}
                                    <span className="tabular-nums text-white/35">{sub.games_count}</span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                <GameShelf title="Developed" games={studio.developed} total={studio.developed_count} />
                <GameShelf title="Published" games={studio.published} total={studio.published_count} />

                {studio.developed.length === 0 && studio.published.length === 0 && (
                    <p className="mt-10 text-[14px] text-white/40">
                        No games from this studio are in the database yet.
                    </p>
                )}

                <DataAttribution className="mt-12 border-t border-white/[0.05] pt-5" />
            </div>
        </main>
    );
}

/* ─── pieces ─────────────────────────────────────────────────────────────── */

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
        <section className="mt-9">
            <SectionTitle>
                {title}
                <span className="ml-2 tabular-nums text-white/25">{total.toLocaleString()}</span>
            </SectionTitle>

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
        </section>
    );
}
