"use client";

// Loaded via dynamic({ ssr: false }) only — Leaflet DOM access is safe here
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { useEffect, useState } from "react";
import { getCategoryColor, getCategoryLabel, getPhotoUrl } from "./gta6Utils";
import type { Gta6Location } from "@/types";

// GTA VI game world bounds (from GTADB maps.js)
const MIN_X = -16000, MAX_X = 4000;
const MIN_Y = -8000,  MAX_Y = 12000;
const GAME_W = MAX_X - MIN_X; // 20000
const GAME_H = MAX_Y - MIN_Y; // 20000

// MAP_SIZE = 3 × tileSize (256) = 768 — at Leaflet zoom 0, exactly 3×3 GTADB tiles fit
const MAP_SIZE = 768;

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
    return (gameX - MIN_X) / GAME_W * MAP_SIZE;
}
function normalizeY(gameY: number): number {
    return (gameY - MIN_Y) / GAME_H * MAP_SIZE;
}
function gameToLeaflet(gameX: number, gameY: number): [number, number] {
    return [normalizeY(gameY), normalizeX(gameX)]; // [lat, lng]
}

// Vice City bounds in normalized coords (game X[-5000,2000], Y[-1000,3500])
const VICE_CITY_BOUNDS: [[number, number], [number, number]] = [
    [normalizeY(-1000), normalizeX(-5000)],
    [normalizeY(3500),  normalizeX(2000)],
];

// GTADB yanis,13 tile URL — {z} appears twice (directory + filename prefix)
// At Leaflet zoom z with tileSize=256 and MAP_SIZE=768: 3×2^z tiles per row = GTADB zoom z ✓
const TILE_URL =
    "https://raw.githubusercontent.com/rolux/gtadb.org/main/maps/tiles/6/yanis%2C13/{z}/{z}%2C{y}%2C{x}.jpg";

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

function makeIcon(color: string, opacity: number) {
    return L.divIcon({
        className: "",
        html: `<div style="
            width:10px;height:10px;border-radius:50%;
            background:${color};
            border:2px solid rgba(255,255,255,0.35);
            opacity:${opacity};
            box-shadow:0 0 6px ${color}99;
        "></div>`,
        iconSize:    [10, 10],
        iconAnchor:  [5, 5],
        popupAnchor: [0, -10],
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
        map.fitBounds(VICE_CITY_BOUNDS, { padding: [20, 20] });
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

// ----- MAIN COMPONENT -----

interface Props {
    locations: Gta6Location[];
    selectedKey?: string | null;
}

export default function Gta6LeafletMap({ locations, selectedKey }: Props) {
    const mappable = locations.filter(
        (l): l is Gta6Location & { game_x: number; game_y: number } =>
            l.game_x != null && l.game_y != null
    );

    return (
        <MapContainer
            crs={GTA_CRS}
            center={[normalizeY(1000), normalizeX(-2000)]}
            zoom={1}
            zoomControl={false}
            minZoom={-2}
            maxZoom={6}
            maxBounds={[[-40, -40], [MAP_SIZE + 40, MAP_SIZE + 40]]}
            maxBoundsViscosity={0.8}
            style={{ height: "100%", width: "100%", background: "#05070A" }}
        >
            {/* GTADB yanis,13 tile layer — auto-loads correct zoom level */}
            <TileLayer
                url={TILE_URL}
                tileSize={256}
                minNativeZoom={0}
                maxNativeZoom={3}
                noWrap={true}
                errorTileUrl={EMPTY_TILE}
                bounds={[[0, 0], [MAP_SIZE, MAP_SIZE]]}
                attribution='Map: <a href="https://gtadb.org" target="_blank">GTADB.org</a> (CC BY 4.0)'
            />

            <FitBoundsOnLoad />
            <FlyToHandler locations={locations} selectedKey={selectedKey} />
            <ZoomControl position="bottomright" />

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
