"use client";

import useSWR from "swr";
import { Zap, Coins } from "lucide-react";
import { getApiUrl } from "@/lib/api";
import StatIcon from "@/components/home-dashboard/StatIcon";

interface Season {
  id: number;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  days_remaining: number | null;
  xp_multiplier: number;
  bounty_multiplier: number;
  cover_image: string | null;
}

interface Props {
  /** Opens the tab that carries the full season panel, if the host has one. */
  onOpen?: () => void;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? r.json().then((j) => j.data) : null));

/**
 * The season, compressed to one row of Today.
 *
 * It used to draw a lucide sparkle in a tinted square, which is the icon a
 * season gets when nobody has drawn one — and one had been drawn: the same
 * crate the full panel over on Progression stands behind, and the same object
 * the streak row beside this one already uses. Two surfaces describing the same
 * season should not disagree about what it looks like, so this one now borrows
 * the panel's whole vocabulary: the crate, the accent seam along the top, the
 * bloom out of the icon's corner, and boosts drawn as instrument bays rather
 * than two coloured words stacked in a corner.
 *
 * The name gets its own line for the same reason a name usually does — on a
 * quarter-width panel "Summer of Gaming 2026" was arriving as "Summer of
 * Gaming 20…" while a sparkle held 36 pixels beside it.
 */
export default function SeasonBanner({ onOpen }: Props) {
  const { data: season } = useSWR<Season | null>(
    `${getApiUrl()}/seasons/active`,
    fetcher,
    { dedupingInterval: 600_000, revalidateOnFocus: false }
  );

  if (!season) return null;

  // The API answers in fractional days, and this printed the float once —
  // "38.75770886099537d left" was on every dashboard. A countdown is read at a
  // glance; the decimals were never information.
  const days = season.days_remaining !== null ? Math.max(0, Math.floor(season.days_remaining)) : null;
  const ending = days !== null && days <= 7;

  const boosts = [
    season.xp_multiplier > 1 ? { icon: Zap, value: `${season.xp_multiplier}×`, unit: "XP", tint: "var(--accent-ink)" } : null,
    season.bounty_multiplier > 1 ? { icon: Coins, value: `${season.bounty_multiplier}×`, unit: "Bounty", tint: "#fbbf24" } : null,
  ].filter(Boolean) as { icon: typeof Zap; value: string; unit: string; tint: string }[];

  const Frame = onOpen ? "button" : "div";

  return (
    <Frame
      {...(onOpen ? { onClick: onOpen, type: "button" as const } : {})}
      className={`group relative w-full overflow-hidden rounded-[var(--radius-card)] border text-left transition-colors duration-300 ${
        onOpen ? "hover:border-[color-mix(in_srgb,var(--accent)_55%,transparent)]" : ""
      }`}
      style={{
        background: "var(--surface-1)",
        borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
      }}
    >
      {/* the ground: a bloom out of the crate's corner */}
      <span
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(70% 140% at 12% 0%, color-mix(in srgb, var(--accent) 17%, transparent), transparent 66%)" }}
      />

      {/* A season may ship art. Full-bleed behind the text it only made the
          name harder to read, so it washes in from the right instead and stops
          before it reaches anything that has to be legible. */}
      {season.cover_image && (
        <span
          aria-hidden
          className="absolute inset-y-0 right-0 w-1/2 pointer-events-none opacity-30 bg-cover bg-center"
          style={{
            backgroundImage: `url(${season.cover_image})`,
            maskImage: "linear-gradient(90deg, transparent, #000 85%)",
            WebkitMaskImage: "linear-gradient(90deg, transparent, #000 85%)",
          }}
        />
      )}

      {/* the accent rule along the top edge — the season's own seam, the same
          one the full panel wears */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: "linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 20%, transparent) 65%, transparent)" }}
      />

      <div className="relative z-10 flex items-start gap-3.5 p-3.5">
        <StatIcon src="/images/profile/v2-season.webp" size={46} idle="pulse" className="mt-0.5" />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-display text-[9px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
              Active season
            </span>
            {days !== null && (
              <span className="shrink-0 font-display text-[9px] font-bold uppercase tracking-[0.14em] text-white/35">
                <span
                  className="font-black tabular-nums text-[12px]"
                  style={{ color: ending ? "var(--accent-ink)" : "rgba(255,255,255,0.8)" }}
                >
                  {days}
                </span>{" "}
                {days === 1 ? "day left" : "days left"}
              </span>
            )}
          </div>

          <p className="mt-1.5 font-display text-[14.5px] font-black uppercase tracking-[-0.01em] leading-tight text-white truncate">
            {season.name}
          </p>

          {/* Boosts as instrument bays, not two coloured words: a multiplier is
              a reading, and it is drawn the way every other figure on this
              profile is drawn — a figure and its unit. */}
          {boosts.length > 0 && (
            <div
              className="mt-2.5 inline-flex items-stretch gap-px rounded-[8px] overflow-hidden"
              style={{ background: "var(--line)" }}
            >
              {boosts.map(({ icon: Icon, value, unit, tint }) => (
                <span key={unit} className="flex items-center gap-1.5 px-2.5 py-1.5" style={{ background: "var(--surface-2)" }}>
                  <Icon className="w-3 h-3 shrink-0" style={{ color: tint }} strokeWidth={1.8} />
                  <span className="font-display text-[11.5px] font-black tabular-nums leading-none" style={{ color: tint }}>
                    {value}
                  </span>
                  <span className="font-display text-[8px] font-bold uppercase tracking-[0.14em] text-white/35 leading-none">
                    {unit}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Frame>
  );
}
