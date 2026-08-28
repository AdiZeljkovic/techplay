import type { Metadata } from "next";
import GameDatabaseHub from "@/components/games/GameDatabaseHub";
import { genreFilter } from "@/lib/gameFacets";
import { fetchFacetGames } from "@/lib/facetGames";

export const revalidate = 86400;
export const dynamicParams = true;

const GENRE_META: Record<string, {
    title: string;
    h1: string;
    description: string;
    keywords: string;
}> = {
    "action": {
        title:       "Best Action Games in 2026",
        h1:          "Best Action Games",
        description: "The best action games ranked by community rating. Fast combat, explosive set pieces and games that keep you hooked for hours.",
        keywords:    "best action games, action games 2026, top action games, action games ranked",
    },
    "rpg": {
        title:       "Best RPG Games in 2026",
        h1:          "Best RPG Games",
        description: "Top-rated RPGs ranked by players worldwide. From massive open-world epics to intimate story-driven gems — find your next RPG.",
        keywords:    "best RPG games, top role playing games, RPG games 2026, best JRPGs, open world RPG",
    },
    "adventure": {
        title:       "Best Adventure Games in 2026",
        h1:          "Best Adventure Games",
        description: "The highest-rated adventure games of all time. Gripping narratives, world exploration and puzzles worth solving.",
        keywords:    "best adventure games, top adventure games 2026, adventure games ranked, story games",
    },
    "strategy": {
        title:       "Best Strategy Games in 2026",
        h1:          "Best Strategy Games",
        description: "Strategy games that actually make you think. Top-rated RTS, turn-based and grand strategy titles ranked by players.",
        keywords:    "best strategy games, top strategy games 2026, RTS games, turn-based strategy, grand strategy",
    },
    "shooter": {
        title:       "Best Shooter Games in 2026",
        h1:          "Best Shooter Games",
        description: "Top FPS and TPS games ranked by community score. Competitive multiplayer, tactical shooters and solo campaigns worth playing.",
        keywords:    "best shooter games, best FPS games 2026, top FPS games, best TPS games, shooter games ranked",
    },
    "puzzle": {
        title:       "Best Puzzle Games in 2026",
        h1:          "Best Puzzle Games",
        description: "The most satisfying puzzle games ranked by players. Logic challenges, mind-bending mechanics and games that reward patience.",
        keywords:    "best puzzle games, top puzzle games 2026, puzzle games ranked, logic games, brain teasers",
    },
    "horror": {
        title:       "Best Horror Games in 2026",
        h1:          "Best Horror Games",
        description: "The scariest and highest-rated horror games. Survival horror, psychological thrillers and atmospheric dread — ranked by players.",
        keywords:    "best horror games, scariest games 2026, survival horror games, horror games ranked, psychological horror",
    },
    "indie": {
        title:       "Best Indie Games in 2026",
        h1:          "Best Indie Games",
        description: "The best indie games ranked by community rating. Hidden gems, award-winners and small studio titles that outshine AAA releases.",
        keywords:    "best indie games, top indie games 2026, indie games ranked, hidden gem games, best indie 2026",
    },
    "platformer": {
        title:       "Best Platformer Games in 2026",
        h1:          "Best Platformer Games",
        description: "Top-rated platformers from all eras. Classic side-scrollers, 3D platformers and modern indie hits — ranked by players.",
        keywords:    "best platformer games, top platform games 2026, best side scrollers, 3D platformer games",
    },
    "simulation": {
        title:       "Best Simulation Games in 2026",
        h1:          "Best Simulation Games",
        description: "The highest-rated simulation games. City builders, life sims, farming and management games — ranked by the community.",
        keywords:    "best simulation games, top sim games 2026, city builder games, life simulation, management games",
    },
    "racing": {
        title:       "Best Racing Games in 2026",
        h1:          "Best Racing Games",
        description: "Top-rated racing games from arcade fun to serious simulation. The fastest and most celebrated titles ranked by players.",
        keywords:    "best racing games, top racing games 2026, racing simulation games, arcade racing games",
    },
    "sports": {
        title:       "Best Sports Games in 2026",
        h1:          "Best Sports Games",
        description: "The highest-rated sports games across every discipline. Football, basketball, tennis and more — ranked by community score.",
        keywords:    "best sports games, top sports games 2026, football games, basketball games, sports games ranked",
    },
    "fighting": {
        title:       "Best Fighting Games in 2026",
        h1:          "Best Fighting Games",
        description: "Top fighting games ranked by players. From beginner-friendly entries to deep competitive titles — the best in the genre.",
        keywords:    "best fighting games, top fighting games 2026, fighting games ranked, best 1v1 games",
    },
    "casual": {
        title:       "Best Casual Games in 2026",
        h1:          "Best Casual Games",
        description: "Top-rated casual games for every type of player. Easy to pick up, hard to put down — ranked by community rating.",
        keywords:    "best casual games, top casual games 2026, easy games, relaxing games, casual games ranked",
    },
};

function getMeta(genre: string) {
    return GENRE_META[genre] ?? {
        title:       `Best ${genre.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())} Games in 2026`,
        h1:          `Best ${genre.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())} Games`,
        description: `The best ${genre.replace(/-/g, " ")} games ranked by community rating. Browse top-rated titles on TechPlay.`,
        keywords:    `best ${genre.replace(/-/g, " ")} games, top ${genre.replace(/-/g, " ")} games 2026`,
    };
}

export async function generateMetadata({ params }: { params: Promise<{ genre: string }> }): Promise<Metadata> {
    const { genre } = await params;
    const meta = getMeta(genre);
    const url = `https://techplay.gg/games/genre/${genre}`;

    // Any string reaching this route rendered an indexable page: "Best
    // Asdfghjkl Games in 2026" answered 200 with index, follow. That is an
    // unbounded doorway surface — a crawler or anyone with a URL bar can
    // mint thin pages forever. The curated set is what we wrote landing
    // copy for and what belongs in an index; everything else still renders
    // for a reader, and still passes link equity, it just is not indexed.
    const curated = Object.prototype.hasOwnProperty.call(GENRE_META, genre);
    /*
     * A curated facet with nothing behind it is still an empty page.
     *
     * Ten of the fifteen curated tags matched no games at all — open-world,
     * multiplayer, co-op, story-rich and the rest. The landing copy was written
     * against a Steam-style vocabulary, and the catalogue rebuild in August
     * replaced it: the tags in the data now read "Direct control", "1st-person",
     * "Fixed / flip-screen". All ten answered index,follow and all ten sat in
     * sitemap-hub.xml, so we asked Google to crawl ten pages and gave it
     * nothing on arrival.
     *
     * Counted rather than listed, so a facet that fills up returns on its own
     * and one that empties leaves on its own. Only a count actually read
     * demotes the page — a failed fetch leaves it as it was.
     */
    const stocked = (await fetchFacetGames({ genre: genreFilter(genre) })).length;


    return {
        title:       `${meta.title}`,
        description: meta.description,
        keywords:    meta.keywords,
        alternates:  { canonical: url },
        ...(curated && stocked > 0 ? {} : { robots: { index: false, follow: true } }),
        openGraph: {
            title:       `${meta.title} — TechPlay`,
            description: meta.description,
            url,
            type:        "website",
            siteName:    "TechPlay",
        },
        twitter: {
            card:        "summary_large_image",
            title:       `${meta.title} — TechPlay`,
            description: meta.description,
        },
    };
}

export default async function GenreHubPage({ params }: { params: Promise<{ genre: string }> }) {
    const { genre } = await params;
    const meta = getMeta(genre);
    const url = `https://techplay.gg/games/genre/${genre}`;


    const breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home",  item: "https://techplay.gg" },
            { "@type": "ListItem", position: 2, name: "Games", item: "https://techplay.gg/games" },
            { "@type": "ListItem", position: 3, name: meta.h1, item: url },
        ],
    };

    const collectionPage = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: meta.title,
        description: meta.description,
        url,
    };

    // Fetched here so the grid is in the HTML; the hub draws it from
    // SWR otherwise, which answers in the browser and nowhere else.
    const preset = { genre: genreFilter(genre) };
    const games = await fetchFacetGames(preset);

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPage) }} />
            <GameDatabaseHub
                preset={preset}
                heading={meta.h1}
                intro={meta.description}
                initialGames={games}
            />
        </>
    );
}
