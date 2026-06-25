"use client";

// Loaded via dynamic({ ssr: false }) only — Leaflet DOM access is safe here
import { MapContainer, ImageOverlay, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { useEffect, useState } from "react";
import { getCategoryColor, getCategoryLabel } from "./gta6Utils";
import type { Gta6Location } from "@/types";

// GTA VI game world bounds (from GTADB maps.js)
const MIN_X = -16000, MAX_X = 4000;
const MIN_Y = -8000,  MAX_Y = 12000;
const GAME_W = MAX_X - MIN_X; // 20000
const GAME_H = MAX_Y - MIN_Y; // 20000

// Normalize game coords to [0, 1000] so Leaflet CRS.Simple works at sane zoom levels.
const MAP_SIZE = 1000;

function normalizeX(gameX: number): number {
    return (gameX - MIN_X) / GAME_W * MAP_SIZE;
}
function normalizeY(gameY: number): number {
    return (gameY - MIN_Y) / GAME_H * MAP_SIZE;
}
function gameToLeaflet(gameX: number, gameY: number): [number, number] {
    return [normalizeY(gameY), normalizeX(gameX)]; // [lat, lng]
}

// ----- TILES -----

const GTADB_RAW = "https://raw.githubusercontent.com/rolux/gtadb.org/main/maps/tiles/6/yanis%2C13";

// Leaflet bounds [[southLat, westLng], [northLat, eastLng]] for a GTADB tile
function gtaTileBounds(z: number, row: number, col: number): [[number, number], [number, number]] {
    const totalTiles = 3 * Math.pow(2, z); // 3 at z=0, 6 at z=1, ...
    const tileGameH  = GAME_H / totalTiles;
    const tileGameW  = GAME_W / totalTiles;
    const northGameY = MAX_Y - row * tileGameH;
    const southGameY = MAX_Y - (row + 1) * tileGameH;
    const westGameX  = MIN_X + col * tileGameW;
    const eastGameX  = MIN_X + (col + 1) * tileGameW;
    return [
        [normalizeY(southGameY), normalizeX(westGameX)],
        [normalizeY(northGameY), normalizeX(eastGameX)],
    ];
}

function gtaTileUrl(z: number, row: number, col: number): string {
    return `${GTADB_RAW}/${z}/${z}%2C${row}%2C${col}.jpg`;
}

// Zoom-0: full 3×3 base map
const Z0_TILES = [0, 1, 2].flatMap(r => [0, 1, 2].map(c => ({ r, c })));

// Zoom-1 tiles with actual game content (rows 2-3, cols 0-4, based on z=3 coverage analysis)
// These cover the Leonida/Vice City area with 2× better resolution than z=0
const Z1_CONTENT_TILES = [
    { r: 2, c: 0 }, { r: 2, c: 1 }, { r: 2, c: 2 }, { r: 2, c: 3 }, { r: 2, c: 4 },
    { r: 3, c: 0 }, { r: 3, c: 1 }, { r: 3, c: 2 }, { r: 3, c: 3 }, { r: 3, c: 4 },
];

// Vice City area in normalized [0,1000] coords — used for default fitBounds
// Game X[-5000, 1500] → normalized [550, 875], Game Y[-1000, 3500] → normalized [350, 575]
const VICE_CITY_BOUNDS: [[number, number], [number, number]] = [[350, 550], [575, 875]];

// ----- MAP COMPONENTS -----

function FitBoundsOnLoad() {
    const map = useMap();
    useEffect(() => {
        map.fitBounds(VICE_CITY_BOUNDS, { padding: [20, 20] });
    }, [map]);
    return null;
}

// Load zoom-1 tiles only when the user has zoomed in enough to benefit from them
function AdaptiveTiles() {
    const map = useMap();
    const [showZ1, setShowZ1] = useState(false);

    useEffect(() => {
        const update = () => setShowZ1(map.getZoom() >= 1);
        map.on("zoomend", update);
        update();
        return () => { map.off("zoomend", update); };
    }, [map]);

    if (!showZ1) return null;

    return (
        <>
            {Z1_CONTENT_TILES.map(({ r, c }) => (
                <ImageOverlay
                    key={`z1-${r}-${c}`}
                    url={gtaTileUrl(1, r, c)}
                    bounds={gtaTileBounds(1, r, c)}
                    opacity={1}
                />
            ))}
        </>
    );
}

// ----- CLUSTER ICON -----

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createClusterIcon(cluster: any) {
    const count = cluster.getChildCount();
    const size  = count > 99 ? 46 : count > 9 ? 40 : 34;
    const fs    = count > 99 ? 11 : 13;
    return L.divIcon({
        html: `<div style="
            width:${size}px;height:${size}px;border-radius:50%;
            background:#FC4100;
            border:3px solid rgba(252,65,0,0.3);
            color:#fff;font-weight:700;font-size:${fs}px;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 0 16px rgba(252,65,0,0.45),0 2px 8px rgba(0,0,0,0.5);
            cursor:pointer;
        ">${count}</div>`,
        className: "",
        iconSize:   [size, size],
        iconAnchor: [size / 2, size / 2],
    });
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

// ----- MAIN COMPONENT -----

interface Props {
    locations: Gta6Location[];
}

export default function Gta6LeafletMap({ locations }: Props) {
    const mappable = locations.filter(
        (l): l is Gta6Location & { game_x: number; game_y: number } =>
            l.game_x != null && l.game_y != null
    );

    return (
        <MapContainer
            crs={L.CRS.Simple}
            center={[462, 712]}   // center of Vice City bounds
            zoom={1}
            zoomControl={false}
            minZoom={-2}
            maxZoom={5}
            maxBounds={[[-60, -60], [MAP_SIZE + 60, MAP_SIZE + 60]]}
            maxBoundsViscosity={0.8}
            style={{ height: "100%", width: "100%", background: "#05070A" }}
        >
            {/* Base layer: zoom-0 tiles (3×3, full game world) */}
            {Z0_TILES.map(({ r, c }) => (
                <ImageOverlay
                    key={`z0-${r}-${c}`}
                    url={gtaTileUrl(0, r, c)}
                    bounds={gtaTileBounds(0, r, c)}
                    opacity={1}
                />
            ))}

            {/* Enhanced layer: zoom-1 tiles loaded when zoomed in */}
            <AdaptiveTiles />

            {/* Fit to Vice City on initial load */}
            <FitBoundsOnLoad />

            <ZoomControl position="bottomright" />

            {/* Clustered markers using in-game coordinates */}
            <MarkerClusterGroup
                chunkedLoading
                iconCreateFunction={createClusterIcon}
                showCoverageOnHover={false}
                spiderfyOnMaxZoom={true}
                maxClusterRadius={50}
            >
                {mappable.map(loc => {
                    const color   = getCategoryColor(loc.categories);
                    const opacity = loc.is_unconfirmed ? 0.5 : 1;
                    const icon    = makeIcon(color, opacity);
                    const [lat, lng] = gameToLeaflet(loc.game_x, loc.game_y);

                    return (
                        <Marker key={loc.id} position={[lat, lng]} icon={icon}>
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
                                        X: {loc.game_x.toFixed(0)} · Y: {loc.game_y.toFixed(0)}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MarkerClusterGroup>
        </MapContainer>
    );
}
