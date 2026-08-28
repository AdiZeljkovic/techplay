import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { drawableCovers } from "@/lib/ogCovers";

export const runtime = "edge";

// Prefer the private origin (bypasses Cloudflare Bot Fight Mode for
// server-side fetches), falling back to the public API URL.
const API = (process.env.NEXT_PRIVATE_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api-beta.techplay.gg/api/v1").replace(/\/$/, "");

const ACCENT = "#DC143C";

/**
 * The share card for a studio.
 *
 * The studio page handed social networks the IGDB logo — a `t_logo_med` PNG on
 * somebody else's CDN, usually a transparent wordmark a few hundred pixels
 * wide. Platforms letterbox it onto whatever background they use, so the one
 * thing 31,970 studio pages posted with was a small floating logo that said
 * nothing about the studio and nothing about where it came from.
 *
 * This says who they are and what they made: the name, when and where they
 * started, how many games are in the catalogue under them, and five covers
 * from it.
 */
export async function GET(req: NextRequest) {
    const slug = req.nextUrl.searchParams.get("slug") ?? "";

    if (!slug) {
        return new Response("Missing slug", { status: 400 });
    }

    let name = "Game studio";
    let founded = "";
    let country = "";
    let games = 0;
    let developed = 0;
    let published = 0;
    let covers: string[] = [];

    try {
        const res = await fetch(`${API}/studios/${encodeURIComponent(slug)}`, {
            next: { revalidate: 3600 },
        });

        // A studio that does not exist gets no card, rather than a handsome
        // frame around a guess. Same rule as /og/list.
        if (res.status === 404) {
            return new Response("Not found", { status: 404 });
        }

        if (res.ok) {
            const studio = (await res.json())?.data ?? {};

            name = studio.name || name;
            founded = studio.founded ? String(studio.founded).slice(0, 4) : "";
            country = studio.country?.name ?? "";
            games = studio.games_count ?? 0;
            developed = studio.developed_count ?? 0;
            published = studio.published_count ?? 0;

            type Row = { cover_url?: string | null };

            // Games they made come before games they only shipped: the covers
            // should be the studio's own work where there is any.
            const rows: Row[] = [...(studio.developed ?? []), ...(studio.published ?? [])];

            covers = drawableCovers(rows.map((g) => g?.cover_url), 5);
        }
    } catch {
        // A card with the name still beats no card at all.
    }

    /*
     * The line under the name, assembled from what we actually hold.
     *
     * Every part is optional — a studio with no founding date and no country
     * is common in this catalogue — so the separators are joined rather than
     * written between fixed fields, and an empty line renders nothing instead
     * of a row of stray middots.
     */
    const facts = [
        founded ? `Founded ${founded}` : "",
        country,
        games > 0 ? `${games.toLocaleString("en-US")} ${games === 1 ? "game" : "games"}` : "",
    ].filter(Boolean);

    const split = developed > 0 && published > 0
        ? `${developed.toLocaleString("en-US")} developed · ${published.toLocaleString("en-US")} published`
        : "";

    return new ImageResponse(
        (
            <div
                style={{
                    width: 1200,
                    height: 630,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    background: "linear-gradient(135deg, #020816 0%, #0B0E14 60%, #141A26 100%)",
                    padding: 64,
                }}
            >
                <div style={{ display: "flex", flexDirection: "column" }}>
                    {/* Every child is an element, never a bare text node beside
                        one: Satori cannot lay out a loose string sitting next to
                        element siblings in a flex row, and it fails by throwing
                        mid-stream — which reaches the reader as a 502 rather
                        than a broken image. See /og/list. */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 20, letterSpacing: 4, color: ACCENT, fontWeight: 700 }}>
                        <div style={{ display: "flex" }}>GAME STUDIO</div>
                        {facts.length > 0 && (
                            <div style={{ display: "flex", width: 6, height: 6, borderRadius: 3, background: ACCENT }} />
                        )}
                        <div style={{ display: "flex", color: "rgba(255,255,255,0.45)", letterSpacing: 2 }}>
                            {facts.join(" · ").toUpperCase()}
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            marginTop: 14,
                            fontSize: name.length > 34 ? 54 : 68,
                            fontWeight: 900,
                            color: "#fff",
                            lineHeight: 1.05,
                        }}
                    >
                        {name.length > 62 ? `${name.slice(0, 59)}…` : name}
                    </div>

                    {split && (
                        <div style={{ display: "flex", marginTop: 16, fontSize: 26, color: "rgba(255,255,255,0.5)" }}>
                            {split}
                        </div>
                    )}
                </div>

                {covers.length > 0 && (
                    <div style={{ display: "flex", gap: 18, height: 300 }}>
                        {covers.map((src, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    width: 202,
                                    height: 300,
                                    borderRadius: 12,
                                    overflow: "hidden",
                                    border: `2px solid ${i === 0 ? ACCENT : "rgba(255,255,255,0.10)"}`,
                                }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={src} alt="" width={202} height={300} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: "flex", fontSize: 26, color: "rgba(255,255,255,0.5)" }}>
                    {"techplay.gg"}
                </div>
            </div>
        ),
        { width: 1200, height: 630 },
    );
}
