"use client";

// Loaded via dynamic({ ssr: false }) only — Leaflet DOM access is safe here
import { MapContainer, ImageOverlay, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import { getCategoryColor, getCategoryLabel } from "./gta6Utils";
import type { Gta6Location } from "@/types";

// GTA VI game world bounds (from GTADB maps.js analysis)
const MIN_X = -16000, MAX_X = 4000;
const MIN_Y = -8000,  MAX_Y = 12000;
const GAME_W = MAX_X - MIN_X; // 20000
const GAME_H = MAX_Y - MIN_Y; // 20000

// GTADB zoom 0 = 3×3 tile grid covering the full game world
const TILE_COLS = 3;
const TILE_ROWS = 3;
const TILE_W = GAME_W / TILE_COLS; // ≈ 6666.67 game units per tile
const TILE_H = GAME_H / TILE_ROWS;

// GitHub raw URL for GTADB zoom-0 tiles (tileset yanis,13 — CC BY 4.0)
const GTADB_BASE = "https://raw.githubusercontent.com/rolux/gtadb.org/main/maps/tiles/6/yanis%2C13/0";

function tileUrl(row: number, col: number): string {
    return `${GTADB_BASE}/0%2C${row}%2C${col}.jpg`;
}

// [[southGameY, westGameX], [northGameY, eastGameX]] — Leaflet CRS.Simple format
function tileBounds(row: number, col: number): [[number, number], [number, number]] {
    const northY = MAX_Y - row * TILE_H;
    const southY = MAX_Y - (row + 1) * TILE_H;
    const westX  = MIN_X + col * TILE_W;
    const eastX  = MIN_X + (col + 1) * TILE_W;
    return [[southY, westX], [northY, eastX]];
}

// Fit map to full game world on mount
function FitBoundsOnLoad() {
    const map = useMap();
    useEffect(() => {
        map.fitBounds([[MIN_Y, MIN_X], [MAX_Y, MAX_X]], { padding: [10, 10] });
    }, [map]);
    return null;
}

function makeIcon(color: string, opacity: number) {
    return L.divIcon({
        className: "",
        html: `<div style="
            width:10px;height:10px;border-radius:50%;
            background:${color};
            border:2px solid rgba(255,255,255,0.4);
            opacity:${opacity};
            box-shadow:0 0 6px ${color}88;
        "></div>`,
        iconSize:    [10, 10],
        iconAnchor:  [5, 5],
        popupAnchor: [0, -8],
    });
}

// Pre-compute tile grid
const MAP_TILES = [0, 1, 2].flatMap(row => [0, 1, 2].map(col => ({ row, col })));

interface Props {
    locations: Gta6Location[];
}

export default function Gta6LeafletMap({ locations }: Props) {
    // Only show locations that have game coordinates
    const mappable = locations.filter(
        (l): l is Gta6Location & { game_x: number; game_y: number } =>
            l.game_x != null && l.game_y != null
    );

    return (
        <MapContainer
            crs={L.CRS.Simple}
            center={[2000, -6000]}
            zoom={0}
            zoomControl={false}
            minZoom={-3}
            maxZoom={3}
            maxBounds={[[MIN_Y - 1000, MIN_X - 1000], [MAX_Y + 1000, MAX_X + 1000]]}
            maxBoundsViscosity={0.85}
            style={{ height: "100%", width: "100%", background: "#05070A" }}
        >
            {/* GTA VI map background: 3×3 tiles from GTADB (CC BY 4.0) */}
            {MAP_TILES.map(({ row, col }) => (
                <ImageOverlay
                    key={`${row}-${col}`}
                    url={tileUrl(row, col)}
                    bounds={tileBounds(row, col)}
                    opacity={1}
                />
            ))}

            <FitBoundsOnLoad />
            <ZoomControl position="bottomright" />

            {/* Markers using in-game coordinates */}
            {mappable.map(loc => {
                const color   = getCategoryColor(loc.categories);
                const opacity = loc.is_unconfirmed ? 0.45 : 1;
                const icon    = makeIcon(color, opacity);

                return (
                    <Marker
                        key={loc.id}
                        position={[loc.game_y, loc.game_x]}
                        icon={icon}
                    >
                        <Popup>
                            <div style={{ minWidth: 200 }}>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                                    <div style={{
                                        marginTop: 3,
                                        width: 10, height: 10,
                                        borderRadius: "50%",
                                        backgroundColor: color,
                                        flexShrink: 0,
                                    }} />
                                    <p style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3, margin: 0 }}>
                                        {loc.name}
                                    </p>
                                </div>
                                <p style={{ fontSize: 11, opacity: 0.7, margin: "4px 0" }}>
                                    <strong>Category:</strong> {getCategoryLabel(loc.categories)}
                                </p>
                                {loc.is_unconfirmed && (
                                    <p style={{ fontSize: 11, color: "#F59E0B", margin: "2px 0" }}>
                                        ⚠ Unconfirmed location
                                    </p>
                                )}
                                {loc.real_address && (
                                    <p style={{ fontSize: 10, opacity: 0.5, marginTop: 4, lineHeight: 1.4 }}>
                                        {loc.real_address}
                                    </p>
                                )}
                                <p style={{ fontSize: 10, opacity: 0.4, marginTop: 4, fontFamily: "monospace" }}>
                                    {loc.game_x.toFixed(1)}, {loc.game_y.toFixed(1)}
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
