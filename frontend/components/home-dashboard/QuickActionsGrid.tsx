"use client";

import Link from "next/link";
import { LibraryBig, List, MessageSquare, MessagesSquare, User as UserIcon, Gift, Zap } from "lucide-react";
import Panel from "@/components/ui/Panel";

const ACTIONS = [
    { label: "Library", href: "/profile/me?tab=collection", icon: LibraryBig },
    { label: "Lists", href: "/profile/me?tab=lists", icon: List },
    { label: "Messages", href: "/messages", icon: MessageSquare },
    { label: "Forum", href: "/forum", icon: MessagesSquare },
    { label: "Profile", href: "/profile/me", icon: UserIcon },
    { label: "Rewards", href: "/profile/me?tab=rewards", icon: Gift },
];

/** Action deck — six tiles that ignite on hover. */
export default function QuickActionsGrid() {
    return (
        <Panel
            title="Quick Actions"
            icon={<Zap className="w-3.5 h-3.5 text-[var(--accent)]" />}
            bodyClassName="grid grid-cols-3 gap-2 p-3"
        >
            {ACTIONS.map((a) => (
                <Link
                    key={a.label}
                    href={a.href}
                    className="group relative flex flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] bg-[var(--fill-1)] border border-[var(--line)] py-4 px-2 overflow-hidden hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:bg-[var(--fill-2)] transition-colors duration-300"
                >
                    {/* accent rail draws across the top on hover */}
                    <span
                        aria-hidden
                        className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--accent)] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-[var(--ease-hud)]"
                    />
                    {/* the icon tile fills with accent */}
                    <span className="w-9 h-9 rounded-[var(--radius-inner)] bg-[var(--fill-2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white group-hover:border-transparent group-hover:shadow-[var(--glow-accent)] transition-all duration-300">
                        <a.icon className="w-[18px] h-[18px]" />
                    </span>
                    <span className="font-display text-[10px] font-bold uppercase tracking-wider text-[var(--ink-low)] group-hover:text-[var(--ink-hi)] text-center leading-tight transition-colors duration-300">
                        {a.label}
                    </span>
                </Link>
            ))}
        </Panel>
    );
}
