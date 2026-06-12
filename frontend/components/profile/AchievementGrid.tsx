import { Trophy, Lock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface Achievement {
    id: number;
    name: string;
    description: string;
    points: number;
    icon_path?: string;
    is_unlocked: boolean;
    unlocked_at?: string | null;
}

interface AchievementGridProps {
    achievements: Achievement[];
}

export const AchievementGrid = ({ achievements }: AchievementGridProps) => {
    if (!achievements || achievements.length === 0) {
        return (
            <div className="p-10 text-center border border-dashed border-white/[0.06] rounded-xl text-white/30">
                No achievements found.
            </div>
        );
    }

    // Sort: Unlocked first (by date desc), then locked
    const sorted = [...achievements].sort((a, b) => {
        if (a.is_unlocked && !b.is_unlocked) return -1;
        if (!a.is_unlocked && b.is_unlocked) return 1;
        if (a.is_unlocked && b.is_unlocked) {
            return new Date(b.unlocked_at || "").getTime() - new Date(a.unlocked_at || "").getTime();
        }
        return a.id - b.id;
    });

    const unlockedCount = achievements.filter((a) => a.is_unlocked).length;
    const totalXP = achievements.filter((a) => a.is_unlocked).reduce((sum, a) => sum + a.points, 0);
    const unlockProgress = (unlockedCount / achievements.length) * 100;

    return (
        <div className="space-y-6">
            {/* === SCORE HEADER === */}
            <div className="glow-card rounded-2xl bg-[var(--bg-card)] border border-white/[0.06] p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    {/* Total score */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
                            <Trophy className="w-8 h-8 text-[var(--accent)]" />
                        </div>
                        <div>
                            <div className="text-3xl md:text-4xl font-black text-white tabular-nums">
                                {totalXP.toLocaleString()}
                            </div>
                            <div className="text-xs uppercase tracking-[0.15em] text-white/40 font-semibold">
                                Achievement Score
                            </div>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-white/60">
                                {unlockedCount} of {achievements.length} unlocked
                            </span>
                            <span className="text-sm font-mono font-bold text-[var(--accent)]">
                                {Math.round(unlockProgress)}%
                            </span>
                        </div>
                        <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/[0.06]">
                            <div
                                className="h-full bg-gradient-to-r from-[var(--accent)] to-[#FF7A3D] rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(252,65,0,0.4)]"
                                style={{ width: `${unlockProgress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* === ACHIEVEMENT CARDS (Xbox-style horizontal) === */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sorted.map((achievement) => (
                    <div
                        key={achievement.id}
                        className={`group relative flex items-center gap-4 rounded-xl border p-4 transition-all overflow-hidden ${
                            achievement.is_unlocked
                                ? "glow-card bg-[var(--bg-card)] border-white/[0.06] hover:border-[var(--accent)]/30"
                                : "bg-[var(--bg-secondary)]/60 border-white/[0.03] opacity-60"
                        }`}
                    >
                        {/* Icon */}
                        <div
                            className={`relative flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                                achievement.is_unlocked
                                    ? "bg-[var(--accent)]/10"
                                    : "bg-white/[0.03]"
                            }`}
                        >
                            {achievement.icon_path ? (
                                <img
                                    src={achievement.icon_path}
                                    alt={achievement.name}
                                    className={`w-8 h-8 object-contain ${!achievement.is_unlocked ? "grayscale opacity-40" : ""}`}
                                />
                            ) : (
                                <Trophy className={`w-7 h-7 ${achievement.is_unlocked ? "text-[var(--accent)]" : "text-white/20"}`} />
                            )}

                            {!achievement.is_unlocked && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                                    <Lock className="w-5 h-5 text-white/40" />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h4 className={`font-bold text-sm truncate ${achievement.is_unlocked ? "text-white" : "text-white/40"}`}>
                                    {achievement.name}
                                </h4>
                                {achievement.is_unlocked && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                )}
                            </div>
                            <p className={`text-xs line-clamp-1 ${achievement.is_unlocked ? "text-white/50" : "text-white/20"}`}>
                                {achievement.is_unlocked ? achievement.description : "???"}
                            </p>
                        </div>

                        {/* Points + Date */}
                        <div className="flex-shrink-0 text-right">
                            <div className={`text-sm font-mono font-black ${achievement.is_unlocked ? "text-[var(--accent)]" : "text-white/20"}`}>
                                +{achievement.points}
                            </div>
                            {achievement.is_unlocked && achievement.unlocked_at && (
                                <div className="text-[10px] text-white/30 mt-0.5">
                                    {format(new Date(achievement.unlocked_at), "MMM d")}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
