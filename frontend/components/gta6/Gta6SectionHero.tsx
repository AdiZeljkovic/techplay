import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    subtitle?: string;
    breadcrumb: string;          // e.g. "Characters"
    badge?: string;              // optional kicker badge
    children?: ReactNode;        // optional extra (e.g. countdown)
}

export default function Gta6SectionHero({ icon: Icon, title, subtitle, breadcrumb, badge, children }: Props) {
    return (
        <div className="relative overflow-hidden border-b border-[#161B22] bg-[#0B0E14] gta6-grain">
            <div className="absolute inset-0 gta6-grid opacity-40" />
            <div className="absolute inset-0 gta6-sunset opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#05070A]" />

            <div className="relative max-w-[1320px] mx-auto px-4 xl:px-8 py-10 md:py-14">
                <nav className="flex items-center gap-1.5 text-[12px] text-[#71717A] mb-5">
                    <Link href="/gta6" className="hover:text-[var(--gta-pink)] transition-colors">GTA 6 Hub</Link>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="text-[#A1A1AA]">{breadcrumb}</span>
                </nav>

                {badge && (
                    <p className="text-[var(--gta-cyan)] font-bold tracking-[0.25em] text-[11px] uppercase mb-2">{badge}</p>
                )}

                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-[var(--gta-pink)]/15 border border-[var(--gta-pink)]/35 flex items-center justify-center shrink-0 gta6-glow-pink">
                        <Icon className="w-6 h-6 md:w-7 md:h-7 text-[var(--gta-pink)]" />
                    </div>
                    <div>
                        <h1 className="font-display text-[30px] md:text-[44px] font-black text-white leading-[0.95]">{title}</h1>
                        {subtitle && <p className="text-[#A1A1AA] text-[13px] md:text-[15px] mt-1.5">{subtitle}</p>}
                    </div>
                </div>

                {children && <div className="mt-8">{children}</div>}
            </div>

            <div className="gta6-accent-line absolute bottom-0 left-0 right-0" />
        </div>
    );
}
