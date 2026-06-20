"use client";

import useSWR from "swr";
import { Flame, Star, Trophy, Swords, BookOpen, Gamepad2, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/api";

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

const fetcher = ([url, token]: [string, string]) =>
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.json())
    .then((j) => j.data as Quest[]);

const TYPE_CONFIG = {
  daily: { label: "Daily", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  weekly: { label: "Weekly", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  monthly: { label: "Monthly", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  permanent: { label: "Quest", color: "text-zinc-400 bg-white/5 border-white/10" },
};

function QuestRow({ quest }: { quest: Quest }) {
  const pct = Math.min(100, Math.round((quest.progress / quest.criteria_value) * 100));
  const cfg = TYPE_CONFIG[quest.type];

  return (
    <div
      className={`rounded-xl border p-3 transition-all ${
        quest.completed
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-white/[0.06] bg-white/[0.02]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${cfg.color}`}
        >
          <Trophy className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-white truncate">{quest.name}</p>
            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mb-2">{quest.description}</p>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${quest.completed ? "bg-emerald-500" : "bg-tp-accent"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono shrink-0">
              {quest.progress}/{quest.criteria_value}
            </span>
          </div>
        </div>

        {/* Rewards */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {quest.bounty_reward > 0 && (
            <span className="text-[10px] font-bold text-yellow-400">
              +{quest.bounty_reward} <span className="text-zinc-500">B</span>
            </span>
          )}
          {quest.xp_reward > 0 && (
            <span className="text-[10px] font-bold text-blue-400">
              +{quest.xp_reward} <span className="text-zinc-500">XP</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuestPanel({ isOwnProfile }: { isOwnProfile: boolean }) {
  const { user, token } = useAuth();

  const { data: quests } = useSWR(
    user && token && isOwnProfile
      ? [`${getApiUrl()}/user/quests`, token]
      : null,
    fetcher,
    { dedupingInterval: 120_000, revalidateOnFocus: false }
  );

  if (!isOwnProfile || !quests?.length) return null;

  const active = quests.filter((q) => !q.completed);
  const done = quests.filter((q) => q.completed);

  return (
    <div className="space-y-2">
      {active.map((q) => (
        <QuestRow key={q.id} quest={q} />
      ))}
      {done.slice(0, 2).map((q) => (
        <QuestRow key={q.id} quest={q} />
      ))}
      {quests.length === 0 && (
        <p className="text-sm text-zinc-500 text-center py-4">
          No active quests right now.
        </p>
      )}
    </div>
  );
}
