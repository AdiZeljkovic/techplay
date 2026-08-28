import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { drawableCovers, drawableImage } from "@/lib/ogCovers";

export const runtime = "edge";

// Prefer the private origin (bypasses Cloudflare Bot Fight Mode for
// server-side fetches), falling back to the public API URL.
const API = (process.env.NEXT_PRIVATE_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.techplay.gg/api/v1").replace(/\/$/, "");

const ACCENT = "#DC143C";

export async function GET(req: NextRequest) {
    const username = req.nextUrl.searchParams.get("username") ?? "player";

    let displayName = username;
    let handle = username;
    let rank = "Member";
    let level = 1;
    let gamesCount = 0;
    let achievementsCount = 0;
    let percentile: number | null = null;
    let reputationScore = 0;
    let avatarUrl: string | null = null;
    let covers: string[] = [];

    try {
        const res = await fetch(`${API}/users/${encodeURIComponent(username)}`, { next: { revalidate: 300 } });

        // No such account, no card. This route used to paint a full 1200×630
        // for any string handed to it, so a crawler could mint an image per
        // guess — expensive, and it made a page that does not exist look like
        // one that does.
        if (res.status === 404) {
            return new Response("Not found", { status: 404 });
        }

        if (res.ok) {
            const json = await res.json();
            const u = json.user ?? {};
            const s = json.stats ?? {};
            displayName = u.display_name || u.username || username;
            handle = u.username ?? username;
            rank = u.rank?.name ?? "Member";
            level = s.level ?? 1;
            gamesCount = s.games_count ?? 0;
            achievementsCount = s.achievements_count ?? 0;
            percentile = json.reputation?.percentile ?? null;
            reputationScore = json.reputation?.reputation ?? s.reputation ?? 0;
            // Same rule as the covers: an avatar Satori cannot decode draws
            // an empty circle, and no avatar draws the initial instead.
            avatarUrl = drawableImage(u.avatar_url);

            // Pinned showcase first, then playing — the games that define this gamer
            covers = drawableCovers(
                [...(json.showcase ?? []), ...(json.playing_now ?? [])]
                    .map((g: any) => g?.cover_url)
                    .filter((src: unknown, i: number, arr: unknown[]) => arr.indexOf(src) === i),
                3,
            );
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
                    fontFamily: "sans-serif",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Accent glow */}
                <div style={{
                    position: "absolute",
                    top: -140,
                    left: -140,
                    width: 560,
                    height: 560,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(220, 20, 60,0.16) 0%, transparent 70%)",
                    display: "flex",
                }} />
                {/* Accent top bar */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: ACCENT, display: "flex" }} />

                {/* Left: identity */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, padding: "56px 24px 56px 64px", gap: 28 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                width={140}
                                height={140}
                                style={{ borderRadius: "50%", border: `4px solid ${ACCENT}`, objectFit: "cover" }}
                            />
                        ) : (
                            <div style={{
                                width: 140,
                                height: 140,
                                borderRadius: "50%",
                                background: "rgba(220, 20, 60,0.15)",
                                border: `4px solid ${ACCENT}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 56,
                                color: ACCENT,
                                fontWeight: 900,
                            }}>
                                {(displayName[0] ?? "?").toUpperCase()}
                            </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ color: "#ffffff", fontSize: 52, fontWeight: 900, letterSpacing: -1, display: "flex", lineHeight: 1 }}>
                                {displayName}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <div style={{
                                    display: "flex",
                                    padding: "5px 14px",
                                    borderRadius: 8,
                                    background: ACCENT,
                                    color: "#fff",
                                    fontSize: 20,
                                    fontWeight: 900,
                                }}>
                                    LVL {level}
                                </div>
                                <div style={{
                                    color: ACCENT,
                                    fontSize: 20,
                                    fontWeight: 700,
                                    letterSpacing: 3,
                                    textTransform: "uppercase",
                                    display: "flex",
                                }}>
                                    {rank}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: "flex", gap: 14 }}>
                        {[
                            { label: "GAMES", value: gamesCount.toLocaleString() },
                            { label: "ACHIEVEMENTS", value: achievementsCount.toLocaleString() },
                            { label: "REPUTATION", value: percentile ? `TOP ${percentile}%` : reputationScore.toLocaleString() },
                        ].map((s) => (
                            <div key={s.label} style={{
                                display: "flex",
                                flexDirection: "column",
                                padding: "16px 24px",
                                background: "#0B0E14",
                                border: "1px solid #161B22",
                                borderRadius: 14,
                                gap: 4,
                            }}>
                                <div style={{ color: "#ffffff", fontSize: 30, fontWeight: 900, display: "flex" }}>{s.value}</div>
                                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 700, letterSpacing: 2, display: "flex" }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Brand + URL */}
                    <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 6 }}>
                        <div style={{ color: ACCENT, fontSize: 22, fontWeight: 900, letterSpacing: 2, display: "flex" }}>
                            TECHPLAY.GG
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 17, display: "flex" }}>
                            techplay.gg/profile/{handle}
                        </div>
                    </div>
                </div>

                {/* Right: showcased game covers */}
                {covers.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 64px 0 12px" }}>
                        {covers.map((src, i) => (
                            <img
                                key={i}
                                src={src}
                                width={covers.length === 1 ? 260 : 170}
                                height={covers.length === 1 ? 360 : 240}
                                style={{
                                    objectFit: "cover",
                                    borderRadius: 16,
                                    border: "2px solid #161B22",
                                    transform: `translateY(${i % 2 === 0 ? -14 : 14}px) rotate(${(i - 1) * 3}deg)`,
                                    boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        ),
        {
            width: 1200,
            height: 630,
            headers: {
                "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
            },
        }
    );
}
