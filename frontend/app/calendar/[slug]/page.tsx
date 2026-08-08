import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerApiUrl } from "@/lib/api";
import { fetchContent } from "@/lib/fetchContent";
import { ChevronLeft, CalendarDays, Building2, Code2 } from "lucide-react";
import ReleaseClient from "./ReleaseClient";

export const revalidate = 3600;

/**
 * One upcoming release.
 *
 * Deliberately not the games database's page. That one is about a game somebody
 * has played — reviews, hours, who owns it. Nobody has played this one yet, so
 * everything here comes from what the stores said while announcing it: the art
 * they chose, the trailer they cut, and where it will be sold.
 */

export interface Release {
    slug: string;
    name: string;
    released: string | null;
    precision: string;
    days_away: number | null;
    description: string | null;
    publisher: string | null;
    developer: string | null;
    cover_url: string | null;
    screenshots: string[];
    trailers: string[];
    genres: string[];
    platforms: string[];
    notability: number;
    stores: { store: string; label: string; url: string }[];
    wishlists: number;
    wishlisted: boolean;
    reminder: boolean;
    also_this_month: {
        slug: string;
        name: string;
        released: string | null;
        cover_url: string | null;
        platforms: string[];
    }[];
}

type Props = { params: Promise<{ slug: string }> };

async function getRelease(slug: string): Promise<Release | null> {
    const json = await fetchContent<{ data?: Release }>(`${getServerApiUrl()}/calendar/${slug}`, {
        next: { revalidate: 3600, tags: [`release-${slug}`] } });

    return json?.data ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const release = await getRelease(slug);

    if (!release) return { title: "Release not found — TechPlay" };

    const when = release.released
        ? new Date(release.released).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
        : "a date yet to be announced";

    const description =
        release.description?.slice(0, 160) ||
        `${release.name} arrives ${when} on ${release.platforms.join(", ")}.`;

    return {
        title: `${release.name} — release date, trailers and platforms — TechPlay`,
        description,
        alternates: { canonical: `https://techplay.gg/calendar/${slug}` },
        openGraph: {
            title: release.name,
            description,
            url: `https://techplay.gg/calendar/${slug}`,
            siteName: "TechPlay",
            images: release.cover_url ? [release.cover_url] : [],
            type: "website" },
        twitter: {
            card: "summary_large_image",
            title: release.name,
            description,
            images: release.cover_url ? [release.cover_url] : [] } };
}

/**
 * What the store actually committed to.
 *
 * A store that said "Q4 2026" is telling the truth, and rendering that as a
 * day would be us inventing precision nobody gave us.
 */
function whenItLands(release: Release) {
    if (!release.released) return { line: "Date to be announced", note: null as string | null };

    const date = new Date(release.released);

    if (release.precision === "month") {
        return {
            line: date.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
            note: "Exact day not announced" };
    }
    if (release.precision === "quarter") {
        return { line: `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`, note: "Quarter only" };
    }
    if (release.precision === "year") {
        return { line: `${date.getFullYear()}`, note: "Year only" };
    }

    const days = release.days_away;
    const note =
        days === null ? null
        : days > 1 ? `${days} days away`
        : days === 1 ? "Tomorrow"
        : days === 0 ? "Out today"
        : "Already out";

    return {
        line: date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" }),
        note };
}

export default async function ReleasePage({ params }: Props) {
    const { slug } = await params;
    const release = await getRelease(slug);

    if (!release) notFound();

    const { line, note } = whenItLands(release);

    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            {/* ── hero ── */}
            <div className="relative overflow-hidden border-b border-white/[0.07]">
                {release.cover_url && (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={release.cover_url}
                            alt=""
                            aria-hidden
                            className="absolute inset-0 w-full h-full object-cover opacity-[0.3]"
                        />
                        <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-[var(--surface-0)] via-[var(--surface-0)]/85 to-transparent" />
                        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[var(--surface-0)] to-transparent" />
                    </>
                )}

                <div className="relative z-10 container-page py-10">
                    <Link
                        href="/calendar"
                        className="inline-flex items-center gap-1.5 font-display text-[10px] font-black uppercase tracking-[0.14em] text-white/45 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" /> Release calendar
                    </Link>

                    <h1 className="mt-4 font-display font-black text-white tracking-tight leading-[0.92] text-[38px] md:text-[54px] max-w-[900px]">
                        {release.name}
                    </h1>

                    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                        <span className="inline-flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-[var(--accent)]" />
                            <span className="font-display text-[15px] font-black text-white">{line}</span>
                            {note && (
                                <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--accent)]">
                                    {note}
                                </span>
                            )}
                        </span>

                    </div>

                    {release.platforms.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                            {release.platforms.map((platform) => (
                                <span
                                    key={platform}
                                    className="inline-flex items-center h-[24px] px-2.5 rounded-[6px] bg-white/[0.06] border border-white/[0.08] font-display text-[10px] font-bold uppercase tracking-[0.06em] text-white/65"
                                >
                                    {platform}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ReleaseClient release={release} />

            {/* ── what else lands that month ── */}
            {release.also_this_month.length > 0 && (
                <div className="container-page pb-14">
                    <h2 className="font-display text-[12px] font-black uppercase tracking-[0.14em] text-white mb-4">
                        Also in{" "}
                        {release.released
                            ? new Date(release.released).toLocaleDateString("en-GB", { month: "long" })
                            : "that month"}
                    </h2>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {release.also_this_month.map((other) => (
                            <Link key={other.slug} href={`/calendar/${other.slug}`} className="group">
                                <span className="relative block h-[110px] rounded-[10px] overflow-hidden border border-white/[0.07] group-hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors">
                                    {other.cover_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={other.cover_url}
                                            alt={other.name}
                                            loading="lazy"
                                            className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
                                        />
                                    ) : (
                                        <span className="w-full h-full block bg-white/[0.04]" />
                                    )}
                                </span>
                                <span className="mt-2 block font-display text-[11px] font-black text-white leading-tight line-clamp-2">
                                    {other.name}
                                </span>
                                {other.released && (
                                    <span className="block font-display text-[9px] font-bold uppercase tracking-[0.08em] text-white/35 mt-0.5">
                                        {new Date(other.released).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Credits sit last: they matter to few and are dull to everyone
                else, but leaving them out would be a gap. */}
            {(release.publisher || release.developer) && (
                <div className="container-page pb-14 flex flex-wrap gap-x-8 gap-y-2 text-[12px] text-white/40">
                    {release.developer && (
                        <span className="inline-flex items-center gap-1.5">
                            <Code2 className="w-3.5 h-3.5" /> {release.developer}
                        </span>
                    )}
                    {release.publisher && (
                        <span className="inline-flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" /> {release.publisher}
                        </span>
                    )}
                </div>
            )}
        </main>
    );
}
