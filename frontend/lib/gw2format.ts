/**
 * Formatting shared by the signed-in GW2 pages and the server-rendered public
 * ones. Kept apart from `lib/gw2.ts` because that module carries the axios
 * client, and a server component should not pull a browser client in to format
 * a number.
 */

/** Copper, the way the game writes money: `12g 34s 56c`. */
export function coin(copper: number): string {
    const gold = Math.floor(copper / 10000);
    const silver = Math.floor((copper % 10000) / 100);
    const copperLeft = copper % 100;

    return [gold > 0 ? `${gold}g` : null, gold > 0 || silver > 0 ? `${silver}s` : null, `${copperLeft}c`]
        .filter(Boolean)
        .join(" ");
}
