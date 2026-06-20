"use client";

import useSWR from "swr";
import Link from "next/link";
import { Clock, Sparkles } from "lucide-react";
import { getApiUrl } from "@/lib/api";

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

const fetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? r.json().then((j) => j.data) : null));

export default function SeasonBanner() {
  const { data: season } = useSWR<Season | null>(
    `${getApiUrl()}/seasons/active`,
    fetcher,
    { dedupingInterval: 600_000, revalidateOnFocus: false }
  );

  if (!season) return null;

  const hasMultiplier = season.xp_multiplier > 1 || season.bounty_multiplier > 1;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-tp-accent/20 bg-gradient-to-r from-tp-accent/10 to-transparent px-5 py-4 flex items-center gap-4"
      style={season.cover_image ? { backgroundImage: `url(${season.cover_image})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
    >
      {season.cover_image && <div className="absolute inset-0 bg-black/60" />}

      <div className="relative z-10 flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-tp-accent/20 border border-tp-accent/30 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-tp-accent" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-tp-accent uppercase tracking-wider mb-0.5">
            Active Season
          </p>
          <p className="text-sm font-black text-white truncate">{season.name}</p>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-3 shrink-0">
        {hasMultiplier && (
          <div className="hidden sm:flex flex-col items-end">
            {season.xp_multiplier > 1 && (
              <span className="text-[11px] font-bold text-blue-400">
                {season.xp_multiplier}× XP
              </span>
            )}
            {season.bounty_multiplier > 1 && (
              <span className="text-[11px] font-bold text-yellow-400">
                {season.bounty_multiplier}× Bounty
              </span>
            )}
          </div>
        )}
        {season.days_remaining !== null && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/30 border border-white/10">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs font-bold text-white">{season.days_remaining}d left</span>
          </div>
        )}
      </div>
    </div>
  );
}
