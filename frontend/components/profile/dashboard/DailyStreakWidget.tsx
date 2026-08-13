"use client";

import { useState } from "react";
import useSWR from "swr";
import { Flame, Check, Loader2 } from "lucide-react";
import axios from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import Readout from "@/components/ui/Readout";

interface StreakInfo {
  streak: number;
  claimed_today: boolean;
  last_claim: string | null;
  next_bounty: number;
}

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data as StreakInfo);

export default function DailyStreakWidget() {
  const { user } = useAuth();
  const [claiming, setClaiming] = useState(false);

  const { data: streak, mutate } = useSWR(
    user ? "/user/streak" : null,
    fetcher,
    { dedupingInterval: 60_000 }
  );

  if (!user || !streak) return null;

  const handleClaim = async () => {
    if (claiming || streak.claimed_today) return;
    setClaiming(true);
    try {
      const res = await axios.post("/user/streak/claim");
      toast.success(res.data?.message ?? `Day ${res.data?.data?.streak} streak!`);
      mutate();
    } catch {
      toast.error("Failed to claim streak");
    } finally {
      setClaiming(false);
    }
  };

  const days = streak.streak;
  const claimed = streak.claimed_today;

  return (
    <div
      className={`rounded-[var(--radius-card)] border p-3.5 flex items-center gap-3.5 transition-colors duration-300 ${
        claimed
          ? "border-[color-mix(in_srgb,var(--accent)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent)_4%,transparent)]"
          : "border-[var(--line)] bg-[var(--fill-1)] hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)]"
      }`}
    >
      {/* The flame is the state: lit while the streak is alive, dark when it
          is not. The badge counting days on top of an icon that already said
          "streak" was saying it twice. */}
      <div className="shrink-0 w-11 h-11 rounded-[var(--radius-inner)] flex items-center justify-center"
        style={{ background: days > 0 ? "var(--accent-soft)" : "var(--fill-2)" }}>
        <Flame className="w-5 h-5" style={{ color: days > 0 ? "var(--accent)" : "var(--ink-faint)" }} />
      </div>

      <div className="flex-1 min-w-0">
        <Readout
          label={claimed ? "Streak · back tomorrow" : `Streak · +${streak.next_bounty} waiting`}
          value={days}
          unit={days === 1 ? "day" : "days"}
          size="sm"
          tone={days > 0 ? "var(--accent-ink)" : undefined}
        />
      </div>

      <button
        onClick={handleClaim}
        disabled={claimed || claiming}
        className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-card)] font-display text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 ${
          claimed
            ? "bg-[var(--accent-soft)] text-[var(--accent)] cursor-default"
            : claiming
            ? "bg-[var(--fill-2)] text-[var(--ink-low)]"
            : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-[0.97]"
        }`}
      >
        {claimed ? (
          <><Check className="w-3.5 h-3.5" /> Claimed</>
        ) : claiming ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <><Flame className="w-3.5 h-3.5" /> Claim</>
        )}
      </button>
    </div>
  );
}
