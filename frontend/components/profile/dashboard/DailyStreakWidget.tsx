"use client";

import { useState } from "react";
import useSWR from "swr";
import { Flame, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/api";
import toast from "react-hot-toast";

interface StreakInfo {
  streak: number;
  claimed_today: boolean;
  last_claim: string | null;
  next_bounty: number;
}

const fetcher = ([url, token]: [string, string]) =>
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.json())
    .then((j) => j.data as StreakInfo);

export default function DailyStreakWidget() {
  const { user, token } = useAuth();
  const [claiming, setClaiming] = useState(false);

  const { data: streak, mutate } = useSWR(
    user && token ? [`${getApiUrl()}/user/streak`, token] : null,
    fetcher,
    { dedupingInterval: 60_000 }
  );

  if (!user || !streak) return null;

  const handleClaim = async () => {
    if (claiming || streak.claimed_today) return;
    setClaiming(true);
    try {
      const res = await fetch(`${getApiUrl()}/user/streak/claim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message ?? `Day ${data.data?.streak} streak!`);
        mutate();
      }
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
      className={`rounded-2xl border p-4 flex items-center gap-4 transition-all ${
        claimed
          ? "border-orange-500/20 bg-orange-500/5"
          : "border-white/10 bg-white/[0.03] hover:border-orange-500/30"
      }`}
    >
      {/* Flame + count */}
      <div className="relative shrink-0">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            claimed ? "bg-orange-500/20" : "bg-white/5"
          }`}
        >
          <Flame
            className={`w-6 h-6 ${claimed ? "text-orange-400" : "text-zinc-500"}`}
          />
        </div>
        {days > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">
            {days > 99 ? "99+" : days}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white">
          {days > 0 ? `${days}-day streak` : "Start your streak"}
        </p>
        <p className="text-xs text-zinc-500">
          {claimed
            ? "Come back tomorrow"
            : `Claim +${streak.next_bounty} bounty`}
        </p>
      </div>

      <button
        onClick={handleClaim}
        disabled={claimed || claiming}
        className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
          claimed
            ? "bg-orange-500/10 text-orange-400 cursor-default"
            : claiming
            ? "bg-white/5 text-zinc-500"
            : "bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.97]"
        }`}
      >
        {claimed ? (
          <>
            <Check className="w-3.5 h-3.5" />
            Claimed
          </>
        ) : claiming ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            <Flame className="w-3.5 h-3.5" />
            Claim
          </>
        )}
      </button>
    </div>
  );
}
