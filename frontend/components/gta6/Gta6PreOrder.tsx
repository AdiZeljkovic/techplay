import Image from "next/image";
import { ShoppingCart } from "lucide-react";

// Retailer links — redakcija fills affiliate URLs when pre-orders open. "#" = disabled.
const PLATFORMS: { name: string; note: string; href: string; icon: string }[] = [
    { name: "PlayStation 5",   note: "", href: "https://www.playstation.com/en-us/games/grand-theft-auto-vi/", icon: "ps" },
    { name: "Xbox Series X|S", note: "", href: "https://www.xbox.com/en-US/games/grand-theft-auto-vi",        icon: "xbox" },
    { name: "PC",              note: "Coming Soon", href: "#", icon: "pc" },
];

function PlatformIcon({ kind }: { kind: string }) {
    if (kind === "ps") {
        return (
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M8.98 2.6v16.9l3.02 1V6.27c0-.62.28-1.04.72-.9.58.13.7.7.7 1.32v5.3c1.88.9 3.36-.01 3.36-2.42 0-2.47-.87-3.57-3.44-4.45-1.01-.34-2.86-.91-4.36-1.52zM14.3 17.1l4.85-1.73c.55-.2.64-.48.19-.63-.45-.15-1.26-.11-1.82.09l-3.22 1.14v-1.82l.19-.06s.95-.34 2.29-.48c1.33-.15 2.97.02 4.26.5 1.45.5 1.61 1.24 1.24 1.75-.37.51-1.28.87-1.28.87l-6.9 2.48v-1.58zM3.5 16.95c-1.49-.42-1.74-1.3-1.06-1.81.63-.47 1.7-.82 1.7-.82l4.42-1.57v1.79l-3.18 1.14c-.56.2-.65.48-.19.63.45.15 1.26.11 1.82-.09l1.55-.56v1.6l-.31.05c-1.53.25-3.16.14-4.75-.31z"/></svg>
        );
    }
    if (kind === "xbox") {
        return (
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2a10 10 0 0 1 6.5 2.4C16.7 6 14 8.9 12 11.2 10 8.9 7.3 6 5.5 4.4A10 10 0 0 1 12 2zM3.5 6.3C5.8 8 9 11.5 10.8 13.7 8.4 16.6 5 20.4 3.9 18.6A10 10 0 0 1 3.5 6.3zm17 0a10 10 0 0 1-.4 12.3c-1.1 1.8-4.5-2-6.9-4.9C15 11.5 18.2 8 20.5 6.3zM12 14.3c1.9 2.3 4.6 5.6 5.7 7.1A10 10 0 0 1 6.3 21.4c1.1-1.5 3.8-4.8 5.7-7.1z"/></svg>
        );
    }
    return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M3 4h18a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-7v2h3v2H6v-2h3v-2H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm1 2v9h16V6H4z"/></svg>
    );
}

export default function Gta6PreOrder() {
    return (
        <div id="preorder" className="relative rounded-[var(--radius-panel)] overflow-hidden border border-[var(--gta-pink)]/25 bg-[var(--surface-1)] scroll-mt-24">
            <Image src="/gta6/preorder.webp" alt="" fill sizes="(max-width:1320px) 100vw, 1320px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface-0)]/90 via-[var(--surface-0)]/55 to-[var(--surface-0)]/30" />
            <div className="relative p-6 md:p-8 flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--gta-cyan)]/15 border border-[var(--gta-cyan)]/40 text-[var(--gta-cyan)] text-[10px] font-bold uppercase tracking-widest mb-3">
                        <ShoppingCart className="w-3 h-3" /> Pre-order
                    </div>
                    <h2 className="font-display text-[24px] md:text-[30px] font-black text-white leading-tight mb-1.5">
                        Secure your copy of GTA 6
                    </h2>
                    <p className="text-white/45 text-[14px]">Pre-order now and be ready for Vice City.</p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                    {PLATFORMS.map(p => {
                        const disabled = p.href === "#";
                        return (
                            <a
                                key={p.name}
                                href={disabled ? undefined : p.href}
                                target={disabled ? undefined : "_blank"}
                                rel={disabled ? undefined : "noopener noreferrer sponsored"}
                                aria-disabled={disabled}
                                className={`inline-flex items-center gap-2.5 px-4 py-3 rounded-[var(--radius-card)] border text-[13px] font-bold transition-colors ${
                                    disabled
                                        ? "bg-[var(--surface-0)]/70 border-white/[0.07] text-white/45 cursor-default"
                                        : "bg-white text-[var(--surface-0)] border-transparent hover:bg-[var(--gta-pink)] hover:text-white"
                                }`}
                            >
                                <PlatformIcon kind={p.icon} />
                                {p.name}
                                {p.note && <span className="text-[10px] font-semibold text-white/50 uppercase">{p.note}</span>}
                            </a>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
