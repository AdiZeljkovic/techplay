import type { Metadata } from "next";
import GameDatabaseHub from "@/components/games/GameDatabaseHub";

export const revalidate = 86400;
export const dynamicParams = true;

function getMeta(year: string) {
    const y = parseInt(year);
    const isCurrent = y === 2026;
    const isRecent  = y >= 2020;

    let description: string;
    if (isCurrent) {
        description = `The best games of 2026 ranked by community score. Updated regularly as new titles release — your guide to gaming in 2026.`;
    } else if (isRecent) {
        description = `The best games released in ${year}, ranked by community rating. Revisit the standout titles and hidden gems from ${year}.`;
    } else {
        description = `The highest-rated games from ${year}. A definitive look back at the titles that defined that year in gaming.`;
    }

    return {
        title:       isCurrent ? `Best Games of 2026` : `Best Games of ${year}`,
        h1:          isCurrent ? `Best Games of 2026` : `Best Games of ${year}`,
        description,
        keywords:    `best games of ${year}, top games ${year}, game of the year ${year}, best video games ${year}, ${year} games ranked`,
    };
}

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }): Promise<Metadata> {
    const { year } = await params;
    const meta = getMeta(year);
    const url = `https://techplay.gg/games/year/${year}`;

    return {
        title:       `${meta.title} — TechPlay`,
        description: meta.description,
        keywords:    meta.keywords,
        alternates:  { canonical: url },
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

export default async function YearHubPage({ params }: { params: Promise<{ year: string }> }) {
    const { year } = await params;
    const meta = getMeta(year);
    const url = `https://techplay.gg/games/year/${year}`;


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

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPage) }} />
            <GameDatabaseHub preset={{ yearFrom: Number(year), yearTo: Number(year) }} heading={meta.h1} intro={meta.description} />
        </>
    );
}
