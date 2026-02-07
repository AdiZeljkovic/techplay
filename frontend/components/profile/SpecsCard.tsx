import { Cpu, Monitor, HardDrive, Wifi, MemoryStick, Headphones, Mouse, Keyboard, Tv } from "lucide-react";

interface SpecsCardProps {
    specs: Record<string, string>;
}

const getSpecConfig = (key: string) => {
    const k = key.toLowerCase();

    // Core components
    if (k.includes("cpu") || k.includes("processor")) return { icon: Cpu, color: "#3b82f6", category: "core" };
    if (k.includes("gpu") || k.includes("graphics") || k.includes("video")) return { icon: Monitor, color: "#8b5cf6", category: "core" };
    if (k.includes("ram") || k.includes("memory")) return { icon: MemoryStick, color: "#06b6d4", category: "core" };
    if (k.includes("storage") || k.includes("ssd") || k.includes("hdd") || k.includes("drive")) return { icon: HardDrive, color: "#f59e0b", category: "core" };
    if (k.includes("motherboard") || k.includes("mobo")) return { icon: Cpu, color: "#10b981", category: "core" };
    if (k.includes("psu") || k.includes("power")) return { icon: Wifi, color: "#ef4444", category: "core" };
    if (k.includes("case") || k.includes("chassis")) return { icon: Tv, color: "#64748b", category: "core" };

    // Peripherals
    if (k.includes("monitor") || k.includes("display") || k.includes("screen")) return { icon: Tv, color: "#a855f7", category: "peripherals" };
    if (k.includes("keyboard") || k.includes("kb")) return { icon: Keyboard, color: "#ec4899", category: "peripherals" };
    if (k.includes("mouse")) return { icon: Mouse, color: "#f97316", category: "peripherals" };
    if (k.includes("headset") || k.includes("headphone") || k.includes("audio")) return { icon: Headphones, color: "#14b8a6", category: "peripherals" };

    return { icon: Cpu, color: "#94a3b8", category: "core" };
};

export const SpecsCard = ({ specs }: SpecsCardProps) => {
    if (!specs || Object.keys(specs).length === 0) {
        return (
            <div className="p-10 text-center border border-dashed border-white/[0.06] rounded-xl text-white/30">
                No PC specifications listed.
            </div>
        );
    }

    const entries = Object.entries(specs);
    const coreSpecs = entries.filter(([key]) => getSpecConfig(key).category === "core");
    const peripheralSpecs = entries.filter(([key]) => getSpecConfig(key).category === "peripherals");

    // If categorization doesn't work well, show all together
    const hasBothCategories = coreSpecs.length > 0 && peripheralSpecs.length > 0;

    const renderSpec = ([component, model]: [string, string]) => {
        const config = getSpecConfig(component);
        const Icon = config.icon;

        return (
            <div
                key={component}
                className="group glow-card flex items-center gap-4 rounded-xl bg-[var(--bg-card)] border border-white/[0.06] p-4 hover:border-white/10 transition-all"
            >
                {/* Colored accent bar on left */}
                <div
                    className="w-1 self-stretch rounded-full flex-shrink-0"
                    style={{ backgroundColor: config.color }}
                />

                {/* Icon circle */}
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${config.color}15` }}
                >
                    <Icon className="w-6 h-6" style={{ color: config.color }} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-semibold mb-0.5">
                        {component}
                    </p>
                    <p className="font-bold text-white text-sm truncate">
                        {model}
                    </p>
                </div>
            </div>
        );
    };

    if (!hasBothCategories) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {entries.map(renderSpec)}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Core Components */}
            <div>
                <h3 className="profile-section-header text-white mb-4">
                    <Cpu className="w-5 h-5 text-blue-400" />
                    Core Components
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {coreSpecs.map(renderSpec)}
                </div>
            </div>

            {/* Peripherals */}
            <div>
                <h3 className="profile-section-header text-white mb-4">
                    <Headphones className="w-5 h-5 text-purple-400" />
                    Peripherals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {peripheralSpecs.map(renderSpec)}
                </div>
            </div>
        </div>
    );
};
