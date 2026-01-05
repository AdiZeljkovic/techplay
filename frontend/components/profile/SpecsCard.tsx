import { Cpu, Monitor, HardDrive, Wifi } from "lucide-react";

interface SpecsCardProps {
    specs: Record<string, string>;
}

export const SpecsCard = ({ specs }: SpecsCardProps) => {
    if (!specs || Object.keys(specs).length === 0) {
        return (
            <div className="text-[var(--text-muted)] italic text-center p-8 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
                No PC specifications listed.
            </div>
        );
    }

    const getIcon = (key: string) => {
        const k = key.toLowerCase();
        if (k.includes('cpu') || k.includes('processor')) return <Cpu className="w-5 h-5" />;
        if (k.includes('gpu') || k.includes('graphics')) return <Monitor className="w-5 h-5" />;
        if (k.includes('ram') || k.includes('memory')) return <HardDrive className="w-5 h-5" />;
        return <Wifi className="w-5 h-5" />;
    };

    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">Battlestation Setup</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(specs).map(([component, model]) => (
                    <div key={component} className="flex items-start gap-3 p-3 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]">
                        <div className="p-2 bg-[var(--bg-secondary)] rounded-md text-[var(--accent)]">
                            {getIcon(component)}
                        </div>
                        <div>
                            <p className="text-xs text-[var(--text-muted)] uppercase">{component}</p>
                            <p className="font-medium text-[var(--text-primary)]">{model}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
