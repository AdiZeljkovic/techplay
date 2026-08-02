/**
 * The rank ladder in order, mirroring backend/database/seeders/RankSeeder.php.
 * The seeder groups the twenty ranks into five tiers of four; the tier isn't a
 * column, so it's derived here from position rather than stored twice.
 *
 * If a rank is renamed in the seeder, rename it here too — an unknown name
 * simply yields no tier rather than the wrong one.
 */
export const RANK_ORDER = [
    "Newcomer", "Player", "Rookie", "Bronze",
    "Silver", "Gold", "Platinum", "Diamond",
    "Master", "Grandmaster", "Challenger", "Elite",
    "Veteran", "Legend", "Mythic", "Immortal",
    "Ascendant", "Radiant", "Apex", "Eternal",
] as const;

const ROMAN = ["I", "II", "III", "IV", "V"];

/** "Silver" → "Tier II". Null when the name isn't on the ladder. */
export function rankTier(name: string | null): string | null {
    if (!name) return null;

    const index = RANK_ORDER.findIndex((r) => r.toLowerCase() === name.toLowerCase());
    if (index < 0) return null;

    return `Tier ${ROMAN[Math.min(ROMAN.length - 1, Math.floor(index / 4))]}`;
}
