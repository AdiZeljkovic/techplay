"use client";

import { useState } from "react";
import useSWR from "swr";
import { Flame, Check, Loader2 } from "lucide-react";
import axios from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

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
      <div className="relative shrink-0">
        <div className={`w-11 h-11 rounded-[var(--radius-inner)] flex items-center justify-center ${claimed ? "bg-[var(--accent-soft)]" : "bg-[var(--fill-2)]"}`}>
          <Flame className={`w-5 h-5 ${claimed ? "text-[var(--accent)]" : "text-[var(--ink-faint)]"}`} />
        </div>
        {days > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--accent)] text-white text-[10px] font-black tabular-nums flex items-center justify-center">
            {days > 99 ? "99+" : days}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-display text-[13px] font-bold text-[var(--ink-hi)]">
          {days > 0 ? `${days}-day streak` : "Start your streak"}
        </p>
        <p className="text-[11px] text-[var(--ink-low)]">
          {claimed ? "Come back tomorrow" : `Claim +${streak.next_bounty} bounty`}
        </p>
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
