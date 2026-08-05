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
export const TAG_FILTER: Record<string, string> = {
    fantasy: "Fantasy",
    "sci-fi": "Sci-Fi / Futuristic",
    horror: "Horror",
    "1st-person": "1st-person",
    "3rd-person": "3rd-person (Other)",
    "top-down": "Top-down",
    "side-view": "Side view",
    "real-time": "Real-time",
    "turn-based": "Turn-based",
};

export const tagFilter = (slug: string) => TAG_FILTER[slug.toLowerCase()] ?? titleCase(slug);
