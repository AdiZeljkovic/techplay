"use client";

/**
 * homeUI — shared design system for all homepage sections.
 * Single source of truth for tokens, ambient shell, headers, badges,
 * meta rows, card hover behaviour, corner accents and score rings.
 *
 * Goal: every home section (News, Reviews, Calendar, Game Database,
 * Hardware) renders with identical visual language — bold neon-HUD,
 * orange-primary accent, blue only as a subtle structural tint.
 */

import Link from "next/link";
import { ArrowRight, Clock, type LucideIcon } from "lucide-react";

/* ─── Tokens ─────────────────────────────────────────────────────── */

export const HUD = {
    accent: '#FC4100',
    accentHover: '#FF5722',
    accentSoft: 'rgba(252,65,0,0.12)',
    accentUltraSoft: 'rgba(252,65,0,0.04)',
    cardBg: 'rgba(2,10,26,0.85)',
    cardBgMuted: 'rgba(2,10,26,0.5)',
    cardBorder: 'rgba(59,130,246,0.12)',
    cardBorderHover: 'rgba(252,65,0,0.4)',
    cardShadow: '0 8px 32px -4px rgba(0,0,0,0.5)',
    cardShadowHover: '0 20px 60px -12px rgba(0,0,0,0.7), 0 0 40px -10px rgba(252,65,0,0.15)',
    radius: { sm: 8, md: 12, lg: 16, shell: 24, pill: 100 },
    ambientGrid: 40,
} as const;

export function HUDFrame({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`relative ${className}`} style={{
            border: `1px solid ${HUD.cardBorder}`,
            background: HUD.cardBg,
            borderRadius: HUD.radius.md,
            overflow: 'hidden'
        }}>
            <CornerAccents />
            {children}
        </div>
    );
}

/* ─── Ambient shell ──────────────────────────────────────────────── */
// Wraps a whole section: dark gradient + grid overlay + corner glows +
// top orange hairline (framed HUD feel) + consistent inner padding.

export function AmbientShell({ children, padding = 28 }: { children: React.ReactNode; padding?: number }) {
    return (
        <div style={{ position: 'relative', borderRadius: HUD.radius.shell, overflow: 'hidden' }}>
            {/* Background */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #040e22 0%, #020810 100%)', zIndex: 0 }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'linear-gradient(rgba(59,130,246,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.015) 1px, transparent 1px)',
                    backgroundSize: `${HUD.ambientGrid}px ${HUD.ambientGrid}px`,
                }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '380px', height: '320px', background: 'radial-gradient(ellipse, rgba(252,65,0,0.04) 0%, transparent 65%)' }} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '320px', height: '280px', background: 'radial-gradient(ellipse, rgba(59,130,246,0.04) 0%, transparent 65%)' }} />
            </div>
            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1, padding }}>
                {children}
            </div>
        </div>
    );
}

/* ─── Technical Divider ─────────────────────────────────────────── */

export function TechDivider() {
    return (
        <div className="flex items-center justify-center py-16 opacity-30">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent" />
            <div className="flex items-center gap-2 px-6">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                <div className="w-3 h-3 border border-[var(--accent)] rotate-45 flex-shrink-0" />
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            </div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent" />
        </div>
    );
}

/* ─── Premium Section Header ─────────────────────────────────────── */

export function SectionHeader({
    title, viewAllLink, viewAllLabel, children
}: {
    title: string;
    viewAllLink?: string;
    viewAllLabel?: string;
    children?: React.ReactNode;
}) {
    return (
        <div className="relative mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-4">
                    <div className="w-1 h-5 bg-[var(--accent)] rounded-full" />
                    <h2 className="text-base md:text-lg font-black text-white tracking-[0.18em] uppercase m-0 leading-none">
                        {title}
                    </h2>
                </div>
                
                {children && (
                    <div className="flex-1 flex justify-center">
                        {children}
                    </div>
                )}

                {viewAllLink && (
                    <Link
                        href={viewAllLink}
                        className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-white/40 hover:text-[var(--accent)] transition-colors"
                    >
                        {viewAllLabel || `VIEW ALL`}
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </Link>
                )}
            </div>
        </div>
    );
}

/* ─── Circuit Line ────────────────────────────────────────────────── */

export function CircuitLine({ className = "" }: { className?: string }) {
    return (
        <div className={`flex items-center w-full opacity-60 ${className}`}>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--accent)]" />
            <div className="flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mx-1" />
                <div className="h-px w-8 bg-[var(--accent)]" />
                <div className="w-1.5 h-1.5 rounded-full border border-[var(--accent)] mx-1" />
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--accent)]" />
        </div>
    );
}

/* ─── Category badge ─────────────────────────────────────────────── */

export function CategoryBadge({ label, className, style }: { label: string; className?: string; style?: React.CSSProperties }) {
    return (
        <span
            className={className}
            style={{
                display: 'inline-block', alignSelf: 'flex-start',
                fontSize: '9px', fontWeight: 900, textTransform: 'uppercase',
                letterSpacing: '0.12em', padding: '3px 8px', borderRadius: '3px',
                background: HUD.accent, color: '#fff',
                boxShadow: '0 2px 8px rgba(252,65,0,0.4)',
                ...style,
            }}
        >
            {label}
        </span>
    );
}

/* ─── Meta row (date · read time) ────────────────────────────────── */

export function MetaRow({ date, readTime, author, className, style }: { date?: string; readTime?: string; author?: string; className?: string; style?: React.CSSProperties }) {
    return (
        <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', ...style }}>
            {author && (
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{author}</span>
            )}
            {author && date && <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />}
            {date && (
                <span suppressHydrationWarning style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.04em' }}>{date}</span>
            )}
            {date && readTime && <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />}
            {readTime && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
                    <Clock style={{ width: '12px', height: '12px', color: HUD.accent }} /> {readTime}
                </span>
            )}
        </div>
    );
}

/* ─── Card hover helpers ─────────────────────────────────────────── */
// Apply to any Link/div card for identical lift + orange border + shadow.

export const cardShellStyle: React.CSSProperties = {
    borderRadius: HUD.radius.md,
    border: `1px solid ${HUD.cardBorder}`,
    background: HUD.cardBg,
    boxShadow: HUD.cardShadow,
    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
};

export function onCardEnter(e: React.MouseEvent<HTMLElement>) {
    const el = e.currentTarget;
    el.style.transform = 'translateY(-3px)';
    el.style.boxShadow = HUD.cardShadowHover;
    el.style.borderColor = HUD.cardBorderHover;
}

export function onCardLeave(e: React.MouseEvent<HTMLElement>) {
    const el = e.currentTarget;
    el.style.transform = 'translateY(0)';
    el.style.boxShadow = HUD.cardShadow;
    el.style.borderColor = HUD.cardBorder;
}

/* ─── Corner accents (featured cards) ────────────────────────────── */

export function CornerAccents() {
    return (
        <>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '28px', height: '2px', background: HUD.accent, zIndex: 3 }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: '2px', height: '28px', background: HUD.accent, zIndex: 3 }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '28px', height: '2px', background: 'rgba(252,65,0,0.4)', zIndex: 3 }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '2px', height: '28px', background: 'rgba(252,65,0,0.4)', zIndex: 3 }} />
        </>
    );
}

/* ─── Score ring ─────────────────────────────────────────────────── */

export function getScoreMeta(score: number): { color: string; label: string; glow: string } {
    if (score >= 9) return { color: '#f97316', label: 'MASTERPIECE', glow: 'rgba(249,115,22,0.5)' };
    if (score >= 8) return { color: '#22c55e', label: 'GREAT',       glow: 'rgba(34,197,94,0.5)'  };
    if (score >= 7) return { color: '#86efac', label: 'GOOD',        glow: 'rgba(134,239,172,0.4)' };
    if (score >= 6) return { color: '#eab308', label: 'FAIR',        glow: 'rgba(234,179,8,0.45)' };
    return              { color: '#ef4444', label: 'POOR',        glow: 'rgba(239,68,68,0.45)'  };
}

export function ScoreRing({ score, size = 72, showLabel = true }: { score: number; size?: number; showLabel?: boolean }) {
    const { color, label, glow } = getScoreMeta(score);
    const strokeW = size > 60 ? 5 : 4;
    const r = (size / 2) - strokeW - 1;
    const circ = 2 * Math.PI * r;
    const dash = Math.min(score / 10, 1) * circ;
    const fontSize = size > 60 ? '24px' : size > 45 ? '16px' : '13px';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            <div style={{ position: 'relative', width: size, height: size }}>
                <div style={{ position: 'absolute', inset: '-4px', borderRadius: '50%', background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, opacity: 0.6 }} />
                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
                    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeW} />
                    <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                        stroke={color} strokeWidth={strokeW}
                        strokeDasharray={`${dash} ${circ}`}
                        strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 3px ${color})` }}
                    />
                </svg>
                <div style={{
                    position: 'absolute', inset: strokeW + 3, borderRadius: '50%',
                    background: 'rgba(2,6,18,0.85)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <span style={{ fontSize, fontWeight: 900, color, lineHeight: 1, textShadow: `0 0 12px ${glow}` }}>{score}</span>
                </div>
            </div>
            {showLabel && <span style={{ fontSize: '7px', fontWeight: 900, color, textTransform: 'uppercase', letterSpacing: '0.1em', textShadow: `0 0 8px ${glow}` }}>{label}</span>}
        </div>
    );
}
