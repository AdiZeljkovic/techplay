import { Trophy, Lock } from "lucide-react";
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
            <div className="text-[var(--text-muted)] italic text-center p-8 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
                No achievements found.
            </div>
        );
    }

    // Sort: Unlocked first (by date desc), then locked
    const sorted = [...achievements].sort((a, b) => {
        if (a.is_unlocked && !b.is_unlocked) return -1;
        if (!a.is_unlocked && b.is_unlocked) return 1;

        if (a.is_unlocked && b.is_unlocked) {
            // Both unlocked, sort by recency
            return new Date(b.unlocked_at || '').getTime() - new Date(a.unlocked_at || '').getTime();
        }

        // Both locked, sort by ID or other criteria
        return a.id - b.id;
    });

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sorted.map((achievement) => (
                <div
                    key={achievement.id}
                    className={`relative group border rounded-xl p-4 flex flex-col items-center text-center transition-all overflow-hidden
                        ${achievement.is_unlocked
                            ? 'bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--accent)] hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]'
                            : 'bg-[var(--bg-elevated)] border-transparent opacity-60 grayscale hover:grayscale-0 hover:opacity-80'
                        }
                    `}
                >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110 relative
                        ${achievement.is_unlocked ? 'bg-[var(--bg-secondary)] text-[var(--accent)]' : 'bg-[var(--bg-primary)] text-[var(--text-muted)]'}
                    `}>
                        {achievement.icon_path ? (
                            <img src={achievement.icon_path} alt={achievement.name} className="w-10 h-10 object-contain" />
                        ) : (
                            <Trophy className="w-8 h-8" />
                        )}

                        {!achievement.is_unlocked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                                <Lock className="w-6 h-6 text-white/80" />
                            </div>
                        )}
                    </div>

                    <h4 className={`font-bold text-sm mb-1 ${achievement.is_unlocked ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                        {achievement.name}
                    </h4>

                    <p className="text-xs text-[var(--text-muted)] mb-3 line-clamp-2">
                        {achievement.description}
                    </p>

                    <div className="mt-auto flex flex-col items-center gap-1 w-full">
                        <span className={`text-xs px-2 py-1 rounded font-mono font-bold w-full
                            ${achievement.is_unlocked
                                ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                                : 'bg-[var(--bg-primary)] text-[var(--text-muted)]'
                            }
                        `}>
                            {achievement.points} XP
                        </span>

                        {achievement.is_unlocked && achievement.unlocked_at && (
                            <span className="text-[10px] text-[var(--text-muted)] mt-1">
                                {format(new Date(achievement.unlocked_at), 'MMM d, yyyy')}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
