import type { Metadata } from "next";
import GameDatabaseHub from "@/components/games/GameDatabaseHub";
import { platformFilter } from "@/lib/gameFacets";

export const revalidate = 86400;
export const dynamicParams = true;

const PLATFORM_META: Record<string, {
    title: string;
    h1: string;
    description: string;
    keywords: string;
}> = {
    "pc": {
        title:       "Best PC Games in 2026",
        h1:          "Best PC Games",
        description: "The highest-rated PC games ranked by community score. From indie gems to AAA titles — the definitive list for PC gamers.",
        keywords:    "best PC games, top PC games 2026, best games on PC, PC gaming, Steam games ranked",
    },
    "playstation": {
        title:       "Best PlayStation Games in 2026",
        h1:          "Best PlayStation Games",
        description: "Top-rated PlayStation games across PS4 and PS5. Exclusives, multiplatform hits and hidden gems — ranked by players.",
        keywords:    "best PlayStation games, best PS5 games 2026, best PS4 games, PlayStation exclusives, top PlayStation games",
    },
    "xbox": {
        title:       "Best Xbox Games in 2026",
        h1:          "Best Xbox Games",
        description: "The best Xbox games ranked by community rating. Game Pass highlights, exclusives and top multiplatform titles for Xbox owners.",
        keywords:    "best Xbox games, best Xbox Series X games 2026, Xbox Game Pass games, top Xbox games, Xbox exclusives",
    },
    "nintendo": {
        title:       "Best Nintendo Games in 2026",
        h1:          "Best Nintendo Games",
        description: "Top-rated Nintendo games ranked by players. Switch exclusives, classics and the best titles in Nintendo's legendary library.",
        keywords:    "best Nintendo games, best Nintendo Switch games 2026, Nintendo exclusives, top Switch games",
    },
    "mobile": {
        title:       "Best Mobile Games in 2026",
        h1:          "Best Mobile Games",
        description: "The highest-rated mobile games for iOS and Android. No pay-to-win lists — just the best games worth your time.",
        keywords:    "best mobile games, best iOS games 2026, best Android games 2026, top mobile games, mobile gaming",
    },
};

function getMeta(platform: string) {
    return PLATFORM_META[platform] ?? {
        title:       `Best ${platform.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())} Games in 2026`,
        h1:          `Best ${platform.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())} Games`,
        description: `The best games on ${platform.replace(/-/g, " ")} ranked by community rating. Browse top titles on TechPlay.`,
        keywords:    `best ${platform.replace(/-/g, " ")} games, top ${platform.replace(/-/g, " ")} games 2026`,
    };
}

export async function generateMetadata({ params }: { params: Promise<{ platform: string }> }): Promise<Metadata> {
    const { platform } = await params;
    const meta = getMeta(platform);
    const url = `https://techplay.gg/games/platform/${platform}`;

    // Any string reaching this route rendered an indexable page: "Best
    // Asdfghjkl Games in 2026" answered 200 with index, follow. That is an
    // unbounded doorway surface — a crawler or anyone with a URL bar can
    // mint thin pages forever. The curated set is what we wrote landing
    // copy for and what belongs in an index; everything else still renders
    // for a reader, and still passes link equity, it just is not indexed.
    const curated = Object.prototype.hasOwnProperty.call(PLATFORM_META, platform);

    return {
        title:       `${meta.title}`,
        description: meta.description,
        keywords:    meta.keywords,
        alternates:  { canonical: url },
        ...(curated ? {} : { robots: { index: false, follow: true } }),
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

export default async function PlatformHubPage({ params }: { params: Promise<{ platform: string }> }) {
    const { platform } = await params;
    const meta = getMeta(platform);
    const url = `https://techplay.gg/games/platform/${platform}`;


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
            <GameDatabaseHub preset={{ platform: platformFilter(platform) }} heading={meta.h1} intro={meta.description} />
        </>
    );
}
