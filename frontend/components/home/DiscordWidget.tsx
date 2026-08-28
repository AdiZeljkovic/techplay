"use client";

import Link from "next/link";
import { Bell, Gift, Users } from "lucide-react";
import Panel from "@/components/ui/Panel";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const BLURPLE = "#5865F2";

const DiscordIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055A19.9 19.9 0 0 0 6.131 21.3a.077.077 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
);

/** What the server actually gives you — no invented member counts. */
const PERKS = [
    { icon: Bell, text: "News the moment it publishes" },
    { icon: Gift, text: "Giveaway pings before they close" },
    { icon: Users, text: "Squads, LFG and the editors" },
];

export default function DiscordWidget() {
    const { settings } = useSiteSettings();
    const discordUrl = settings.discord_url || "https://discord.gg/wPQG9gUMXH";
    const siteName = settings.site_name || "TechPlay.gg";

    return (
        <Panel title="Community Discord">
            <div className="flex items-center gap-3.5">
                <span
                    className="w-12 h-12 shrink-0 rounded-[var(--radius-panel)] flex items-center justify-center"
                    style={{ background: BLURPLE }}
                >
                    <DiscordIcon className="w-7 h-7 text-white" />
                </span>
                <div className="min-w-0">
                    <p className="font-display text-[15px] font-black text-white leading-tight truncate">{siteName}</p>
                    <p className="mt-0.5 font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/50">
                        Official server
                    </p>
                </div>
            </div>

            <ul className="mt-4 space-y-2">
                {PERKS.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-2.5 text-[12.5px] text-white/55">
                        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: BLURPLE }} />
                        {text}
                    </li>
                ))}
            </ul>

            <Link
                href={discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-command mt-4 flex items-center justify-center gap-2 h-10 font-display text-[10.5px] font-black uppercase tracking-[0.12em] text-white hover:brightness-110 transition-[filter]"
                style={{ background: BLURPLE }}
            >
                <DiscordIcon className="w-4 h-4" /> Join Discord
            </Link>
        </Panel>
    );
}
