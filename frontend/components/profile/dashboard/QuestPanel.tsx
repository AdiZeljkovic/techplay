"use client";

import useSWR from "swr";
import { Trophy } from "lucide-react";
import axios from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";

interface Quest {
  id: number;
  name: string;
  description: string;
  icon: string | null;
  type: "daily" | "weekly" | "monthly" | "permanent";
  criteria_value: number;
  xp_reward: number;
  bounty_reward: number;
  progress: number;
  completed: boolean;
  expires_at: string | null;
}

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data as Quest[]);

const TYPE_CONFIG = {
  daily: { label: "Daily", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  weekly: { label: "Weekly", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  monthly: { label: "Monthly", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  permanent: { label: "Quest", color: "text-white/40 bg-white/5 border-white/10" },
};

function QuestRow({ quest, compact }: { quest: Quest; compact?: boolean }) {
  const pct = Math.min(100, Math.round((quest.progress / quest.criteria_value) * 100));
  const cfg = TYPE_CONFIG[quest.type];

  return (
    <div
      className={`rounded-xl border p-3 transition-all ${
        quest.completed
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-[var(--border)] bg-white/[0.02]"
      }`}
    >
      <div className="flex items-start gap-3">
        {!compact && (
          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${cfg.color}`}>
            <Trophy className="w-4 h-4" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[13px] font-semibold text-white truncate">{quest.name}</p>
            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
          {!compact && <p className="text-[11px] text-white/40 mb-2">{quest.description}</p>}

          <div className={`flex items-center gap-2${compact ? " mt-1.5" : ""}`}>
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${quest.completed ? "bg-emerald-500" : "bg-[var(--accent)]"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-white/40 font-mono shrink-0">
              {quest.progress}/{quest.criteria_value}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {quest.bounty_reward > 0 && (
            <span className="text-[10px] font-bold text-amber-400">
              +{quest.bounty_reward} <span className="text-white/35">B</span>
            </span>
          )}
          {quest.xp_reward > 0 && (
            <span className="text-[10px] font-bold text-blue-400">
              +{quest.xp_reward} <span className="text-white/35">XP</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuestPanel({ isOwnProfile, compact = false }: { isOwnProfile: boolean; compact?: boolean }) {
  const { user } = useAuth();

  const { data: quests } = useSWR(
    user && isOwnProfile ? "/user/quests" : null,
    fetcher,
    { dedupingInterval: 120_000, revalidateOnFocus: false }
  );

  if (!isOwnProfile || !quests?.length) return null;

  const active = quests.filter((q) => !q.completed);
  const done = quests.filter((q) => q.completed);
  const shown = compact ? active.slice(0, 3) : [...active, ...done.slice(0, 2)];

  return (
    <div className="space-y-2">
      {shown.map((q) => (
        <QuestRow key={q.id} quest={q} compact={compact} />
      ))}
      {shown.length === 0 && (
        <p className="text-[12px] text-white/40 text-center py-3">
          All quests completed — nice work!
        </p>
      )}
    </div>
  );
}
