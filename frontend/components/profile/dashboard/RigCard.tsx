"use client";

import Link from "next/link";
import { Link2, Check } from "lucide-react";
import SectionCard from "./SectionCard";
import PlatformIcon, { platformBrandColor } from "@/components/games/PlatformIcon";

/** The platforms an account can actually be linked to, in the order we ask. */
const PLATFORMS: { id: string; label: string; mark: string }[] = [
    { id: "steam", label: "Steam", mark: "PC" },
    { id: "playstation", label: "PlayStation", mark: "PLAYSTATION" },
    { id: "xbox", label: "Xbox", mark: "XBOX" },
];

/**
 * Where this player is, on the platforms they proved.
 *
 * This was Rig & IDs — a list of PC parts and a row of handles somebody typed
 * into a form. Both were write-only: the owner's Overview is the dashboard, so
 * the only person who ever saw the card was a visitor, and the only person who
 * could fill it never saw what they were filling. Typed handles proved nothing
 * either; anybody could claim any gamertag.
 *
 * What replaces them is the thing that was always the real answer — the OAuth
 * links, which the site verifies and already syncs libraries from — plus the
 * Discord server, which is a fact about this community rather than a claim
 * about a stranger's account.
 */
export default function RigCard({
    connectedAccounts = [], discord, isOwnProfile,
}: {
    connectedAccounts?: string[];
    discord?: { member: boolean; since: string | null } | null;
    isOwnProfile: boolean;
}) {
    const linked = PLATFORMS.filter((p) => connectedAccounts.includes(p.id));
    const inDiscord = !!discord?.member;

    // A visitor gets nothing rather than an empty frame; the owner gets the
    // frame, because it is the prompt to fill it.
    if (linked.length === 0 && !inDiscord && !isOwnProfile) return null;

    return (
        <SectionCard
            title="Platforms"
            material="instrument"
            action={isOwnProfile ? { label: "Connect", href: "/settings" } : undefined}
        >
            {linked.length === 0 && !inDiscord ? (
                <Link
                    href="/settings"
                    className="flex flex-col items-center justify-center gap-2 py-6 rounded-[var(--radius-card)] border border-dashed border-white/[0.12] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors"
                >
                    <Link2 className="w-5 h-5 text-white/25" />
                    <span className="font-display text-[11.5px] font-bold text-white">Connect a platform</span>
                    <span className="text-[11px] text-white/50">Steam pulls your library across in one click.</span>
                </Link>
            ) : (
                <div className="flex flex-wrap gap-1.5">
                    {linked.map((p) => (
                        <span
                            key={p.id}
                            className="inline-flex items-center gap-2 h-[28px] px-2.5 rounded-[7px] bg-white/[0.04] border border-white/[0.08]"
                            title={`${p.label} connected`}
                        >
                            <span style={{ color: platformBrandColor(p.mark) ?? undefined }}>
                                <PlatformIcon label={p.mark} className="w-[15px] h-[15px]" />
                            </span>
                            <span className="text-[10.5px] font-bold text-white/70">{p.label}</span>
                            <Check className="w-3 h-3 text-emerald-400" />
                        </span>
                    ))}

                    {/* Being in the server is a different fact from having
                        linked an account, and only the one worth showing is
                        shown. */}
                    {inDiscord && (
                        <span className="inline-flex items-center gap-1.5 h-[28px] px-2.5 rounded-[7px] bg-[#5865F2]/12 border border-[#5865F2]/35">
                            <span className="text-[12px] leading-none">💬</span>
                            <span className="text-[10.5px] font-bold text-[#A3ACFF]">In our Discord</span>
                        </span>
                    )}
                </div>
            )}
        </SectionCard>
    );
}
