"use client";

// Loaded via dynamic({ ssr: false }) only — Leaflet DOM access is safe here
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { useEffect, useState, useRef } from "react";
import { Plus, Minus, Maximize2, Search, SlidersHorizontal, Expand } from "lucide-react";
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

// GTADB clean colored base map (dupzor,51) — {z} appears twice (directory + filename
// prefix), {y}/{x} are tile indices. No baked-in legend, matches gtadb.net.
const TILE_URL =
    "https://raw.githubusercontent.com/rolux/gtadb.org/main/maps/tiles/6/dupzor%2C51/{z}/{z}%2C{y}%2C{x}.jpg";

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
            background:#FF2E88;
            border:3px solid rgba(255,46,136,0.3);
            color:#fff;font-weight:700;font-size:${fs}px;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 0 16px rgba(255,46,136,0.5),0 2px 8px rgba(0,0,0,0.5);
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
                      fill="#FF2E88" stroke="#ffffff" stroke-width="2"/>
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
                            background: tab === t ? "#FF2E88" : "#10141B",
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

type Bounds = [[number, number], [number, number]];

function FitBoundsOnLoad({ bounds }: { bounds: Bounds }) {
    const map = useMap();
    useEffect(() => {
        map.fitBounds(bounds, { padding: [20, 20] });
        // Lock zoom-out: can't go below the full-island view (hides poster frame)
        const z = map.getBoundsZoom(bounds);
        map.setMinZoom(Math.floor(z));
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

// Wheel zoom only after the user interacts with the map — so scrolling the page
// over the map scrolls the page, while clicking the map enables wheel zoom.
function ScrollZoomGate() {
    const map = useMap();
    useEffect(() => {
        map.scrollWheelZoom.disable();
        const enable  = () => map.scrollWheelZoom.enable();
        const disable = () => map.scrollWheelZoom.disable();
        map.on("focus", enable);
        map.on("click", enable);
        map.on("mouseout", disable);
        map.on("blur", disable);
        return () => {
            map.off("focus", enable);
            map.off("click", enable);
            map.off("mouseout", disable);
            map.off("blur", disable);
        };
    }, [map]);
    return null;
}

// Left vertical control rail (zoom / reset / search / filters / fullscreen)
function MapToolbar({ onOpenPanel, resetBounds }: { onOpenPanel?: (tab: "search" | "filters") => void; resetBounds: Bounds }) {
    const map = useMap();

    const toggleFullscreen = () => {
        const el = map.getContainer();
        if (!document.fullscreenElement) el.requestFullscreen?.();
        else document.exitFullscreen?.();
    };

    const Btn = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
        <button
            onClick={onClick}
            title={title}
            aria-label={title}
            className="w-10 h-10 flex items-center justify-center text-[#A1A1AA] hover:text-white hover:bg-[var(--gta-pink)]/20 transition-colors"
        >
            {children}
        </button>
    );

    return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-[800] flex flex-col rounded-xl bg-[#0B0E14]/90 backdrop-blur border border-[#161B22] shadow-xl overflow-hidden divide-y divide-[#161B22]">
            <Btn onClick={() => map.zoomIn()} title="Zoom in"><Plus className="w-[18px] h-[18px]" /></Btn>
            <Btn onClick={() => map.zoomOut()} title="Zoom out"><Minus className="w-[18px] h-[18px]" /></Btn>
            <Btn onClick={() => map.flyToBounds(resetBounds, { padding: [20, 20], duration: 0.6 })} title="Reset view"><Maximize2 className="w-4 h-4" /></Btn>
            {onOpenPanel && <Btn onClick={() => onOpenPanel("search")} title="Search locations"><Search className="w-4 h-4" /></Btn>}
            {onOpenPanel && <Btn onClick={() => onOpenPanel("filters")} title="Filters & list"><SlidersHorizontal className="w-4 h-4" /></Btn>}
            <Btn onClick={toggleFullscreen} title="Fullscreen"><Expand className="w-4 h-4" /></Btn>
        </div>
    );
}

// Live game X/Y readout (desktop) — writes directly to a ref to avoid re-renders
function CoordinateHud() {
    const ref = useRef<HTMLSpanElement>(null);
    useMapEvents({
        mousemove(e) {
            if (!ref.current) return;
            const gx = Math.round(e.latlng.lng * (MAP_FULL / MAP_SIZE) - ZERO);
            const gy = Math.round(e.latlng.lat * (MAP_FULL / MAP_SIZE) - ZERO);
            ref.current.textContent = `X: ${gx} · Y: ${gy}`;
        },
    });
    return (
        <div className="absolute bottom-3 left-3 z-[800] hidden md:block px-3 py-1.5 rounded-lg bg-[#0B0E14]/90 backdrop-blur border border-[#161B22] text-[11px] font-mono text-[var(--gta-cyan)] shadow-lg pointer-events-none">
            <span ref={ref}>X: — · Y: —</span>
        </div>
    );
}

// ----- MAIN COMPONENT -----

interface Props {
    locations: Gta6Location[];
    selectedKey?: string | null;
    onOpenPanel?: (tab: "search" | "filters") => void;
}

export default function Gta6LeafletMap({ locations, selectedKey, onOpenPanel }: Props) {
    const mappable = locations.filter(
        (l): l is Gta6Location & { game_x: number; game_y: number } =>
            l.game_x != null && l.game_y != null
    );

    // Island content bounds derived from the markers themselves (the poster legend
    // and credits are baked art, not markers, so they fall outside this box).
    // Frozen on first non-empty dataset so category filtering doesn't shrink the map.
    // Outliers (bad coords far in the ocean) are rejected via a generous envelope so
    // they can't blow the box up to the full poster.
    // Padding (game units). Extra to the north so the landmass above the northernmost
    // markers (Mount Kalaga) isn't clipped, while still excluding the poster title band.
    const PAD = 1500, PAD_N = 3000;
    const ENV = { minX: -14000, maxX: 6000, minY: -10000, maxY: 14000 };
    const boundsRef = useRef<Bounds | null>(null);
    if (!boundsRef.current && mappable.length > 0) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const l of mappable) {
            if (l.game_x < ENV.minX || l.game_x > ENV.maxX || l.game_y < ENV.minY || l.game_y > ENV.maxY) continue;
            if (l.game_x < minX) minX = l.game_x;
            if (l.game_x > maxX) maxX = l.game_x;
            if (l.game_y < minY) minY = l.game_y;
            if (l.game_y > maxY) maxY = l.game_y;
        }
        if (minX !== Infinity) {
            boundsRef.current = [
                [normalizeY(minY - PAD),   normalizeX(minX - PAD)],
                [normalizeY(maxY + PAD_N), normalizeX(maxX + PAD)],
            ];
        }
    }
    const islandBounds: Bounds = boundsRef.current ?? CONTENT_BOUNDS;

    // Slightly looser pan limit than the visible island so dragging feels natural
    const panBounds: Bounds = [
        [islandBounds[0][0] - 30, islandBounds[0][1] - 30],
        [islandBounds[1][0] + 30, islandBounds[1][1] + 30],
    ];

    // Force tile pruning to the island: the `bounds` prop alone doesn't reliably set
    // GridLayer.options.bounds in react-leaflet 5, so set it on the layer + redraw.
    const tileRef = useRef<L.TileLayer | null>(null);
    useEffect(() => {
        const tl = tileRef.current;
        if (!tl) return;
        tl.options.bounds = L.latLngBounds(islandBounds);
        tl.redraw();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [islandBounds[0][0], islandBounds[0][1], islandBounds[1][0], islandBounds[1][1]]);

    return (
        <MapContainer
            crs={GTA_CRS}
            center={[(islandBounds[0][0] + islandBounds[1][0]) / 2, (islandBounds[0][1] + islandBounds[1][1]) / 2]}
            zoom={2}
            zoomControl={false}
            scrollWheelZoom={false}
            minZoom={0}
            maxZoom={7}
            maxBounds={panBounds}
            maxBoundsViscosity={1}
            style={{ height: "100%", width: "100%", background: "transparent" }}
        >
            {/* GTADB tile layer — auto-loads correct zoom level (z 0-6) */}
            <TileLayer
                ref={tileRef}
                url={TILE_URL}
                tileSize={256}
                minNativeZoom={0}
                maxNativeZoom={6}
                noWrap={true}
                errorTileUrl={EMPTY_TILE}
                bounds={islandBounds}
                attribution='Map: <a href="https://gtadb.org" target="_blank">GTADB.org</a> (CC BY 4.0)'
            />

            <FitBoundsOnLoad bounds={islandBounds} />
            <FlyToHandler locations={locations} selectedKey={selectedKey} />
            <ScrollZoomGate />
            <MapToolbar onOpenPanel={onOpenPanel} resetBounds={islandBounds} />
            <CoordinateHud />

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
