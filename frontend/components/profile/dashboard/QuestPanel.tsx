"use client";

import useSWR from "swr";
import { Trophy } from "lucide-react";
import axios from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import Meter from "@/components/ui/Meter";

interface Quest {
  id: number;
  name: string;
  description: string;
  icon: string | null;
  type: "daily" | "weekly" | "monthly" | "permanent";
  is_seasonal?: boolean;
  criteria_value: number;
  xp_reward: number;
  bounty_reward: number;
  progress: number;
  completed: boolean;
  expires_at: string | null;
}

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data as Quest[]);

/** How soon a quest of this kind comes round again — the urgency order. */
const CADENCE: Record<Quest["type"], number> = { daily: 0, weekly: 1, monthly: 2, permanent: 3 };

const TYPE_CONFIG = {
  daily: { label: "Daily", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  weekly: { label: "Weekly", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  monthly: { label: "Monthly", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  permanent: { label: "Quest", color: "text-[var(--ink-low)] bg-[var(--fill-2)] border-[var(--line)]" },
};

function QuestRow({ quest, compact }: { quest: Quest; compact?: boolean }) {
  const cfg = TYPE_CONFIG[quest.type];

  return (
    <div
      className={`rounded-[var(--radius-card)] border p-3 transition-colors duration-300 ${
        quest.completed
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-[var(--line)] bg-[var(--fill-1)]"
      }`}
    >
      <div className="flex items-start gap-3">
        {!compact && (
          <div className={`w-9 h-9 rounded-[var(--radius-inner)] border flex items-center justify-center shrink-0 ${cfg.color}`}>
            <Trophy className="w-4 h-4" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[13px] font-semibold text-[var(--ink-hi)] truncate">{quest.name}</p>
            {quest.is_seasonal ? (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/25">
                Season
              </span>
            ) : (
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${cfg.color}`}>
                {cfg.label}
              </span>
            )}
          </div>
          {!compact && <p className="text-[11px] text-[var(--ink-low)] mb-2">{quest.description}</p>}

          {/* "Complete 3 games — 0/3" drawn as a smooth bar makes the
              reader go and find the numbers. Three empty segments say it in
              the shape. */}
          <Meter
            value={quest.progress}
            max={quest.criteria_value}
            size="sm"
            showCount
            tone={quest.completed ? "#34d399" : undefined}
            className={compact ? "mt-1.5" : ""}
          />
        </div>

        {/* The pay, as two chips rather than two numbers floating in a
            corner. Blue XP against amber bounty was also the only place on
            the profile where XP was not the house crimson. */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {quest.xp_reward > 0 && (
            <span className="inline-flex items-center gap-1 h-[19px] px-1.5 rounded-[4px] font-display text-[10px] font-black tabular-nums"
              style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent-ink)" }}>
              +{quest.xp_reward}<span className="text-white/30">XP</span>
            </span>
          )}
          {quest.bounty_reward > 0 && (
            <span className="inline-flex items-center gap-1 h-[19px] px-1.5 rounded-[4px] bg-amber-400/12 font-display text-[10px] font-black tabular-nums text-amber-400">
              +{quest.bounty_reward}<span className="text-white/30">B</span>
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

  // Shortest cadence first, then nearest deadline within it.
  //
  // Sorting on expires_at alone put every season quest above every daily one,
  // because a daily carries no expiry date at all — it resets on the date it
  // was completed, so the column is null and null sorted last. The Today panel
  // shows three quests, and all three were season quests with 38 days on them
  // while the two that reset tonight sat below the fold.
  const active = [...quests.filter((q) => !q.completed)].sort((a, b) => {
    const cadence = CADENCE[a.type] - CADENCE[b.type];
    if (cadence !== 0) return cadence;
    if (!a.expires_at) return 1;
    if (!b.expires_at) return -1;
    return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
  });
  const done = quests.filter((q) => q.completed);
  const shown = compact ? active.slice(0, 3) : [...active, ...done.slice(0, 2)];

  return (
    <div className="space-y-2">
      {shown.map((q) => (
        <QuestRow key={q.id} quest={q} compact={compact} />
      ))}
      {shown.length === 0 && (
        <p className="text-[12px] text-[var(--ink-low)] text-center py-3">
          All quests completed — nice work!
        </p>
      )}
    </div>
  );
}
