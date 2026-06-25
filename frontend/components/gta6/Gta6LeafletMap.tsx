"use client";

// Loaded via dynamic({ ssr: false }) only — leaflet DOM access is safe here
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import { divIcon } from "leaflet";
import { getCategoryColor, getCategoryLabel } from "./gta6Utils";
import type { Gta6Location } from "@/types";

const TILES_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILES_ATTR =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com">CARTO</a>';

const MAP_CENTER: [number, number] = [25.774, -80.19];
const MAP_ZOOM = 12;

function makeIcon(color: string, opacity: number) {
    return divIcon({
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

interface Props {
    locations: Gta6Location[];
}

export default function Gta6LeafletMap({ locations }: Props) {
    return (
        <MapContainer
            center={MAP_CENTER}
            zoom={MAP_ZOOM}
            zoomControl={false}
            style={{ height: "100%", width: "100%", background: "#05070A" }}
        >
            <TileLayer url={TILES_URL} attribution={TILES_ATTR} />
            <ZoomControl position="bottomright" />

            {locations.map(loc => {
                const color   = getCategoryColor(loc.categories);
                const opacity = loc.is_unconfirmed ? 0.45 : 1;
                const icon    = makeIcon(color, opacity);

                return (
                    <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={icon}>
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
                                    <p style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3, margin: 0 }}>{loc.name}</p>
                                </div>
                                <p style={{ fontSize: 11, opacity: 0.7, margin: "4px 0" }}>
                                    <strong>Category:</strong> {getCategoryLabel(loc.categories)}
                                </p>
                                {loc.is_unconfirmed && (
                                    <p style={{ fontSize: 11, color: "#F59E0B", margin: "2px 0" }}>⚠ Unconfirmed location</p>
                                )}
                                {loc.real_address && (
                                    <p style={{ fontSize: 10, opacity: 0.5, marginTop: 4, lineHeight: 1.4 }}>{loc.real_address}</p>
                                )}
                                {loc.game_x !== undefined && loc.game_y !== undefined && (
                                    <p style={{ fontSize: 10, opacity: 0.4, marginTop: 4, fontFamily: "monospace" }}>
                                        {loc.game_x?.toFixed(1)}, {loc.game_y?.toFixed(1)}
                                    </p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
