import { Copy, Gamepad2, Zap, MessageSquare, Monitor } from "lucide-react";
import { Button } from "../ui/Button";

interface GamertagsCardProps {
    tags: Record<string, string>;
}

// Helper for icons/colors
const getPlatformStyle = (key: string) => {
    const k = key.toLowerCase();

    if (k.includes('steam')) return {
        icon: Gamepad2, // Ideally Steam Icon
        bg: 'bg-[#171a21]',
        gradient: 'from-[#171a21] to-[#1b2838]',
        border: 'border-[#1b2838]',
        iconBg: 'bg-[#00adee]/20',
        text: 'text-[#00adee]',
        subtext: 'text-[#66c0f4]',
        label: 'Steam'
    };

    if (k.includes('epic')) return {
        icon: Zap,
        bg: 'bg-[#2a2a2a]',
        gradient: 'from-[#2a2a2a] to-[#121212]',
        border: 'border-white/10',
        iconBg: 'bg-white/20',
        text: 'text-white',
        subtext: 'text-gray-400',
        label: 'Epic Games'
    };

    if (k.includes('xbox')) return {
        icon: Gamepad2,
        bg: 'bg-[#107C10]',
        gradient: 'from-[#107C10] to-[#0b580b]',
        border: 'border-[#0b580b]',
        iconBg: 'bg-black/20',
        text: 'text-white',
        subtext: 'text-green-200',
        label: 'Xbox Live'
    };

    if (k.includes('psn') || k.includes('playstation')) return {
        icon: Gamepad2,
        bg: 'bg-[#003791]',
        gradient: 'from-[#003791] to-[#001D4A]',
        border: 'border-[#002868]',
        iconBg: 'bg-white/20',
        text: 'text-white',
        subtext: 'text-blue-300',
        label: 'PlayStation'
    };

    if (k.includes('discord')) return {
        icon: MessageSquare,
        bg: 'bg-[#5865F2]',
        gradient: 'from-[#5865F2] to-[#404EED]',
        border: 'border-[#4752c4]',
        iconBg: 'bg-white/20',
        text: 'text-white',
        subtext: 'text-indigo-200',
        label: 'Discord'
    };

    // Default
    return {
        icon: Monitor,
        bg: 'bg-[var(--bg-elevated)]',
        gradient: 'from-gray-800 to-gray-900',
        border: 'border-[var(--border)]',
        iconBg: 'bg-white/5',
        text: 'text-gray-400',
        subtext: 'text-gray-500',
        label: key
    };
};

export const GamertagsCard = ({ tags }: GamertagsCardProps) => {
    if (!tags || Object.keys(tags).length === 0) {
        return (
            <div className="text-[var(--text-muted)] italic text-center p-8 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
                No gamertags added yet.
            </div>
        );
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Toast would be better, but alert is fine for now
        const el = document.createElement('div');
        el.innerText = 'Copied!';
        el.className = 'fixed bottom-4 right-4 bg-[var(--accent)] text-black px-4 py-2 rounded shadow-lg z-50 animate-bounce';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2000);
    };

    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-[var(--accent)]" />
                Gaming IDs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(tags).map(([platform, id]) => {
                    if (!id) return null;
                    const style = getPlatformStyle(platform);
                    const Icon = style.icon;

                    return (
                        <div
                            key={platform}
                            className={`relative group overflow-hidden rounded-xl p-4 border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${style.border} ${style.bg}`}
                        >
                            {/* Background Gradient/Mesh effect */}
                            <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${style.gradient}`} />
                            <div className="absolute -right-6 -bottom-6 opacity-10 rotate-12 transition-transform group-hover:rotate-0 group-hover:scale-110">
                                <Icon className="w-24 h-24" />
                            </div>

                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-lg ${style.iconBg} shadow-lg ring-1 ring-white/10`}>
                                        <Icon className={`w-6 h-6 ${style.text}`} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${style.subtext}`}>
                                            {style.label}
                                        </span>
                                        <span className="text-white font-bold tracking-wide text-lg text-shadow-sm font-mono leading-none py-1">
                                            {id}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(id as string)}
                                    className="text-white/50 hover:text-white hover:bg-white/10 shrink-0"
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
