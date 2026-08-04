import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getApiUrl } from "@/lib/api";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username") ?? "";
  const year = searchParams.get("year") ?? new Date().getFullYear().toString();

  // Only the handful of fields the card draws — enough shape to be safe
  // without restating the whole wrapped payload here.
  interface CardData {
    display_name?: string;
    avatar_url?: string;
    archetype?: { name?: string };
    dna?: { genres?: { name: string }[] };
    stats?: { key: string; value: number }[];
  }

  let data: CardData = {};
  try {
    const res = await fetch(`${getApiUrl()}/users/${username}/wrapped/${year}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      data = json.data ?? {};
    }
  } catch {}

  // The wrapped payload now reports stats as a labelled list with
  // year-over-year context, so the card reads them by key.
  const stat = (key: string) => (data.stats ?? []).find((s) => s.key === key)?.value ?? 0;

  const displayName = data.display_name ?? username;
  const gamerType = data.archetype?.name ?? "Gamer";
  const totalHours = stat("hours");
  const gamesCompleted = stat("games_completed");
  const achievements = stat("achievements");
  const topGenre = data.dna?.genres?.[0]?.name ?? "";
  const avatarUrl = data.avatar_url;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "linear-gradient(135deg, #070A0F 0%, #0D1420 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(252,65,0,0.18) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 0,
            zIndex: 1,
          }}
        >
          {/* Badge */}
          <div
            style={{
              background: "rgba(252,65,0,0.15)",
              border: "1px solid rgba(252,65,0,0.3)",
              borderRadius: 999,
              padding: "6px 20px",
              color: "#FC4100",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            Gaming Wrapped {year}
          </div>

          {/* Avatar */}
          {avatarUrl && (
            <img
              src={avatarUrl}
              width={100}
              height={100}
              style={{
                borderRadius: "50%",
                border: "3px solid #FC4100",
                marginBottom: 16,
              }}
            />
          )}

          {/* Name */}
          <div
            style={{
              fontSize: 60,
              fontWeight: 900,
              color: "#FFFFFF",
              lineHeight: 1.1,
              marginBottom: 8,
            }}
          >
            {displayName}
          </div>

          {/* Type */}
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#FC4100",
              marginBottom: 32,
            }}
          >
            {gamerType}
            {topGenre ? ` · ${topGenre}` : ""}
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 40 }}>
            {[
              { value: `${totalHours}h`, label: "PLAYED" },
              { value: gamesCompleted, label: "COMPLETED" },
              { value: achievements, label: "ACHIEVEMENTS" },
            ].map(({ value, label }) => (
              <div
                key={label}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
              >
                <span style={{ fontSize: 42, fontWeight: 900, color: "#FFFFFF" }}>
                  {value}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#71717A",
                    letterSpacing: 3,
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 36,
              fontSize: 14,
              fontWeight: 700,
              color: "rgba(255,255,255,0.3)",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            TECHPLAY.GG
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
