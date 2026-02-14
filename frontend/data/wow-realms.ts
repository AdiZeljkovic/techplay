// WoW Realms by Region (Most Popular + Active realms)
// Source: https://worldofwarcraft.blizzard.com/en-us/game/status/us

export interface WowRealm {
    name: string;
    slug: string;
    locale: string;
}

export const WOW_REALMS: Record<string, WowRealm[]> = {
    us: [
        { name: "Area 52", slug: "area-52", locale: "en_US" },
        { name: "Illidan", slug: "illidan", locale: "en_US" },
        { name: "Stormrage", slug: "stormrage", locale: "en_US" },
        { name: "Tichondrius", slug: "tichondrius", locale: "en_US" },
        { name: "Mal'Ganis", slug: "malganis", locale: "en_US" },
        { name: "Bleeding Hollow", slug: "bleeding-hollow", locale: "en_US" },
        { name: "Zul'jin", slug: "zuljin", locale: "en_US" },
        { name: "Sargeras", slug: "sargeras", locale: "en_US" },
        { name: "Thrall", slug: "thrall", locale: "en_US" },
        { name: "Emerald Dream", slug: "emerald-dream", locale: "en_US" },
        { name: "Moon Guard", slug: "moon-guard", locale: "en_US" },
        { name: "Wyrmrest Accord", slug: "wyrmrest-accord", locale: "en_US" },
        { name: "Proudmoore", slug: "proudmoore", locale: "en_US" },
        { name: "Dalaran", slug: "dalaran", locale: "en_US" },
        { name: "Darkspear", slug: "darkspear", locale: "en_US" },
    ],
    eu: [
        { name: "Kazzak", slug: "kazzak", locale: "en_GB" },
        { name: "Silvermoon", slug: "silvermoon", locale: "en_GB" },
        { name: "Draenor", slug: "draenor", locale: "en_GB" },
        { name: "Tarren Mill", slug: "tarren-mill", locale: "en_GB" },
        { name: "Ragnaros", slug: "ragnaros", locale: "en_GB" },
        { name: "Twisting Nether", slug: "twisting-nether", locale: "en_GB" },
        { name: "Argent Dawn", slug: "argent-dawn", locale: "en_GB" },
        { name: "Outland", slug: "outland", locale: "en_GB" },
        { name: "Ravencrest", slug: "ravencrest", locale: "en_GB" },
        { name: "Stormscale", slug: "stormscale", locale: "en_GB" },
        { name: "Frostmane", slug: "frostmane", locale: "en_GB" },
        { name: "Defias Brotherhood", slug: "defias-brotherhood", locale: "en_GB" },
    ],
    kr: [
        { name: "Azshara", slug: "azshara", locale: "ko_KR" },
        { name: "Burning Legion", slug: "burning-legion", locale: "ko_KR" },
        { name: "Deathwing", slug: "deathwing", locale: "ko_KR" },
        { name: "Hyjal", slug: "hyjal", locale: "ko_KR" },
    ],
    tw: [
        { name: "Light's Hope", slug: "lights-hope", locale: "zh_TW" },
        { name: "Shadowmoon", slug: "shadowmoon", locale: "zh_TW" },
        { name: "Wrathbringer", slug: "wrathbringer", locale: "zh_TW" },
    ],
};

// Helper function to get realms by region
export function getRealmsByRegion(region: string): WowRealm[] {
    return WOW_REALMS[region.toLowerCase()] || [];
}

// Helper function to search realms
export function searchRealms(region: string, query: string): WowRealm[] {
    const realms = getRealmsByRegion(region);
    if (!query) return realms;

    const lowerQuery = query.toLowerCase();
    return realms.filter(realm =>
        realm.name.toLowerCase().includes(lowerQuery) ||
        realm.slug.includes(lowerQuery)
    );
}
