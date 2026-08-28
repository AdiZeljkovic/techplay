"use client";

import { Article } from "@/types";
import { getScoreMeta } from "@/lib/score";
import { Building2, Calendar, Clock, ShoppingCart, ThumbsUp, ThumbsDown, Zap, Meh, Medal, Trophy, Play, type LucideIcon } from "lucide-react";
import PlatformIcon, { platformBrandColor } from "@/components/games/PlatformIcon";
import { platformMarks } from "@/components/games/ReleaseCard";

interface ReviewSidebarProps {
    article: Article;
}

/** The five axes, in the order they are drawn from the top clockwise. */
const AXES: { key: string; label: string }[] = [
    { key: "gameplay", label: "Gameplay" },
    { key: "visuals", label: "Visuals" },
    { key: "audio", label: "Audio" },
    { key: "narrative", label: "Narrative" },
    { key: "replayability", label: "Replay" },
];

/*
 * The wording and the mark are this card's own — a 9.2 reads better as
 * "Amazing" with a medal than as a band name. The colour is not: it comes from
 * lib/score.ts like every other score on the site.
 *
 * It used to be six colours declared here — a cyan, two greens, a yellow, an
 * orange and a red — which made this the fourth palette a score could be drawn
 * in, and the only one where a 9.2 came out mint while the same 9.2 was green
 * on its own card two scrolls up.
 */
const TIERS: { min: number; label: string; icon: LucideIcon }[] = [
    { min: 10, label: "Masterpiece", icon: Trophy },
    { min: 9, label: "Amazing", icon: Medal },
    { min: 8, label: "Great", icon: ThumbsUp },
    { min: 7, label: "Good", icon: Zap },
    { min: 5, label: "Average", icon: Meh },
    { min: 0, label: "Poor", icon: ThumbsDown },
];

/* A recommendation, not a score — but it answers the same question, so it
   answers it in the same three colours rather than inventing a fifth set. */
const VERDICTS: Record<string, { label: string; color: string }> = {
    must_play: { label: "Must play", color: "var(--score-great)" },
    recommended: { label: "Recommended", color: "var(--score-great)" },
    wait_sale: { label: "Wait for a sale", color: "var(--score-fair)" },
    skip: { label: "Skip", color: "var(--score-poor)" },
};

/**
 * The five scores, drawn.
 *
 * This was a recharts RadarChart: six lazy-loaded modules and about two
 * hundred kilobytes of charting library to plot five numbers on a pentagon,
 * on a page whose whole job is to be read quickly. It is trigonometry —
 * five angles and a radius — so it is drawn here.
 *
 * The rebuild also fixes what the chart could not say. Its shape told you
 * Gameplay beat Audio and nothing else: no scale, no ring you could count
 * against, and the actual marks left in a form nobody could read off the
 * plot. Every axis now carries its own figure, and the rings are labelled at
 * the top so the shape has something to be big *against*.
 */
function ScoreRadar({ ratings, tint }: { ratings: Record<string, number>; tint: string }) {
    /*
     * The pentagon is drawn small inside a generous box on purpose: the labels
     * live outside the outer ring, and the box has to hold them.
     */
    const size = 260;
    const height = 208;
    const cx = size / 2;
    const cy = 104;
    const R = 66;
    /** How far past the outer ring the wording sits.
        Tight enough that the two side labels stay inside the box: the widest of
        them is about 40 units of type, and 1.30R leaves it ten to spare. */
    const LABEL_R = 1.30;

    const point = (i: number, ratio: number) => {
        const angle = (-90 + i * 72) * (Math.PI / 180);

        return [cx + R * ratio * Math.cos(angle), cy + R * ratio * Math.sin(angle)] as const;
    };

    const ring = (ratio: number) => AXES.map((_, i) => point(i, ratio).join(",")).join(" ");

    const values = AXES.map((a) => Math.max(0, Math.min(10, Number(ratings[a.key] ?? 0))));
    const shape = values.map((v, i) => point(i, v / 10).join(",")).join(" ");

    return (
        <svg viewBox={`0 0 ${size} ${height}`} className="w-full h-auto" role="img" aria-label="Score breakdown by category">
            {/* the rings you count against */}
            {[0.2, 0.4, 0.6, 0.8, 1].map((r) => (
                <polygon
                    key={r}
                    points={ring(r)}
                    fill="none"
                    stroke="rgba(255,255,255,0.075)"
                    strokeWidth={1}
                />
            ))}
            {AXES.map((_, i) => {
                const [x, y] = point(i, 1);

                return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />;
            })}

            {/* the shape */}
            <polygon points={shape} fill={tint} fillOpacity={0.16} stroke={tint} strokeWidth={2} strokeLinejoin="round" />
            {values.map((v, i) => {
                const [x, y] = point(i, v / 10);

                return <circle key={i} cx={x} cy={y} r={3} fill={tint} />;
            })}

            {/* the labels, each carrying its own mark */}
            {AXES.map((a, i) => {
                /*
                 * Placed along the axis, outside the ring — not nudged off the
                 * vertex.
                 *
                 * The old placement put the wording 9px above the point and the
                 * figure 13px below the wording, which for the top axis landed
                 * the figure 4px *inside* the pentagon: a 10.0 sitting on the
                 * line it was describing. Pushing every label out along its own
                 * angle keeps all five clear of the shape by construction
                 * rather than by five separate nudges.
                 */
                const [x, y] = point(i, LABEL_R);
                const dx = x - cx;
                const anchor = dx > 6 ? "start" : dx < -6 ? "end" : "middle";
                // The top axis stacks upward so the pair still reads outward.
                const oy = y < cy - R * 0.6 ? -13 : 0;

                return (
                    <g key={a.key}>
                        <text
                            x={x}
                            y={y + oy}
                            textAnchor={anchor}
                            className="fill-white/40 font-display"
                            style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}
                        >
                            {a.label}
                        </text>
                        <text
                            x={x}
                            y={y + oy + 13}
                            textAnchor={anchor}
                            className="font-display"
                            style={{ fontSize: 12, fontWeight: 900, fill: values[i] > 0 ? "#fff" : "rgba(255,255,255,0.2)" }}
                        >
                            {values[i].toFixed(1)}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

export default function ReviewSidebar({ article }: ReviewSidebarProps) {
    const { review_data, review_score } = article;

    if (!review_data) return null;

    const ratings = (review_data.ratings || {}) as Record<string, number>;
    const score = Number(review_score || 0);
    const tier = TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1];
    const TierIcon = tier.icon;
    /** Colour from the one place a score becomes a colour. */
    const tone = getScoreMeta(score).color;
    const verdict = review_data.cta ? VERDICTS[review_data.cta] : undefined;

    // Blank entries are why a bullet with no sentence after it was appearing
    // under The Bad — an empty row in the admin repeater renders as a dot.
    const pros = (review_data.pros ?? []).filter((p) => p?.trim());
    const cons = (review_data.cons ?? []).filter((c) => c?.trim());

    const formattedDate = review_data.release_date
        ? new Date(review_data.release_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : "TBA";

    const getStoreUrl = (url: string) => {
        if (!url) return "#";
        if (url.startsWith("http://") || url.startsWith("https://")) return url;

        return `https://${url}`;
    };

    return (
        <div className="space-y-5">
            <div
                className="relative overflow-hidden rounded-[var(--radius-panel)] border"
                style={{
                    background: "var(--surface-1)",
                    borderColor: `color-mix(in srgb, ${tone} 28%, transparent)`,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
            >
                {/* The verdict's own colour along the top edge — the card is
                    about one number, so the frame says which way it went before
                    a word is read. */}
                <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-[2px] z-10"
                    style={{ background: `linear-gradient(90deg, ${tone}, color-mix(in srgb, ${tone} 18%, transparent) 62%, transparent)` }}
                />

                <div className="md:grid md:grid-cols-12">
                    {/* ── the scores ── */}
                    <div className="md:col-span-5 flex flex-col border-b md:border-b-0 md:border-r border-white/[0.07]" style={{ background: "var(--surface-2)" }}>
                        <div className="px-5 pt-5 pb-1 flex-1">
                            <ScoreRadar ratings={ratings} tint={tone} />
                        </div>

                        {/* The total and the verdict on one line.
                            They were a bay and then a full-width button under
                            it, which put a hundred and forty pixels under a
                            radar that was already the tallest thing in the
                            card — and every one of them showed as empty space
                            beside the pros and cons, which need a third of
                            that. */}
                        <div className="flex items-center gap-4 px-5 py-4 border-t border-white/[0.07]">
                            <span
                                className="shrink-0 w-11 h-11 rounded-[10px] flex items-center justify-center"
                                style={{ background: `color-mix(in srgb, ${tone} 16%, transparent)`, color: tone }}
                            >
                                <TierIcon className="w-[22px] h-[22px]" strokeWidth={1.6} />
                            </span>

                            <span className="min-w-0">
                                <span className="flex items-baseline gap-1.5">
                                    <span className="font-display text-[30px] font-black tabular-nums leading-none" style={{ color: tone }}>
                                        {score.toFixed(1)}
                                    </span>
                                    <span className="font-display text-[11px] font-bold tabular-nums text-white/45">/ 10</span>
                                </span>
                                <span className="block mt-1 font-display text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: tone }}>
                                    {tier.label}
                                </span>
                            </span>

                            {verdict && (
                                <span
                                    className="ml-auto shrink-0 inline-flex items-center h-8 px-3 rounded-[7px] font-display text-[9.5px] font-black uppercase tracking-[0.14em] text-center"
                                    style={{
                                        background: `color-mix(in srgb, ${verdict.color} 14%, transparent)`,
                                        color: verdict.color,
                                        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${verdict.color} 38%, transparent)`,
                                    }}
                                >
                                    {verdict.label}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ── what it is, and the case for and against ── */}
                    <div className="md:col-span-7 flex flex-col">
                        <div className="p-5 border-b border-white/[0.07]">
                            <h3 className="font-display text-[22px] md:text-[26px] font-black text-white leading-[1.1] tracking-tight">
                                {review_data.game_title}
                            </h3>
                            <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-display text-[10px] font-bold uppercase tracking-[0.1em] text-white/50">
                                {review_data.developer && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5 text-[var(--accent-ink)]" strokeWidth={1.6} /> {review_data.developer}
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1.5 tabular-nums">
                                    <Calendar className="w-3.5 h-3.5 text-[var(--accent-ink)]" strokeWidth={1.6} /> {formattedDate}
                                </span>
                                {review_data.play_time && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-[var(--accent-ink)]" strokeWidth={1.6} /> {review_data.play_time}
                                    </span>
                                )}
                            </p>
                        </div>

                        {(review_data.platforms?.length || review_data.tested_on) && (
                            <div className="px-5 py-3 border-b border-white/[0.07] flex flex-wrap items-center gap-2">
                                <span className="font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/50 mr-1">Available on</span>

                                {/* The platform's own mark, in its own colour —
                                    the same one release cards use. Every chip
                                    carried the identical grey controller before,
                                    which made a list of three platforms read as
                                    three of the same thing. */}
                                {review_data.platforms?.map((p) => {
                                    const mark = platformMarks([p])[0];

                                    return (
                                        <span
                                            key={p}
                                            className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-[7px] bg-white/[0.04] border border-white/[0.08] font-display text-[10.5px] font-bold text-white"
                                        >
                                            {mark && (
                                                <span style={{ color: platformBrandColor(mark) ?? undefined }}>
                                                    <PlatformIcon label={mark} className="w-[14px] h-[14px]" />
                                                </span>
                                            )}
                                            {p}
                                        </span>
                                    );
                                })}

                                {review_data.tested_on && (
                                    <span className="ml-auto font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/50">
                                        Tested on <span className="text-white/70">{review_data.tested_on}</span>
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Two columns, one hairline. The tinted green and red
                            panels behind them were doing the colour's job twice
                            and muddying the text they sat under. */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07]">
                            {([
                                ["The good", pros, "#34d399", ThumbsUp],
                                ["The bad", cons, "#f87171", ThumbsDown],
                            ] as const).map(([title, items, color, Icon]) => (
                                <div key={title} className="p-5">
                                    <h4 className="flex items-center gap-2 mb-3 font-display text-[10px] font-black uppercase tracking-[0.16em]" style={{ color }}>
                                        <Icon className="w-4 h-4" strokeWidth={1.8} /> {title}
                                    </h4>
                                    {items.length === 0 ? (
                                        <p className="text-[12px] text-white/45">Nothing worth listing.</p>
                                    ) : (
                                        <ul className="space-y-2.5">
                                            {items.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2.5 text-[12.5px] text-white/60 leading-snug">
                                                    <span
                                                        aria-hidden
                                                        className="mt-[6px] w-[5px] h-[5px] rounded-full shrink-0"
                                                        style={{ background: color }}
                                                    />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>

                        {review_data.store_link && (
                            <div className="p-5 border-t border-white/[0.07]">
                                <a
                                    href={getStoreUrl(review_data.store_link)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full h-11 rounded-[9px] bg-[var(--accent)] hover:brightness-110 text-white font-display text-[11px] font-black uppercase tracking-[0.12em] transition-[filter]"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    {review_data.price ? `Buy now — ${review_data.price}` : "Buy now"}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {review_data.trailer_url && (
                <div
                    className="rounded-[var(--radius-panel)] border overflow-hidden"
                    style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
                >
                    <header className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/[0.07]">
                        <Play className="w-4 h-4 text-[var(--accent-ink)]" strokeWidth={1.8} />
                        <h4 className="font-display text-[11px] font-black uppercase tracking-[0.15em] text-white">Video review</h4>
                    </header>
                    <div className="relative aspect-video bg-black">
                        <iframe
                            src={review_data.trailer_url.replace("watch?v=", "embed/")}
                            title="Trailer"
                            className="absolute inset-0 w-full h-full"
                            allowFullScreen
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
