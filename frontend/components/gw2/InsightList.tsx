"use client";

import { useEffect, useState } from "react";
import { Check, Map as MapIcon, MapPin, Swords } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Meter from "@/components/ui/Meter";
import ChatCode from "@/components/gw2/ChatCode";
import { Gw2Panel, SectionHeader } from "@/components/gw2/Gw2Ui";
import { DOMAIN_TONE } from "@/lib/gw2domain";
import { getInsightMap } from "@/lib/gw2";
import type { InsightMap } from "@/lib/gw2public";

/**
 * One map's mastery insights: where, the nearest waypoint, and — signed in —
 * which are still to collect.
 *
 * Rendered on the server with the public data, so a crawler and a stranger see
 * the whole list; a signed-in reader's own flags arrive afterwards and only add
 * ticks. Nothing here is placed by hand: positions, waypoints and their chat
 * codes all come from `/v2/continents`.
 */

const TONE = DOMAIN_TONE.masteries;

export default function InsightList({ map }: { map: InsightMap }) {
    const { user, isLoading } = useAuth();
    const [mine, setMine] = useState<InsightMap | null>(null);

    useEffect(() => {
        if (isLoading || !user) return;

        let cancelled = false;

        getInsightMap(map.id)
            .then((data) => {
                if (!cancelled) setMine(data);
            })
            // No account connected, or the read failed: the public list stands.
            .catch(() => undefined);

        return () => {
            cancelled = true;
        };
    }, [isLoading, user, map.id]);

    const shown = mine ?? map;
    const left = shown.insights_collected === null ? null : shown.insights_total - shown.insights_collected;

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="min-w-0 space-y-4">
                <SectionHeader
                    icon={<MapPin size={18} />}
                    tone={TONE}
                    title={`${shown.insights_total} mastery insights`}
                    description="Numbered to match the plot, each with the waypoint nearest to it."
                    meta={
                        left !== null ? (
                            <span
                                className="shrink-0 rounded-full border px-3 py-1 text-xs"
                                style={{ color: TONE, borderColor: `color-mix(in srgb, ${TONE} 45%, transparent)` }}
                            >
                                {left === 0 ? "all collected" : `${left} left for you`}
                            </span>
                        ) : undefined
                    }
                />

                {shown.insights_collected !== null && (
                    <Meter value={shown.insights_collected} max={shown.insights_total} tone={TONE} showCount />
                )}

                <ol className="space-y-2">
                    {shown.insights.map((insight, i) => (
                        <li
                            key={insight.id}
                            className="flex items-center gap-3 rounded-[var(--radius-card)] border px-3 py-2.5 text-sm"
                            style={{
                                background: "var(--surface-1)",
                                borderColor: insight.collected ? "var(--line)" : `color-mix(in srgb, ${TONE} 22%, var(--line))`,
                            }}
                        >
                            <span
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-numeric text-[11px]"
                                style={{
                                    background: insight.collected ? "var(--fill-2)" : `color-mix(in srgb, ${TONE} 22%, transparent)`,
                                    color: insight.collected ? "var(--ink-faint)" : "var(--ink-hi)",
                                }}
                            >
                                {insight.collected ? <Check size={12} aria-label="collected" /> : i + 1}
                            </span>
                            <span
                                className="min-w-0 flex-1"
                                style={{ color: insight.collected ? "var(--ink-low)" : "var(--ink-mid)" }}
                            >
                                {insight.nearest_waypoint?.name ? (
                                    <>
                                        Near{" "}
                                        <span style={{ color: insight.collected ? "var(--ink-mid)" : "var(--ink-hi)" }}>
                                            {insight.nearest_waypoint.name}
                                        </span>
                                    </>
                                ) : (
                                    "No waypoint on this map"
                                )}
                            </span>
                            {insight.nearest_waypoint?.chat_link && (
                                <ChatCode code={insight.nearest_waypoint.chat_link} label={insight.nearest_waypoint.name} />
                            )}
                        </li>
                    ))}
                </ol>

                <p className="text-[11px] text-[var(--ink-faint)]">
                    The code beside each one is the nearest waypoint&apos;s own chat link — paste it in game and click it
                    to travel there.
                    {!isLoading && !user && " Sign in and connect your account to see which ones you still need."}
                </p>
            </section>

            <div className="space-y-5">
                <Gw2Panel icon={<MapIcon size={18} />} title="Where they are" description="From the game's own coordinates" tone={TONE}>
                    <MiniMap map={shown} />
                </Gw2Panel>
                {map.hero_challenges > 0 && (
                    <Gw2Panel icon={<Swords size={18} />} title="Hero challenges">
                        {/* Listed as what exists, not what is left: the game's
                            per-character endpoint for these has answered empty
                            for every character for years. */}
                        <p className="text-sm text-[var(--ink-mid)]">
                            {map.hero_challenges} on this map. The game no longer reports which ones a character has
                            done, so we cannot tick them off.
                        </p>
                    </Gw2Panel>
                )}
            </div>
        </div>
    );
}

/**
 * The map's frame with its waypoints and insights, from the game's own
 * coordinates. Not the game's map art — a plot, so a reader can see "three in
 * the north-east" at a glance and match the numbers to the list.
 */
function MiniMap({ map }: { map: InsightMap }) {
    const rect = map.continent_rect;

    if (!rect) {
        return <p className="text-xs text-[var(--ink-low)]">The game gives no frame for this map.</p>;
    }

    const [[x1, y1], [x2, y2]] = rect;
    const width = Math.max(1, x2 - x1);
    const height = Math.max(1, y2 - y1);

    return (
        <svg
            viewBox={`${x1} ${y1} ${width} ${height}`}
            className="w-full rounded-[var(--radius-inner)]"
            style={{ background: "var(--fill-1)", aspectRatio: `${width} / ${height}` }}
            role="img"
            aria-label={`Plot of ${map.insights_total} insights and ${map.waypoints.length} waypoints on ${map.name}`}
        >
            {map.waypoints.map(
                (w, i) =>
                    w.coord && (
                        <rect
                            key={`w${i}`}
                            x={w.coord[0] - width * 0.008}
                            y={w.coord[1] - width * 0.008}
                            width={width * 0.016}
                            height={width * 0.016}
                            fill="var(--ink-faint)"
                        />
                    )
            )}
            {map.insights.map(
                (insight, i) =>
                    insight.coord && (
                        <g key={insight.id}>
                            <circle
                                cx={insight.coord[0]}
                                cy={insight.coord[1]}
                                r={width * 0.022}
                                fill={insight.collected ? "var(--fill-3)" : TONE}
                            />
                            {!insight.collected && (
                                <text
                                    x={insight.coord[0]}
                                    y={insight.coord[1]}
                                    fontSize={width * 0.026}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fill="#fff"
                                >
                                    {i + 1}
                                </text>
                            )}
                        </g>
                    )
            )}
        </svg>
    );
}
