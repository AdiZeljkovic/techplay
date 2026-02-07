import { Copy, Gamepad2, Zap, MessageSquare, Monitor } from "lucide-react";

interface GamertagsCardProps {
    tags: Record<string, string>;
}

const getPlatformStyle = (key: string) => {
    const k = key.toLowerCase();

    if (k.includes("steam")) return {
        icon: Gamepad2,
        bg: "from-[#1b2838] to-[#171a21]",
        accent: "#00adee",
        label: "Steam",
    };
    if (k.includes("epic")) return {
        icon: Zap,
        bg: "from-[#2a2a2a] to-[#121212]",
        accent: "#ffffff",
        label: "Epic Games",
    };
    if (k.includes("xbox")) return {
        icon: Gamepad2,
        bg: "from-[#107C10] to-[#0b580b]",
        accent: "#5dc21e",
        label: "Xbox Live",
    };
    if (k.includes("psn") || k.includes("playstation")) return {
        icon: Gamepad2,
        bg: "from-[#003791] to-[#001D4A]",
        accent: "#4a90d9",
        label: "PlayStation",
    };
    if (k.includes("discord")) return {
        icon: MessageSquare,
        bg: "from-[#5865F2] to-[#404EED]",
        accent: "#7289da",
        label: "Discord",
    };
    if (k.includes("nintendo") || k.includes("switch")) return {
        icon: Gamepad2,
        bg: "from-[#e60012] to-[#8b0000]",
        accent: "#e60012",
        label: "Nintendo",
    };
    if (k.includes("battle") || k.includes("blizzard")) return {
        icon: Gamepad2,
        bg: "from-[#148eff] to-[#004aad]",
        accent: "#00aeff",
        label: "Battle.net",
    };
    return {
        icon: Monitor,
        bg: "from-gray-800 to-gray-900",
        accent: "#94a3b8",
        label: key,
    };
};

export const GamertagsCard = ({ tags }: GamertagsCardProps) => {
    if (!tags || Object.keys(tags).length === 0) {
        return (
            <div className="p-10 text-center border border-dashed border-white/[0.06] rounded-xl text-white/30">
                No gamertags added yet.
            </div>
        );
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        const el = document.createElement("div");
        el.innerText = "Copied!";
        el.className = "fixed bottom-4 right-4 bg-[var(--accent)] text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm font-bold";
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1500);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(tags).map(([platform, id]) => {
                if (!id) return null;
                const style = getPlatformStyle(platform);
                const Icon = style.icon;

                return (
                    <div
                        key={platform}
                        className="group relative overflow-hidden rounded-xl border border-white/[0.06] transition-all duration-300 hover:scale-[1.02]"
                        style={{
                            boxShadow: `0 0 0 0 ${style.accent}00`,
                            transition: "box-shadow 0.3s, transform 0.3s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = `0 0 30px -5px ${style.accent}40, inset 0 1px 0 ${style.accent}20`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = `0 0 0 0 ${style.accent}00`;
                        }}
                    >
                        {/* Background gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${style.bg}`} />

                        {/* Glossy overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent h-1/2" />

                        {/* Background icon watermark */}
                        <div className="absolute -right-4 -bottom-4 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity">
                            <Icon className="w-28 h-28" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10 p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div
                                    className="p-3 rounded-xl shadow-lg ring-1 ring-white/10"
                                    style={{ backgroundColor: `${style.accent}20` }}
                                >
                                    <Icon className="w-6 h-6" style={{ color: style.accent }} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mb-0.5">
                                        {style.label}
                                    </span>
                                    <span className="text-white font-bold text-lg font-mono leading-tight">
                                        {id}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => copyToClipboard(id as string)}
                                className="p-2.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/40 hover:text-white transition-all border border-white/[0.06]"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
