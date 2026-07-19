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
      className={`rounded-xl border p-3.5 flex items-center gap-3.5 transition-all ${
        claimed
          ? "border-[var(--accent)]/20 bg-[var(--accent)]/[0.04]"
          : "border-[var(--border)] bg-white/[0.02] hover:border-[var(--accent)]/30"
      }`}
    >
      <div className="relative shrink-0">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${claimed ? "bg-[var(--accent)]/15" : "bg-white/5"}`}>
          <Flame className={`w-5 h-5 ${claimed ? "text-[var(--accent)]" : "text-white/35"}`} />
        </div>
        {days > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--accent)] text-white text-[10px] font-black flex items-center justify-center">
            {days > 99 ? "99+" : days}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-white">
          {days > 0 ? `${days}-day streak` : "Start your streak"}
        </p>
        <p className="text-[11px] text-white/40">
          {claimed ? "Come back tomorrow" : `Claim +${streak.next_bounty} bounty`}
        </p>
      </div>

      <button
        onClick={handleClaim}
        disabled={claimed || claiming}
        className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
          claimed
            ? "bg-[var(--accent)]/10 text-[var(--accent)] cursor-default"
            : claiming
            ? "bg-white/5 text-white/40"
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
