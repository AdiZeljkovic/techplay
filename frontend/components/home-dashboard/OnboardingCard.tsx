"use client";

import Link from "next/link";
import { Gamepad2, Heart, MessagesSquare, ChevronRight, Rocket } from "lucide-react";
import SectionCard from "@/components/profile/dashboard/SectionCard";

const STEPS = [
    { icon: Gamepad2, title: "Add your first game", hint: "Search 200,000+ titles and start your collection", href: "/games" },
    { icon: Heart, title: "Build a wishlist", hint: "Get notified when the games you want release", href: "/calendar" },
    { icon: MessagesSquare, title: "Say hi on the forum", hint: "Join discussions and earn your first XP", href: "/forum" },
];

/** Shown in place of the data sections when the user's collection is empty. */
export default function OnboardingCard() {
    return (
        <SectionCard title="Get Started" icon={<Rocket className="w-3.5 h-3.5 text-[var(--accent)]" />} bodyClassName="space-y-2">
            {STEPS.map((s) => (
                <Link
                    key={s.title}
                    href={s.href}
                    className="group flex items-center gap-3.5 p-3 -mx-1 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-[var(--accent)]/40 transition-colors"
                >
                    <span className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                        <s.icon className="w-4.5 h-4.5 text-[var(--accent)]" />
                    </span>
                    <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-bold text-white group-hover:text-[var(--accent)] transition-colors">{s.title}</span>
                        <span className="block text-[11px] text-white/40">{s.hint}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/25 group-hover:text-[var(--accent)] transition-colors shrink-0" />
                </Link>
            ))}
        </SectionCard>
    );
}
