"use client";

// Loaded via dynamic({ ssr: false }) only — Leaflet DOM access is safe here
import { MapContainer, ImageOverlay, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { useEffect } from "react";
import { getCategoryColor, getCategoryLabel } from "./gta6Utils";
import type { Gta6Location } from "@/types";

// GTA VI game world bounds (from GTADB maps.js)
const MIN_X = -16000, MAX_X = 4000;
const MIN_Y = -8000,  MAX_Y = 12000;
const GAME_W = MAX_X - MIN_X; // 20000
const GAME_H = MAX_Y - MIN_Y; // 20000

// Normalize game coords to [0, 1000] so Leaflet CRS.Simple works at sane zoom levels.
// At zoom 0: 1000 CSS pixels = whole map. At zoom -1: 500px. At zoom 1: 2000px.
const MAP_SIZE = 1000;

function normalizeX(gameX: number): number {
    return (gameX - MIN_X) / GAME_W * MAP_SIZE;
}
function normalizeY(gameY: number): number {
    // CRS.Simple lat increases upward — same direction as game Y. Direct mapping.
    return (gameY - MIN_Y) / GAME_H * MAP_SIZE;
}
function gameToLeaflet(gameX: number, gameY: number): [number, number] {
    return [normalizeY(gameY), normalizeX(gameX)]; // [lat, lng]
}

// GTADB zoom 0 = 3×3 tile grid covering the full game world
const TILE_COLS = 3;
const TILE_ROWS = 3;

// GitHub raw URL for GTADB zoom-0 tiles (CC BY 4.0, tileset yanis,13)
const GTADB_BASE = "https://raw.githubusercontent.com/rolux/gtadb.org/main/maps/tiles/6/yanis%2C13/0";

function tileUrl(row: number, col: number): string {
    return `${GTADB_BASE}/0%2C${row}%2C${col}.jpg`;
}

// [[southLat, westLng], [northLat, eastLng]] in normalized [0,1000] coordinate space
function tileBounds(row: number, col: number): [[number, number], [number, number]] {
    const tileGameH = GAME_H / TILE_ROWS;
    const tileGameW = GAME_W / TILE_COLS;
    // row=0 = northernmost (highest game Y), row=2 = southernmost
    const northGameY = MAX_Y - row * tileGameH;
    const southGameY = MAX_Y - (row + 1) * tileGameH;
    const westGameX  = MIN_X + col * tileGameW;
    const eastGameX  = MIN_X + (col + 1) * tileGameW;
    return [
        [normalizeY(southGameY), normalizeX(westGameX)],
        [normalizeY(northGameY), normalizeX(eastGameX)],
    ];
}

// Red cluster icon matching TechPlay accent color
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

// Auto-fit to full game world on mount
function FitBoundsOnLoad() {
    const map = useMap();
    useEffect(() => {
        // [[south, west], [north, east]] in normalized coords
        map.fitBounds([[0, 0], [MAP_SIZE, MAP_SIZE]], { padding: [16, 16] });
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

// Pre-compute 3×3 tile grid
const MAP_TILES = [0, 1, 2].flatMap(row => [0, 1, 2].map(col => ({ row, col })));

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
            center={[MAP_SIZE / 2, MAP_SIZE / 2]}
            zoom={0}
            zoomControl={false}
            minZoom={-2}
            maxZoom={4}
            maxBounds={[[-60, -60], [MAP_SIZE + 60, MAP_SIZE + 60]]}
            maxBoundsViscosity={0.8}
            style={{ height: "100%", width: "100%", background: "#05070A" }}
        >
            {/* GTA VI map background: 3×3 GTADB tiles (CC BY 4.0) */}
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

            {/* Clustered markers using normalized game coordinates */}
            <MarkerClusterGroup
                chunkedLoading
                iconCreateFunction={createClusterIcon}
                showCoverageOnHover={false}
                spiderfyOnMaxZoom={true}
                maxClusterRadius={60}
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
