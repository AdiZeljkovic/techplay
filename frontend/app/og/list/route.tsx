import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { drawableCovers } from "@/lib/ogCovers";

export const runtime = "edge";

// Prefer the private origin (bypasses Cloudflare Bot Fight Mode for
// server-side fetches), falling back to the public API URL.
const API = (process.env.NEXT_PRIVATE_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api-beta.techplay.gg/api/v1").replace(/\/$/, "");

/** The board's own gradient, hot at the top — same scale as TierBoard. */
const TIER_TONE: Record<string, string> = {
    S: "#E8536F", A: "#E2894A", B: "#D4AC42",
    C: "#6DB566", D: "#5C9BC9", F: "#9A93A3",
};

const ACCENT = "#DC143C";

/**
 * The share card for a game list.
 *
 * The list page used to hand a social network the first cover in the list — a
 * game's key art, with nothing on it to say whose list it was or what it
 * argued. A list is somebody's opinion arranged in an order; the card should
 * show the arrangement and sign it.
 */
export async function GET(req: NextRequest) {
    const username = req.nextUrl.searchParams.get("username") ?? "";
    const slug = req.nextUrl.searchParams.get("slug") ?? "";

    if (!username || !slug) {
        return new Response("Missing username or slug", { status: 400 });
    }

    let name = "Game list";
    let owner = username;
    let count = 0;
    let covers: string[] = [];
    let listType = "";
    /** For a tier list the arrangement is the whole point, so the card draws the board. */
    let board: { tier: string; covers: string[] }[] = [];

    try {
        const res = await fetch(
            `${API}/users/${encodeURIComponent(username)}/lists/${encodeURIComponent(slug)}`,
            { next: { revalidate: 300 } },
        );

        // A list that does not exist gets no card, rather than a handsome
        // frame around a guess.
        if (res.status === 404) {
            return new Response("Not found", { status: 404 });
        }

        if (res.ok) {
            const list = (await res.json())?.data ?? {};
            name = list.name || name;
            owner = list.user?.display_name || list.user?.username || username;
            count = list.items_count ?? list.items?.length ?? 0;
            listType = list.list_type ?? "";

            type Row = { tier?: string | null; position?: number; game?: { cover_url?: string } };
            const rows: Row[] = list.items ?? [];

            covers = drawableCovers(rows.map((i) => i?.game?.cover_url), 5);

            if (listType === "tier") {
                board = ["S", "A", "B", "C", "D", "F"].map((tier) => ({
                    tier,
                    covers: drawableCovers(
                        rows
                            .filter((r) => r.tier === tier)
                            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                            .map((r) => r.game?.cover_url),
                        9,
                    ),
                }));
            }
        }
    } catch {
        // A card with the name and the byline still beats no card at all.
    }

    return new ImageResponse(
        (
            <div
                style={{
                    width: 1200,
                    height: 630,
                    display: "flex",
                    flexDirection: "column",
                    background: "linear-gradient(135deg, #020816 0%, #0B0E14 60%, #141A26 100%)",
                    padding: 64,
                    position: "relative",
                }}
            >
                {/* A tier list's card is the board.
                    It used to be the same row of covers every list gets, which
                    shows what is in the list and hides the only thing a tier
                    list is: where each game landed. The letters and the S→F
                    gradient are what makes it readable in a Discord preview. */}
                {listType === "tier" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, height: 300 }}>
                        {board.map((row) => (
                            <div key={row.tier} style={{ display: "flex", height: 46 }}>
                                <div
                                    style={{
                                        display: "flex",
                                        width: 56,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background: TIER_TONE[row.tier],
                                        borderRadius: "6px 0 0 6px",
                                        color: "#12070A",
                                        fontSize: 26,
                                        fontWeight: 900,
                                    }}
                                >
                                    {row.tier}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        flex: 1,
                                        gap: 4,
                                        padding: 4,
                                        background: "rgba(255,255,255,0.035)",
                                        borderRadius: "0 6px 6px 0",
                                        alignItems: "center",
                                        overflow: "hidden",
                                    }}
                                >
                                    {row.covers.map((src, i) => (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            key={i}
                                            src={src}
                                            alt=""
                                            width={28}
                                            height={38}
                                            style={{ objectFit: "cover", borderRadius: 3, width: 28, height: 38 }}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                <div style={{ display: "flex", gap: 18, height: 300 }}>
                    {covers.length > 0
                        ? covers.map((src, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    width: 202,
                                    height: 300,
                                    borderRadius: 12,
                                    overflow: "hidden",
                                    border: `2px solid ${i === 0 ? ACCENT : "rgba(255,255,255,0.10)"}`,
                                    position: "relative",
                                }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={src} alt="" width={202} height={300} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                                <div
                                    style={{
                                        position: "absolute",
                                        left: 10,
                                        top: 10,
                                        width: 38,
                                        height: 38,
                                        borderRadius: 8,
                                        background: i === 0 ? ACCENT : "rgba(2,8,22,0.85)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 21,
                                        fontWeight: 900,
                                        color: "#fff",
                                    }}
                                >
                                    {i + 1}
                                </div>
                            </div>
                        ))
                        : (
                            <div style={{ display: "flex", width: "100%", height: 300, borderRadius: 12, border: "2px solid rgba(255,255,255,0.12)" }} />
                        )}
                </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
                    {/* Every child here is an element. Satori — the renderer
                        behind ImageResponse — cannot lay out a bare text node
                        sitting beside element siblings in a flex row, and it
                        fails by throwing mid-stream, which reaches the reader
                        as a 502 rather than a broken image. */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 20, letterSpacing: 4, color: ACCENT, fontWeight: 700 }}>
                        <div style={{ display: "flex" }}>GAME LIST</div>
                        <div style={{ display: "flex", width: 6, height: 6, borderRadius: 3, background: ACCENT }} />
                        <div style={{ display: "flex", color: "rgba(255,255,255,0.45)", letterSpacing: 2 }}>{count} {count === 1 ? "GAME" : "GAMES"}</div>
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

                    <div style={{ display: "flex", marginTop: 16, fontSize: 26, color: "rgba(255,255,255,0.5)" }}>
                        {`by ${owner} · techplay.gg`}
                    </div>
                </div>
            </div>
        ),
        { width: 1200, height: 630 },
    );
}
