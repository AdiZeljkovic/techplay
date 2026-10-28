import type { InsightZone } from "@/lib/gw2";

/**
 * The game's own map, drawn from ArenaNet's tile service.
 *
 * `https://tiles.guildwars2.com/{continent}/{floor}/{z}/{x}/{y}.jpg` is part
 * of the official API, the same as the item icons, and the only map art this
 * site may use until its status with ArenaNet is settled. Tyria is continent 1,
 * and floor 1 carries the surface of every expansion — Path of Fire's maps are
 * listed on floor 49 alone, and floor 49 has no tiles, but floor 1 draws the
 * Crystal Desert all the same (checked 28 October 2026).
 *
 * The scale was checked against the tiles rather than taken from the API's
 * `max_zoom`, which says 8: at zoom 0 the 81,920-unit-wide continent is two and
 * a half tiles across, so a pixel at zoom z is 2^(7−z) continent units, and the
 * tile drawn at zoom 4 over Auric Basin's coordinates is Tarir.
 */

const TILE = 256;
const CONTINENT = 1;
const FLOOR = 1;

/** Continent units one tile covers at zoom z. */
function tileSpan(z: number): number {
    return TILE * 2 ** (7 - z);
}

function tileUrl(z: number, x: number, y: number): string {
    return `https://tiles.guildwars2.com/${CONTINENT}/${FLOOR}/${z}/${x}/${y}.jpg`;
}

/**
 * A region's maps on one picture: the terrain, each map's frame, and every
 * insight — in the region's colour where it is still to collect, faint where
 * it is collected, and plain white where we cannot tell.
 */
export function ZoneMap({ maps, tone, label }: { maps: InsightZone[]; tone: string; label: string }) {
    const framed = maps.flatMap((m) => (m.continent_rect ? [{ ...m, rect: m.continent_rect }] : []));

    if (framed.length === 0) {
        return <p className="text-xs text-[var(--ink-low)]">The game gives no frame for these maps.</p>;
    }

    const xs = framed.flatMap((m) => [m.rect[0][0], m.rect[1][0]]);
    const ys = framed.flatMap((m) => [m.rect[0][1], m.rect[1][1]]);
    const pad = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 0.04;
    const x1 = Math.min(...xs) - pad;
    const y1 = Math.min(...ys) - pad;
    const width = Math.max(...xs) + pad - x1;
    const height = Math.max(...ys) + pad - y1;

    /*
     * The zoom where the whole region is about 800 pixels across: sharp at the
     * panel's width on a high-density screen, and a dozen requests rather than
     * hundreds. Central Tyria's maps are scattered across the continent and come
     * out at zoom 2; Heart of Thorns at 4.
     */
    const z = Math.max(0, Math.min(7, Math.floor(7 + Math.log2(800 / Math.max(width, height)))));
    const span = tileSpan(z);
    const tiles: { x: number; y: number }[] = [];

    for (let tx = Math.floor(x1 / span); tx * span < x1 + width; tx++) {
        for (let ty = Math.floor(y1 / span); ty * span < y1 + height; ty++) {
            tiles.push({ x: tx, y: ty });
        }
    }

    const dot = Math.max(width, height) * 0.011;
    const stroke = Math.max(width, height) * 0.0025;
    const insights = framed.flatMap((m) => m.insights.flatMap((i) => (i.coord ? [{ ...i, coord: i.coord }] : [])));
    const left = insights.filter((i) => i.collected === false).length;

    return (
        <svg
            viewBox={`${x1} ${y1} ${width} ${height}`}
            className="block w-full rounded-[var(--radius-card)]"
            style={{ aspectRatio: `${width} / ${height}`, background: "var(--surface-2)" }}
            role="img"
            aria-label={`Map of ${label}: ${framed.length} maps, ${insights.length} mastery insights${
                insights.some((i) => i.collected !== null) ? `, ${left} still to collect` : ""
            }`}
        >
            {tiles.map((t) => (
                <image
                    key={`${t.x}-${t.y}`}
                    href={tileUrl(z, t.x, t.y)}
                    x={t.x * span}
                    y={t.y * span}
                    width={span}
                    height={span}
                    preserveAspectRatio="none"
                />
            ))}

            {/* Dimmed, so the pins are what the eye finds. */}
            <rect x={x1} y={y1} width={width} height={height} fill="rgba(5,7,10,0.38)" />

            {framed.map((m) => {
                const [[mx1, my1], [mx2, my2]] = m.rect;

                return (
                    <rect
                        key={m.id}
                        x={mx1}
                        y={my1}
                        width={mx2 - mx1}
                        height={my2 - my1}
                        fill="none"
                        stroke="rgba(255,255,255,0.28)"
                        strokeWidth={stroke}
                    >
                        <title>{m.name}</title>
                    </rect>
                );
            })}

            {insights.map((i) => (
                <circle
                    key={i.id}
                    cx={i.coord[0]}
                    cy={i.coord[1]}
                    r={dot}
                    fill={i.collected === true ? "rgba(255,255,255,0.35)" : i.collected === false ? tone : "#fff"}
                    stroke="rgba(5,7,10,0.85)"
                    strokeWidth={stroke}
                />
            ))}
        </svg>
    );
}

/**
 * The ground around one point, cut from a single tile: a thumbnail of where
 * an insight actually is, in place of the mockup's painted scenery.
 *
 * Zoom 5, where a tile is 1,024 units across — about a third of a map — so
 * the square shows the neighbourhood rather than a blur or a single rock.
 */
export function TileThumb({ coord, size = 56 }: { coord: [number, number]; size?: number }) {
    const z = 5;
    const span = tileSpan(z);
    const tx = Math.floor(coord[0] / span);
    const ty = Math.floor(coord[1] / span);
    // The tile drawn at twice the box, centred on the point but never past
    // its own edge — a point near a corner sits off-centre rather than beside
    // an empty band.
    const drawn = size * 2;
    const scale = drawn / span;
    const left = Math.min(0, Math.max(size - drawn, size / 2 - (coord[0] - tx * span) * scale));
    const top = Math.min(0, Math.max(size - drawn, size / 2 - (coord[1] - ty * span) * scale));
    const pinX = left + (coord[0] - tx * span) * scale;
    const pinY = top + (coord[1] - ty * span) * scale;

    return (
        <span
            aria-hidden
            className="relative block shrink-0 overflow-hidden rounded-[var(--radius-card)] border"
            style={{
                width: size,
                height: size,
                borderColor: "var(--line-strong)",
                backgroundColor: "var(--surface-2)",
                backgroundImage: `url(${tileUrl(z, tx, ty)})`,
                backgroundSize: `${drawn}px ${drawn}px`,
                backgroundPosition: `${left}px ${top}px`,
            }}
        >
            <span
                className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/70 bg-white"
                style={{ left: pinX, top: pinY }}
            />
        </span>
    );
}
