import { ShoppingCart, ExternalLink } from "lucide-react";

// Retailer links — redakcija fills affiliate URLs when pre-orders open. "#" = disabled.
const RETAILERS: { name: string; href: string; note: string }[] = [
    { name: "PlayStation Store", href: "#", note: "PS5" },
    { name: "Xbox Store",        href: "#", note: "Series X|S" },
    { name: "Rockstar Store",    href: "#", note: "Official" },
];

export default function Gta6PreOrder() {
    return (
        <div className="relative rounded-2xl overflow-hidden border border-[var(--gta-pink)]/25 bg-[#0B0E14]">
            <div className="absolute inset-0 gta6-sunset opacity-40 pointer-events-none" />
            <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--gta-cyan)]/15 border border-[var(--gta-cyan)]/40 text-[var(--gta-cyan)] text-[10px] font-bold uppercase tracking-widest mb-3">
                        <ShoppingCart className="w-3 h-3" /> Pre-order
                    </div>
                    <h2 className="font-display text-[24px] md:text-[30px] font-black text-white leading-tight mb-2">
                        Secure your copy of GTA 6
                    </h2>
                    <p className="text-[#A1A1AA] text-[14px] max-w-lg">
                        Editions and pricing are revealed closer to launch. We&apos;ll surface official pre-order links here the moment they go live.
                    </p>
                </div>

                <div className="flex flex-col gap-2 w-full md:w-auto md:min-w-[260px]">
                    {RETAILERS.map(r => {
                        const disabled = r.href === "#";
                        return (
                            <a
                                key={r.name}
                                href={disabled ? undefined : r.href}
                                target={disabled ? undefined : "_blank"}
                                rel={disabled ? undefined : "noopener noreferrer sponsored"}
                                aria-disabled={disabled}
                                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-[13px] font-semibold transition-colors ${
                                    disabled
                                        ? "bg-[#05070A] border-[#161B22] text-[#71717A] cursor-not-allowed"
                                        : "bg-[var(--gta-pink)] border-transparent text-white hover:bg-[#ff1a7a] gta6-glow-pink"
                                }`}
                            >
                                <span>{r.name}</span>
                                <span className="flex items-center gap-1.5 text-[11px] opacity-80">
                                    {disabled ? "Soon" : r.note} {!disabled && <ExternalLink className="w-3 h-3" />}
                                </span>
                            </a>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
