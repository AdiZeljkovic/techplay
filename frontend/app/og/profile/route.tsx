import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://api.techplay.gg/api/v1";

export async function GET(req: NextRequest) {
    const username = req.nextUrl.searchParams.get("username") ?? "player";

    let displayName = username;
    let rank = "Member";
    let xp = 0;
    let gamesCount = 0;
    let achievementsCount = 0;
    let avatarUrl: string | null = null;

    try {
        const res = await fetch(`${API}/users/${username}`, { next: { revalidate: 300 } });
        if (res.ok) {
            const json = await res.json();
            const u = json.user ?? {};
            const s = json.stats ?? {};
            displayName = u.display_name || u.username || username;
            rank = u.rank?.name ?? "Member";
            xp = s.xp ?? 0;
            gamesCount = s.games_count ?? 0;
            achievementsCount = s.achievements_count ?? 0;
            avatarUrl = u.avatar_url ?? null;
        }
    } catch {
        // Fallback to username-only card
    }

    return new ImageResponse(
        (
            <div
                style={{
                    width: 1200,
                    height: 630,
                    background: "linear-gradient(135deg, #020816 0%, #0B0E14 60%, #141A26 100%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "sans-serif",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Accent glow */}
                <div style={{
                    position: "absolute",
                    top: -100,
                    left: -100,
                    width: 500,
                    height: 500,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(252,65,0,0.15) 0%, transparent 70%)",
                    display: "flex",
                }} />

                {/* TechPlay logo text */}
                <div style={{
                    position: "absolute",
                    top: 36,
                    left: 48,
                    color: "#FC4100",
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: 2,
                    display: "flex",
                }}>
                    TECHPLAY.GG
                </div>

                {/* Avatar */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            width={120}
                            height={120}
                            style={{ borderRadius: "50%", border: "3px solid #FC4100", objectFit: "cover" }}
                        />
                    ) : (
                        <div style={{
                            width: 120,
                            height: 120,
                            borderRadius: "50%",
                            background: "rgba(252,65,0,0.15)",
                            border: "3px solid #FC4100",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 48,
                            color: "#FC4100",
                            fontWeight: 900,
                        }}>
                            {(displayName[0] ?? "?").toUpperCase()}
                        </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <div style={{ color: "#ffffff", fontSize: 48, fontWeight: 900, letterSpacing: -1, display: "flex" }}>
                            {displayName}
                        </div>
                        <div style={{
                            color: "#FC4100",
                            fontSize: 18,
                            fontWeight: 700,
                            letterSpacing: 3,
                            textTransform: "uppercase",
                            display: "flex",
                        }}>
                            {rank}
                        </div>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: "flex", gap: 40, marginTop: 12 }}>
                        {[
                            { label: "XP", value: xp.toLocaleString() },
                            { label: "GAMES", value: gamesCount.toString() },
                            { label: "ACHIEVEMENTS", value: achievementsCount.toString() },
                        ].map((s) => (
                            <div key={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                <div style={{ color: "#ffffff", fontSize: 32, fontWeight: 900, display: "flex" }}>{s.value}</div>
                                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 700, letterSpacing: 2, display: "flex" }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom tagline */}
                <div style={{
                    position: "absolute",
                    bottom: 32,
                    color: "rgba(255,255,255,0.25)",
                    fontSize: 14,
                    display: "flex",
                }}>
                    Your whole gaming life, in one place.
                </div>
            </div>
        ),
        { width: 1200, height: 630 }
    );
}
