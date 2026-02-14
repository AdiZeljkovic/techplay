// WoW Class Colors (Official Blizzard Colors)
export const WOW_CLASS_COLORS: Record<string, string> = {
    "Death Knight": "#C41E3A",
    "Demon Hunter": "#A330C9",
    "Druid": "#FF7C0A",
    "Evoker": "#33937F",
    "Hunter": "#AAD372",
    "Mage": "#3FC7EB",
    "Monk": "#00FF98",
    "Paladin": "#F48CBA",
    "Priest": "#FFFFFF",
    "Rogue": "#FFF468",
    "Shaman": "#0070DD",
    "Warlock": "#8788EE",
    "Warrior": "#C69B6D",
};

// Faction data
export const WOW_FACTIONS = {
    Horde: {
        color: "#B30000",
        gradient: "from-red-900 to-red-700",
        textColor: "text-red-400",
        logo: "⚔️", // In production, use actual Horde logo image
    },
    Alliance: {
        color: "#0078FF",
        gradient: "from-blue-900 to-blue-700",
        textColor: "text-blue-400",
        logo: "🛡️", // In production, use actual Alliance logo image
    },
};

// Get class color
export function getClassColor(className: string): string {
    return WOW_CLASS_COLORS[className] || "#FFFFFF";
}

// Get faction theme
export function getFactionTheme(faction: string) {
    return WOW_FACTIONS[faction as keyof typeof WOW_FACTIONS] || WOW_FACTIONS.Alliance;
}

// Quality/Rarity colors (for achievements, items, etc.)
export const WOW_QUALITY_COLORS = {
    poor: "#9D9D9D",
    common: "#FFFFFF",
    uncommon: "#1EFF00",
    rare: "#0070DD",
    epic: "#A335EE",
    legendary: "#FF8000",
    artifact: "#E6CC80",
    heirloom: "#00CCFF",
};

// Get quality color by score
export function getScoreQuality(score: number): string {
    if (score >= 90) return WOW_QUALITY_COLORS.legendary;
    if (score >= 75) return WOW_QUALITY_COLORS.epic;
    if (score >= 50) return WOW_QUALITY_COLORS.rare;
    if (score >= 25) return WOW_QUALITY_COLORS.uncommon;
    return WOW_QUALITY_COLORS.common;
}
