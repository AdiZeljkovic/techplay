import { Metadata } from "next";
import { notFound } from "next/navigation";
import GameDatabaseHub from "@/components/games/GameDatabaseHub";
import { fetchFacetGames } from "@/lib/facetGames";
import { getServerApiUrl, serverHeaders } from "@/lib/api";
import { ROBOTS_INDEX, ROBOTS_NOINDEX } from "@/lib/seo";

/*
 * A series has an address.
 *
 * The catalogue groups 332,455 games into 9,611 series, and until now the only
 * way to see one was to open a game and scroll to "more in this series". That
 * is the wrong way round for the question people actually ask — "Final Fantasy
 * games", "every Mass Effect in order" — and it left ~4,000 real groupings with
 * no page to answer with.
 *
 * There is no META table here the way there is for the fifteen curated genres.
 * Four thousand pages cannot be hand-written, so the copy is assembled from
 * facts the catalogue holds: how many entries, across which years, on which
 * platforms. That is a real sentence about this series and no other, which is
 * the line between a page worth indexing and a filtered list wearing a title.
 */

export const revalidate = 86400;

interface Series {
    slug: string;
    name: string;
    games_count: number;
    first_year: number | null;
    last_year: number | null;
    described_count: number;
    platforms: string[];
    genres: string[];
}

async function getSeries(slug: string): Promise<Series | null> {
    try {
        const res = await fetch(`${getServerApiUrl()}/games/series/${encodeURIComponent(slug)}`, {
            next: { revalidate: 86400 },
            headers: serverHeaders(),
        });

        if (!res.ok) return null;

        return (await res.json()) as Series;
    } catch {
        return null;
    }
}

/** The span, written the way a person would say it. */
function years(series: Series): string | null {
    if (!series.first_year) return null;
    if (!series.last_year || series.last_year === series.first_year) return `${series.first_year}`;

    return `${series.first_year} to ${series.last_year}`;
}

function describe(series: Series): string {
    const span = years(series);
    const platforms = series.platforms.slice(0, 3);

    const parts = [
        `Every ${series.name} game in the TechPlay catalogue`,
        series.games_count > 1 ? `— ${series.games_count} entries` : "",
        span ? ` released ${series.games_count > 1 ? "between " : "in "}${span}` : "",
        platforms.length ? `, on ${platforms.join(", ")}` : "",
        ". Listed in release order, with dates, platforms and scores.",
    ];

    return parts.join("").replace(/\s+/g, " ").replace(" .", ".").trim();
}

/**
 * Worth indexing on the same terms as everything else in the catalogue: three
 * entries or more, and something written about at least one of them. The API
 * carries both counts so the page does not have to guess.
 */
function worthIndexing(series: Series): boolean {
    return series.games_count >= 3 && series.described_count >= 1;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const series = await getSeries(slug);

    if (!series) {
        return { title: "Series not found", robots: ROBOTS_NOINDEX };
    }

    const url = `https://techplay.gg/games/series/${series.slug}`;
    const title = `${series.name} Games in Order — All ${series.games_count} Titles`;
    const description = describe(series);

    return {
        title,
        description,
        alternates: { canonical: url },
        robots: worthIndexing(series) ? ROBOTS_INDEX : ROBOTS_NOINDEX,
        openGraph: { title: `${title} | TechPlay`, description, url, type: "website", siteName: "TechPlay" },
        twitter: { card: "summary_large_image", title: `${title} | TechPlay`, description },
    };
}

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const series = await getSeries(slug);

    // A slug that is not a series is not a series with nothing in it. Without
    // this the route answers 200 with an empty grid, which is the soft-404 the
    // article routes were fixed for.
    if (!series) notFound();

    const url = `https://techplay.gg/games/series/${series.slug}`;
    const preset = { series: series.slug };
    const games = await fetchFacetGames(preset);

    const breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://techplay.gg" },
            { "@type": "ListItem", position: 2, name: "Games", item: "https://techplay.gg/games" },
            { "@type": "ListItem", position: 3, name: series.name, item: url },
        ],
    };

    /*
     * VideoGameSeries, with the entries named.
     *
     * `hasPart` is what makes this more than a CollectionPage: it says these
     * particular games are members of this particular series, which is the fact
     * the page exists to state. Only the first thirty are listed — the same
     * rows the reader sees — because naming titles the page does not show would
     * describe something other than what is here.
     */
    const seriesSchema = {
        "@context": "https://schema.org",
        "@type": "VideoGameSeries",
        name: series.name,
        url,
        description: describe(series),
        numberOfEpisodes: series.games_count,
        ...(series.genres.length ? { genre: series.genres } : {}),
        ...(series.platforms.length ? { gamePlatform: series.platforms } : {}),
        hasPart: games.map((g) => ({
            "@type": "VideoGame",
            name: g.name,
            url: `https://techplay.gg/games/${g.slug}`,
            ...(g.released ? { datePublished: g.released } : {}),
        })),
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(seriesSchema) }} />
            <GameDatabaseHub
                preset={preset}
                heading={`${series.name} Games`}
                intro={describe(series)}
                initialGames={games}
            />
        </>
    );
}
