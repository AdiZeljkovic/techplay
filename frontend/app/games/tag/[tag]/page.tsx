import type { Metadata } from "next";
import GameDatabaseHub from "@/components/games/GameDatabaseHub";
import { tagFilter } from "@/lib/gameFacets";

export const revalidate = 86400;
export const dynamicParams = true;

const TAG_META: Record<string, { title: string; h1: string; description: string; keywords: string }> = {
    "open-world": {
        title:       "Best Open World Games in 2026",
        h1:          "Best Open World Games",
        description: "The highest-rated open world games ranked by players. Massive maps, freedom of exploration and hundreds of hours of content.",
        keywords:    "best open world games, top open world games 2026, open world RPG, sandbox games, exploration games",
    },
    "multiplayer": {
        title:       "Best Multiplayer Games in 2026",
        h1:          "Best Multiplayer Games",
        description: "Top-rated multiplayer games ranked by community score. Co-op, competitive and MMO titles worth playing with others.",
        keywords:    "best multiplayer games, top multiplayer games 2026, online games, co-op games, best PvP games",
    },
    "singleplayer": {
        title:       "Best Single-Player Games in 2026",
        h1:          "Best Single-Player Games",
        description: "The best single-player games for solo play. Story-driven, immersive and rewarding experiences ranked by community rating.",
        keywords:    "best single player games, top singleplayer games 2026, solo games, story games, offline games",
    },
    "co-op": {
        title:       "Best Co-op Games in 2026",
        h1:          "Best Co-op Games",
        description: "Top-rated co-op games to play with friends. Local and online co-op titles ranked by players — from couch to cross-platform.",
        keywords:    "best co-op games, top co-op games 2026, couch co-op games, online co-op games, games to play with friends",
    },
    "story-rich": {
        title:       "Best Story-Rich Games in 2026",
        h1:          "Best Story-Rich Games",
        description: "Games with unforgettable narratives ranked by community score. If story matters to you, start here.",
        keywords:    "best story games, top narrative games 2026, story rich games, best game stories, narrative driven games",
    },
    "survival": {
        title:       "Best Survival Games in 2026",
        h1:          "Best Survival Games",
        description: "The highest-rated survival games ranked by players. Base building, crafting and staying alive — the best in the genre.",
        keywords:    "best survival games, top survival games 2026, crafting games, base building games, survival crafting",
    },
    "roguelike": {
        title:       "Best Roguelike Games in 2026",
        h1:          "Best Roguelike Games",
        description: "Top roguelike and roguelite games ranked by community rating. Permadeath, procedural generation and addictive runs.",
        keywords:    "best roguelike games, top roguelite games 2026, roguelike games ranked, best roguelites, permadeath games",
    },
    "souls-like": {
        title:       "Best Souls-like Games in 2026",
        h1:          "Best Souls-like Games",
        description: "The highest-rated souls-like games ranked by players. Challenging combat, intricate lore and the satisfaction of finally winning.",
        keywords:    "best souls-like games, top soulslike games 2026, FromSoftware style games, difficult games, challenging games",
    },
    "metroidvania": {
        title:       "Best Metroidvania Games in 2026",
        h1:          "Best Metroidvania Games",
        description: "Top-rated metroidvania games ranked by community score. Interconnected maps, ability gates and the joy of backtracking.",
        keywords:    "best metroidvania games, top metroidvania 2026, metroidvania ranked, action platformer games",
    },
    "stealth": {
        title:       "Best Stealth Games in 2026",
        h1:          "Best Stealth Games",
        description: "The best stealth games ranked by players. Infiltration, patience and the satisfaction of an invisible run.",
        keywords:    "best stealth games, top stealth games 2026, stealth action games, espionage games, ninja games",
    },
    "sandbox": {
        title:       "Best Sandbox Games in 2026",
        h1:          "Best Sandbox Games",
        description: "Top sandbox games with full creative freedom. Build, explore and play your way — ranked by community rating.",
        keywords:    "best sandbox games, top sandbox games 2026, creative games, building games, open-ended games",
    },
    "first-person": {
        title:       "Best First-Person Games in 2026",
        h1:          "Best First-Person Games",
        description: "The highest-rated first-person games. FPS, immersive sims and walking sims — all viewed through your own eyes.",
        keywords:    "best first person games, top FPS games 2026, first person shooters, immersive sim games",
    },
    "anime": {
        title:       "Best Anime Games in 2026",
        h1:          "Best Anime Games",
        description: "Top-rated anime-style games ranked by community score. JRPGs, visual novels and action games with anime aesthetics.",
        keywords:    "best anime games, top anime games 2026, JRPG games, anime style games, anime video games ranked",
    },
    "pixel-graphics": {
        title:       "Best Pixel Art Games in 2026",
        h1:          "Best Pixel Art Games",
        description: "The highest-rated pixel art games ranked by players. Retro aesthetics, modern gameplay and incredible indie craftsmanship.",
        keywords:    "best pixel art games, top pixel games 2026, retro games, 8-bit games, pixel indie games",
    },
    "post-apocalyptic": {
        title:       "Best Post-Apocalyptic Games in 2026",
        h1:          "Best Post-Apocalyptic Games",
        description: "Top post-apocalyptic games ranked by community rating. Wastelands, survival and stories of humanity's last stand.",
        keywords:    "best post apocalyptic games, top post-apocalyptic games 2026, wasteland games, apocalypse games ranked",
    },
};

function getMeta(tag: string) {
    if (TAG_META[tag]) return TAG_META[tag];
    const name = tag.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    return {
        title:       `Best ${name} Games in 2026`,
        h1:          `Best ${name} Games`,
        description: `The best ${name.toLowerCase()} games ranked by community rating. Browse top-rated titles tagged with "${name.toLowerCase()}" on TechPlay.`,
        keywords:    `best ${name.toLowerCase()} games, top ${name.toLowerCase()} games 2026, ${name.toLowerCase()} games ranked`,
    };
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
    const { tag } = await params;
    const meta = getMeta(tag);
    const url = `https://techplay.gg/games/tag/${tag}`;

    // Any string reaching this route rendered an indexable page: "Best
    // Asdfghjkl Games in 2026" answered 200 with index, follow. That is an
    // unbounded doorway surface — a crawler or anyone with a URL bar can
    // mint thin pages forever. The curated set is what we wrote landing
    // copy for and what belongs in an index; everything else still renders
    // for a reader, and still passes link equity, it just is not indexed.
    const curated = Object.prototype.hasOwnProperty.call(TAG_META, tag);

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

export default async function TagHubPage({ params }: { params: Promise<{ tag: string }> }) {
    const { tag } = await params;
    const meta = getMeta(tag);
    const url = `https://techplay.gg/games/tag/${tag}`;


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
            <GameDatabaseHub preset={{ tag: tagFilter(tag) }} heading={meta.h1} intro={meta.description} />
        </>
    );
}
