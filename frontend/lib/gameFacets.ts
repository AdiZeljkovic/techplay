/**
 * URL slug → the value the games API filters on.
 *
 * /games/genre/action and /games/platform/pc are indexed pages, but the API
 * filters on the text name it stores ("Action", "PC"), not the slug in the
 * URL. This is the one place that translation lives, so the facet pages and
 * the hub can never disagree about what "action" means.
 */

export const GENRE_FILTER: Record<string, string> = {
    action: "Action",
    rpg: "Role-Playing (RPG)",
    shooter: "Shooter",
    indie: "Indie",
    adventure: "Adventure",
    strategy: "Strategy",
    puzzle: "Puzzle",
    horror: "Horror",
    racing: "Racing",
    sports: "Sports",
    platformer: "Platform",
    simulation: "Simulation",
};

export const PLATFORM_FILTER: Record<string, string> = {
    pc: "PC",
    playstation: "PlayStation",
    xbox: "Xbox",
    nintendo: "Nintendo",
    mobile: "Mobile",
    retro: "Retro",
};

/** Falls back to the slug capitalised, so an unmapped facet still filters on something. */
const titleCase = (slug: string) =>
    slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

export const genreFilter = (slug: string) => GENRE_FILTER[slug.toLowerCase()] ?? titleCase(slug);
export const platformFilter = (slug: string) => PLATFORM_FILTER[slug.toLowerCase()] ?? titleCase(slug);

/**
 * Tags come from MobyGames and read like descriptors — "Direct control",
 * "1st-person", "Side view" — not the marketing words a slug usually carries.
 * Anything unmapped is title-cased and tried as-is.
 */
/**
 * URL slug to the exact string stored in games.tags.
 *
 * Exact is the word. The values here are matched with `@>` against a text[]
 * column, so they are case-sensitive and space-sensitive, and the vocabulary
 * changed under them: the catalogue rebuild in August replaced RAWG's tags with
 * MobyGames', which capitalise only the first word — "Sci-fi / futuristic", not
 * "Sci-Fi / Futuristic".
 *
 * That one capital F cost 18,396 games. Measured across the twenty tag pages in
 * sitemap-hub.xml, thirteen were serving an empty grid under index,follow, and
 * seven of those were this: a slug with no mapping, or a mapping written
 * against the old vocabulary. Together they cover 78,274 games.
 *
 * Six slugs are left out deliberately — multiplayer, singleplayer, co-op,
 * story-rich, souls-like and pixel-graphics. Nothing in the catalogue means any
 * of them; those are Steam's categories, not this data's. Their pages still
 * render for a reader and are noindexed automatically by the empty-facet guard.
 */
export const TAG_FILTER: Record<string, string> = {
    fantasy: "Fantasy",
    horror: "Horror",
    "sci-fi": "Sci-fi / futuristic",
    "1st-person": "1st-person",
    "first-person": "1st-person",
    "3rd-person": "3rd-person (Other)",
    "third-person": "3rd-person (Other)",
    "top-down": "Top-down",
    "side-view": "Side view",
    "real-time": "Real-time",
    "turn-based": "Turn-based",
    anime: "Anime / Manga",
    "open-world": "Open world",
    "post-apocalyptic": "Post-apocalyptic",
    "hack-and-slash": "Hack and slash",
};

export const tagFilter = (slug: string) => TAG_FILTER[slug.toLowerCase()] ?? titleCase(slug);
