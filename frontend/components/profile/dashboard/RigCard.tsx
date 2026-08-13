"use client";

import Link from "next/link";
import { Cpu, MonitorCog, MemoryStick, CircuitBoard, Box, Wrench } from "lucide-react";
import SectionCard from "./SectionCard";
import type { ProfileUser } from "@/lib/types/profile";

const SPEC_META: Record<string, { label: string; icon: typeof Cpu }> = {
    cpu: { label: "CPU", icon: Cpu },
    gpu: { label: "GPU", icon: MonitorCog },
    ram: { label: "RAM", icon: MemoryStick },
    mobo: { label: "Motherboard", icon: CircuitBoard },
    case: { label: "Case", icon: Box },
};

const PLATFORM_GLYPH: Record<string, string> = {
    steam: "🎮", epic: "🕹️", psn: "🎯", xbox: "🟩", discord: "💬", pc: "🖥️", switch: "🔴",
};

/**
 * The rig and the handles — who you are on hardware.
 *
 * Lifted out of Gamer DNA, where it sat under a heading about taste. What
 * machine somebody plays on and what they are called on each platform is
 * identity, not analysis, so it belongs beside the name.
 */
export default function RigCard({
    user, discord, isOwnProfile,
}: {
    user: ProfileUser;
    discord?: { member: boolean; since: string | null } | null;
    isOwnProfile: boolean;
}) {
    const specs = Object.entries((user.pc_specs ?? {}) as Record<string, string>).filter(([, v]) => !!v);
    const tags = Object.entries((user.gamertags ?? {}) as Record<string, string>).filter(([, v]) => !!v);

    // A visitor gets nothing rather than an empty frame; the owner gets the
    // frame, because it is the prompt to fill it.
    if (specs.length === 0 && tags.length === 0 && !discord && !isOwnProfile) return null;

    return (
        <SectionCard title="Rig & IDs" material="instrument" action={isOwnProfile ? { label: "Edit", href: "/settings" } : undefined}>
            {specs.length === 0 && tags.length === 0 ? (
                <Link
                    href="/settings"
                    className="flex flex-col items-center justify-center gap-2 py-6 rounded-[var(--radius-card)] border border-dashed border-white/[0.12] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors"
                >
                    <Wrench className="w-5 h-5 text-white/25" />
                    <span className="font-display text-[11.5px] font-bold text-white">Add your rig</span>
                    <span className="text-[11px] text-white/30">Specs and gamertags show up here.</span>
                </Link>
            ) : (
                <>
                    {specs.length > 0 && (
                        <div className="space-y-2">
                            {specs.slice(0, 4).map(([key, value]) => {
                                const meta = SPEC_META[key.toLowerCase()] ?? { label: key, icon: Cpu };
                                const Icon = meta.icon;

                                return (
                                    <div key={key} className="flex items-baseline gap-2.5">
                                        <span className="flex items-center gap-1.5 shrink-0 w-[92px] font-display text-[9px] font-bold uppercase tracking-[0.14em] text-white/35">
                                            <Icon className="w-3.5 h-3.5" /> {meta.label}
                                        </span>
                                        <span className="min-w-0 text-[12px] font-semibold text-white leading-snug break-words">{value}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {(tags.length > 0 || discord) && (
                        <div className={specs.length > 0 ? "mt-4 pt-4 border-t border-white/[0.07]" : ""}>
                            <div className="flex flex-wrap gap-1.5">
                                {tags.map(([platform, handle]) => (
                                    <span key={platform} className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-[6px] bg-white/[0.04] border border-white/[0.08]">
                                        <span className="text-[12px] leading-none">{PLATFORM_GLYPH[platform.toLowerCase()] ?? "🎮"}</span>
                                        <span className="text-[10.5px] font-bold text-white/70">{handle}</span>
                                    </span>
                                ))}

                                {/* Being in the server is a different fact from
                                    having linked an account, and only the one
                                    worth showing is shown. */}
                                {discord?.member && (
                                    <span className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-[6px] bg-[#5865F2]/12 border border-[#5865F2]/35">
                                        <span className="text-[12px] leading-none">💬</span>
                                        <span className="text-[10.5px] font-bold text-[#A3ACFF]">In our Discord</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </SectionCard>
    );
}
