"use client";

import Link from "next/link";
import { LibraryBig, List, MessageSquare, MessagesSquare, User as UserIcon, Gift, Zap } from "lucide-react";
import SectionCard from "@/components/profile/dashboard/SectionCard";

const ACTIONS = [
    { label: "My Library", href: "/profile/me?tab=collection", icon: LibraryBig },
    { label: "My Lists", href: "/profile/me?tab=lists", icon: List },
    { label: "Messages", href: "/messages", icon: MessageSquare },
    { label: "Community Forum", href: "/forum", icon: MessagesSquare },
    { label: "My Profile", href: "/profile/me", icon: UserIcon },
    { label: "Rewards", href: "/profile/me?tab=rewards", icon: Gift },
];

export default function QuickActionsGrid() {
    return (
        <SectionCard title="Quick Actions" icon={<Zap className="w-3.5 h-3.5 text-[var(--accent)]" />} bodyClassName="grid grid-cols-3 gap-2">
            {ACTIONS.map((a) => (
                <Link
                    key={a.label}
                    href={a.href}
                    className="group flex flex-col items-center justify-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.05] py-4 px-2 hover:border-[var(--accent)]/40 transition-colors"
                >
                    <a.icon className="w-5 h-5 text-[var(--accent)]" />
                    <span className="text-[10px] font-bold text-white/60 group-hover:text-white text-center leading-tight transition-colors">
                        {a.label}
                    </span>
                </Link>
            ))}
        </SectionCard>
    );
}
