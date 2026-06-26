"use client";

// Loaded via dynamic({ ssr: false }) only — Leaflet DOM access is safe here
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { useEffect, useState } from "react";
import { getCategoryColor, getCategoryLabel, getPhotoUrl } from "./gta6Utils";
import type { Gta6Location } from "@/types";

// GTA VI tile-image coordinate system (verbatim from GTADB maps.js):
//   mapW = mapH = 32768, zeroX = zeroY = 16384 (game origin at image centre)
//   cX = (gameX + 16384)/32768 * mapSize ; cY = (16384 - gameY)/32768 * mapSize
// So the full tile image spans game coords ±16384 in both axes.
const ZERO     = 16384;   // zeroX = zeroY
const MAP_FULL = 32768;   // mapW = mapH
const MAP_SIZE = 1024;    // CRS pixels at Leaflet zoom 0 (= theoretical 4×4 tiles of 256)

// Content bounds (where the island + landmarks actually are) — used for the default view
const CONTENT_MIN_X = -16000, CONTENT_MAX_X = 4000;
const CONTENT_MIN_Y = -8000,  CONTENT_MAX_Y = 12000;

// CRS.Simple defaults to transformation(1,0,-1,0) which inverts Y → tile coords become
// negative and GTADB tiles (y=0..2) never load. Fix: transformation(1,0,-1,MAP_SIZE)
// maps lat=MAP_SIZE (north) → pixel_y=0 (top) and lat=0 (south) → pixel_y=MAP_SIZE (bottom),
// so Leaflet tile y=0 = northernmost = GTADB row=0 ✓
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GTA_CRS: L.CRS = (L as any).Util.extend({}, L.CRS.Simple, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transformation: new ((L as any).Transformation)(1, 0, -1, MAP_SIZE),
});

function normalizeX(gameX: number): number {
    return (gameX + ZERO) / MAP_FULL * MAP_SIZE;
}
function normalizeY(gameY: number): number {
    // high gameY = north = high lat (top); CRS transform inverts to pixel_y=0
    return (gameY + ZERO) / MAP_FULL * MAP_SIZE;
}
function gameToLeaflet(gameX: number, gameY: number): [number, number] {
    return [normalizeY(gameY), normalizeX(gameX)]; // [lat, lng]
}

// Default view = frame all content (the island), so no marker spills into open ocean
const CONTENT_BOUNDS: [[number, number], [number, number]] = [
    [normalizeY(CONTENT_MIN_Y), normalizeX(CONTENT_MIN_X)],
    [normalizeY(CONTENT_MAX_Y), normalizeX(CONTENT_MAX_X)],
];

// GTADB tilesets — {z} appears twice (directory + filename prefix), {y}/{x} are tile indices.
// dupzor,51 = clean colored base map (no baked-in legend); yanis,13 = community map w/ legend.
const TILESETS = {
    color:     "dupzor%2C51",
    community: "yanis%2C13",
} as const;
type TileStyle = keyof typeof TILESETS;

function tileUrl(style: TileStyle): string {
    return `https://raw.githubusercontent.com/rolux/gtadb.org/main/maps/tiles/6/${TILESETS[style]}/{z}/{z}%2C{y}%2C{x}.jpg`;
}

// 1×1 transparent GIF for tiles that don't exist (empty ocean areas)
const EMPTY_TILE =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

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

// Prominent orange teardrop pin for every location — the category color sits in the
// inner dot, so markers stay visible on the busy detailed map and read as "a location".
function makeIcon(color: string, opacity: number) {
    return L.divIcon({
        className: "",
        html: `<div style="opacity:${opacity};filter:drop-shadow(0 2px 3px rgba(0,0,0,0.55));">
            <svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 0C5.82 0 0 5.82 0 13c0 9.2 11.1 19.4 12.4 20.6a.86.86 0 0 0 1.2 0C14.9 32.4 26 22.2 26 13 26 5.82 20.18 0 13 0z"
                      fill="#FC4100" stroke="#ffffff" stroke-width="2"/>
                <circle cx="13" cy="13" r="5" fill="${color}"/>
            </svg>
        </div>`,
        iconSize:    [26, 34],
        iconAnchor:  [13, 34],
        popupAnchor: [0, -32],
    });
}

// ----- POPUP PHOTO TABS -----

function LocationPopup({ loc }: { loc: Gta6Location }) {
    const [tab, setTab]         = useState<"ig" | "rl">("ig");
    const [imgError, setError]  = useState<{ ig: boolean; rl: boolean }>({ ig: false, rl: false });

    const color    = getCategoryColor(loc.categories);
    const category = getCategoryLabel(loc.categories);
    const photoUrl = getPhotoUrl(loc.gtadb_key, tab);
    const hasPhoto = !imgError[tab];

    const mapsUrl = loc.lat && loc.lng
        ? `https://www.google.com/maps?q=${loc.lat},${loc.lng}`
        : null;

    return (
        <div style={{ width: 260, fontFamily: "Inter, sans-serif" }}>
            {/* Photo tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #1e2530", marginBottom: 0 }}>
                {(["ig", "rl"] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                            flex: 1,
                            padding: "7px 0",
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            border: "none",
                            background: tab === t ? "#FC4100" : "#10141B",
                            color: tab === t ? "#fff" : "#71717A",
                            transition: "all 0.15s",
                        }}
                    >
                        {t === "ig" ? "In-Game" : "Real Life"}
                    </button>
                ))}
            </div>

            {/* Photo */}
            <div style={{
                width: "100%",
                height: 160,
                background: "#0B0E14",
                overflow: "hidden",
                position: "relative",
            }}>
                {hasPhoto ? (
                    <img
                        src={photoUrl}
                        alt={`${loc.name} — ${tab === "ig" ? "in-game" : "real life"}`}
                        onError={() => setError(e => ({ ...e, [tab]: true }))}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                ) : (
                    <div style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        gap: 6,
                    }}>
                        <div style={{ fontSize: 28, opacity: 0.2 }}>
                            {tab === "ig" ? "🎮" : "📍"}
                        </div>
                        <span style={{ fontSize: 11, color: "#4A4A55" }}>No photo available</span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div style={{ padding: "10px 12px 12px", background: "#0D1117" }}>
                {/* Category */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                    <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        backgroundColor: color, flexShrink: 0,
                    }} />
                    <span style={{
                        fontSize: 10, fontWeight: 700,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color: color,
                    }}>
                        {category}
                    </span>
                    {loc.is_unconfirmed && (
                        <span style={{
                            marginLeft: "auto",
                            fontSize: 10,
                            color: "#F59E0B",
                            fontWeight: 600,
                        }}>
                            ⚠ Unconfirmed
                        </span>
                    )}
                </div>

                {/* Name */}
                <p style={{
                    margin: "0 0 8px",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#FFFFFF",
                    lineHeight: 1.3,
                }}>
                    {loc.name}
                </p>

                {/* Address */}
                {loc.real_address && (
                    <p style={{
                        margin: "0 0 8px",
                        fontSize: 11,
                        color: "#71717A",
                        lineHeight: 1.5,
                    }}>
                        {loc.real_address}
                    </p>
                )}

                {/* Google Maps */}
                {mapsUrl && (
                    <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#3B82F6",
                            textDecoration: "none",
                            marginBottom: 8,
                        }}
                    >
                        View in Google Maps ↗
                    </a>
                )}

                {/* Game coords */}
                {loc.game_x != null && loc.game_y != null && (
                    <p style={{
                        margin: 0,
                        fontSize: 10,
                        color: "#3A3A45",
                        fontFamily: "monospace",
                        borderTop: "1px solid #161B22",
                        paddingTop: 8,
                        marginTop: 4,
                    }}>
                        X: {loc.game_x.toFixed(0)} · Y: {loc.game_y.toFixed(0)}
                    </p>
                )}
            </div>
        </div>
    );
}

// ----- MAP BEHAVIOUR COMPONENTS -----

function FitBoundsOnLoad() {
    const map = useMap();
    useEffect(() => {
        map.fitBounds(CONTENT_BOUNDS, { padding: [24, 24] });
    }, [map]);
    return null;
}

interface FlyToHandlerProps {
    locations: Gta6Location[];
    selectedKey: string | null | undefined;
}

function FlyToHandler({ locations, selectedKey }: FlyToHandlerProps) {
    const map = useMap();
    useEffect(() => {
        if (!selectedKey) return;
        const loc = locations.find(l => l.gtadb_key === selectedKey);
        if (!loc || loc.game_x == null || loc.game_y == null) return;
        const [lat, lng] = gameToLeaflet(loc.game_x, loc.game_y);
        map.flyTo([lat, lng], 4, { duration: 0.8 });
    }, [selectedKey, locations, map]);
    return null;
}

// Base-map style switcher (top-right overlay) — Color (dupzor,51) / Community (yanis,13)
function StyleToggle({ style, onChange }: { style: TileStyle; onChange: (s: TileStyle) => void }) {
    const opts: { key: TileStyle; label: string }[] = [
        { key: "color",     label: "Color" },
        { key: "community", label: "Community" },
    ];
    return (
        <div style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 1000,
            display: "flex",
            background: "#0B0E14",
            border: "1px solid #161B22",
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        }}>
            {opts.map(o => (
                <button
                    key={o.key}
                    onClick={() => onChange(o.key)}
                    style={{
                        padding: "6px 12px",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        border: "none",
                        cursor: "pointer",
                        background: style === o.key ? "#FC4100" : "transparent",
                        color: style === o.key ? "#fff" : "#71717A",
                        transition: "all 0.15s",
                    }}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

// ----- MAIN COMPONENT -----

interface Props {
    locations: Gta6Location[];
    selectedKey?: string | null;
}

export default function Gta6LeafletMap({ locations, selectedKey }: Props) {
    const [style, setStyle] = useState<TileStyle>("color");

    const mappable = locations.filter(
        (l): l is Gta6Location & { game_x: number; game_y: number } =>
            l.game_x != null && l.game_y != null
    );

    return (
        <MapContainer
            crs={GTA_CRS}
            center={[normalizeY(2000), normalizeX(-4000)]}
            zoom={1}
            zoomControl={false}
            minZoom={0}
            maxZoom={7}
            maxBounds={[[-50, -50], [MAP_SIZE + 50, MAP_SIZE + 50]]}
            maxBoundsViscosity={0.9}
            style={{ height: "100%", width: "100%", background: "#13384f" }}
        >
            {/* GTADB tile layer — auto-loads correct zoom level (z 0-6). Keyed so a
                style switch fully remounts the layer with the new tileset URL. */}
            <TileLayer
                key={style}
                url={tileUrl(style)}
                tileSize={256}
                minNativeZoom={0}
                maxNativeZoom={6}
                noWrap={true}
                errorTileUrl={EMPTY_TILE}
                bounds={[[0, 0], [MAP_SIZE, MAP_SIZE]]}
                attribution='Map: <a href="https://gtadb.org" target="_blank">GTADB.org</a> (CC BY 4.0)'
            />

            <FitBoundsOnLoad />
            <FlyToHandler locations={locations} selectedKey={selectedKey} />
            <ZoomControl position="bottomright" />
            <StyleToggle style={style} onChange={setStyle} />

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
                            <Popup
                                minWidth={260}
                                maxWidth={260}
                                className="gta6-popup"
                            >
                                <LocationPopup loc={loc} />
                            </Popup>
                        </Marker>
                    );
                })}
            </MarkerClusterGroup>
        </MapContainer>
    );
}
