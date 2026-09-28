/**
 * A colour per domain, and per mastery region.
 *
 * The mockups lean on this harder than on any other single device: gear is
 * crimson, fractals are violet, raids are green, the Wizard's Vault is gold,
 * and the five expansions each own a hue. It is what lets six cards in a row
 * read as six different kinds of thing before a word of any of them is read.
 *
 * The built version had one accent for everything, so every card looked like
 * every other card and the eye had nowhere to go.
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
};

/** Falls back to the site accent, so an unknown domain is quiet, not wrong. */
export function domainTone(domain: string | null | undefined): string {
    return (domain && DOMAIN_TONE[domain]) || "var(--accent)";
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
