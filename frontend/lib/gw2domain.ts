/**
 * A colour per domain, and per mastery region.
 *
 * Gear is crimson, fractals are violet, raids are orange, the Wizard's Vault is
 * gold. They colour data — the fill of a bar, a segment, a status dot — and
 * nothing else. The first cut of the redesign also tinted the cards, panels and
 * heroes they sat on, and across a page the colour was all anyone saw (owner,
 * 28 Oct 2026); containers are neutral now, and the colour is where a figure is.
 *
 * These are deliberately not `--accent`. The site's accent belongs to TechPlay
 * and follows the user's own setting; these belong to Guild Wars 2 and have to
 * stay put, because a player already associates them with the content. Where a
 * hue here sits close to the site accent that is a coincidence, not a link.
 */

export const DOMAIN_TONE: Record<string, string> = {
    gear: "#FB3E8D",
    fractals: "#A855F7",
    masteries: "#22C55E",
    achievements: "#FACC15",
    mounts: "#38BDF8",
    raids: "#F97316",
    vault: "#EAB308",
    story: "#818CF8",
    content: "#818CF8",
    /*
     * The pages rather than the advice. Legendary is not the rarity's own
     * purple — #4C139D disappears on this background as a bar fill — but the
     * glow players know from the precursor forge.
     */
    legendary: "#E879F9",
    crafting: "#2DD4BF",
    account: "#94A3B8",
    reference: "#60A5FA",
    changes: "#A3E635",
};

/** Falls back to the site accent, so an unknown domain is quiet, not wrong. */
export function domainTone(domain: string | null | undefined): string {
    return (domain && DOMAIN_TONE[domain]) || "var(--accent)";
}

/**
 * The scene at the top of a recommendation card, per domain.
 *
 * Empty until the generated art lands in `/images/gw2/` (the list and the
 * rules for it are in `gw2/REDIZAJN.md` §5). A path goes in here only once
 * the file is in the repo — a card pointing at a missing image is a broken
 * picture on every dashboard, where a card with no entry falls back to its
 * own scene or to no picture at all.
 */
export const DOMAIN_ART: Record<string, string> = {};

/**
 * The scene behind each page's hero, under `/images/gw2/`.
 *
 * Cut from ArenaNet's official Guild Wars 2 asset kits (base game, Heart of
 * Thorns, Path of Fire; guildwars2.com/en/media/asset-kit). On 28 October 2026
 * the owner chose these over the generated art planned in REDIZAJN.md §5. The
 * kits are governed by ArenaNet's Content Use Policy, which is settled as part
 * of the legal step; until it is, every hero carries the credit.
 *
 * Banners are 2400×700 WebP — the raids one is 1920×560, the size of its
 * source. The motif sits right of centre, because the hero darkens its left
 * side for the title.
 */
export const HERO_ART = {
    dashboard: "/images/gw2/hero-dashboard.webp",
    next: "/images/gw2/hero-next.webp",
    ascended: "/images/gw2/hero-ascended.webp",
    crafting: "/images/gw2/hero-crafting.webp",
    masteries: "/images/gw2/hero-masteries.webp",
    achievements: "/images/gw2/hero-achievements.webp",
    fractals: "/images/gw2/hero-fractals.webp",
    raids: "/images/gw2/hero-raids.webp",
    legendary: "/images/gw2/hero-legendary.webp",
    tonight: "/images/gw2/hero-tonight.webp",
    story: "/images/gw2/hero-story.webp",
    account: "/images/gw2/hero-account.webp",
    whatsNew: "/images/gw2/hero-whats-new.webp",
    database: "/images/gw2/hero-database.webp",
    guides: "/images/gw2/hero-guides.webp",
    mounts: "/images/gw2/hero-mounts.webp",
    vault: "/images/gw2/hero-vault.webp",
} as const;

/** A guide's hero, by its family; the guides index's scene for the rest. */
export function guideArt(family: string): string {
    const byFamily: Record<string, string> = {
        fractals: HERO_ART.fractals,
        masteries: HERO_ART.masteries,
        achievements: HERO_ART.achievements,
        mounts: HERO_ART.mounts,
        legendary: HERO_ART.legendary,
        goals: HERO_ART.ascended,
        "wizards-vault": HERO_ART.vault,
        progression: HERO_ART.next,
        "level-80": HERO_ART.next,
    };

    return byFamily[family] ?? HERO_ART.guides;
}

/**
 * Mastery regions, in the expansions' own colours.
 *
 * Keyed by the name the **account** endpoint uses, which is not the name the
 * catalogue uses — `Path of Fire` here, `Desert` there. That split is load
 * bearing everywhere in this tool and `MasteryRegions` on the backend owns the
 * translation; this map is on the account side of it.
 */
export const REGION_TONE: Record<string, string> = {
    "Central Tyria": "#94A3B8",
    "Heart of Thorns": "#22C55E",
    "Path of Fire": "#FB3E8D",
    "Icebrood Saga": "#38BDF8",
    "End of Dragons": "#2DD4BF",
    "Secrets of the Obscure": "#FBBF24",
    "Janthir Wilds": "#A78BFA",
};

export function regionTone(region: string | null | undefined): string {
    return (region && REGION_TONE[region]) || "var(--accent)";
}
