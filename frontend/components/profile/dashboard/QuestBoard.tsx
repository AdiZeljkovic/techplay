"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import Meter from "@/components/ui/Meter";
import { Compass, Flame, CalendarDays, CalendarRange, Check } from "lucide-react";

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data);

interface Quest {
    id: number;
    name: string;
    description: string;
    type: "daily" | "weekly" | "monthly" | "permanent";
    is_seasonal?: boolean;
    criteria_value: number;
    xp_reward: number;
    bounty_reward: number;
    progress: number;
    completed: boolean;
}

/**
 * Each layer owns a colour.
 *
 * All four headers used to be drawn in the house accent, so a board of four
 * boards read as one thing repeated — and the whole point of the layers is
 * that they answer different questions on different clocks.
 */
const LAYERS: {
    type: Quest["type"];
    label: string;
    blurb: string;
    icon: typeof Compass;
    tint: string;
}[] = [
    // Ordered by how soon it expires. First steps last: it is the one chain
    // with no clock on it, so putting it at the top pushed the thing that
    // resets tonight below the fold.
    { type: "daily", label: "Today", blurb: "Resets at midnight", icon: Flame, tint: "#f97316" },
    { type: "weekly", label: "This week", blurb: "Resets on Monday", icon: CalendarDays, tint: "#60a5fa" },
    { type: "monthly", label: "This season", blurb: "The long arcs", icon: CalendarRange, tint: "var(--accent-ink)" },
    { type: "permanent", label: "First steps", blurb: "One lap of the site — done once", icon: Compass, tint: "#34d399" },
];

/**
 * Which board a quest belongs on.
 *
 * A quest pinned to a season is not permanent — it ends when the season does.
 * Three of them were sitting under "First steps" wearing a SEASON badge to
 * explain why they did not belong there, which is a label apologising for a
 * grouping rather than describing one.
 */
const layerOf = (q: Quest): Quest["type"] =>
    q.is_seasonal && q.type === "permanent" ? "monthly" : q.type;

/**
 * Closest to done first, finished last.
 *
 * The board arrived in catalogue order, so a quest at 7/100 could sit above
 * one at 5/10 and the thing you were one action away from finishing was
 * wherever it happened to land. Sorting by how near it is puts the next move
 * at the top of every board.
 */
const byNearest = (a: Quest, b: Quest) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;

    const share = (q: Quest) => (q.criteria_value > 0 ? Math.min(1, q.progress / q.criteria_value) : 0);
    const diff = share(b) - share(a);
    if (Math.abs(diff) > 0.001) return diff;

    // Same fraction of the way: the shorter one is the nearer one.
    return a.criteria_value - b.criteria_value;
};

/** How many objectives a board shows before it asks. */
const CAP = 5;

/**
 * How long this layer has left, ticking.
 *
 * "Resets at midnight" is true and inert; six hours and eleven minutes is the
 * same fact with a reason to act on it. Computed after mount only — the server
 * has no idea what time it is where the reader is, and rendering a countdown
 * on both sides guarantees they disagree.
 */
function useResetIn(type: Quest["type"]): string | null {
    const [label, setLabel] = useState<string | null>(null);

    useEffect(() => {
        if (type !== "daily" && type !== "weekly") return;

        const tick = () => {
            const now = new Date();
            const target = new Date(now);
            target.setHours(0, 0, 0, 0);

            if (type === "daily") {
                target.setDate(target.getDate() + 1);
            } else {
                // Monday. getDay() is 0 for Sunday, so 8 - day lands on the
                // next Monday for every day except Monday itself, which needs
                // a full seven.
                const ahead = (8 - now.getDay()) % 7 || 7;
                target.setDate(target.getDate() + ahead);
            }

            const ms = target.getTime() - now.getTime();
            const hours = Math.floor(ms / 3_600_000);
            const minutes = Math.floor((ms % 3_600_000) / 60_000);

            setLabel(hours >= 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${hours}h ${minutes}m`);
        };

        tick();
        const id = setInterval(tick, 30_000);

        return () => clearInterval(id);
    }, [type]);

    return label;
}

/**
 * One objective.
 *
 * A quest log marks its objectives; a list of cards does not. The diamond on
 * the left is that mark — hollow while the objective is open, struck through
 * with a tick the moment it closes — and it is what makes a column of these
 * read as a board of work rather than a stack of notifications.
 */
function QuestRow({ quest, tint, showSeason }: { quest: Quest; tint: string; showSeason: boolean }) {
    const done = quest.completed;
    const partial = !done && quest.criteria_value > 1 && quest.progress > 0;

    return (
        <div
            className="group relative flex items-start gap-3 rounded-[var(--radius-card)] border p-3.5 transition-[border-color,background,transform] duration-300"
            style={{
                borderColor: done ? "rgba(52,211,153,0.28)" : "var(--line)",
                background: done ? "rgba(52,211,153,0.055)" : "var(--fill-1)",
            }}
        >
            {/* the objective mark */}
            <span
                aria-hidden
                className="relative shrink-0 w-[22px] h-[22px] mt-[1px] flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
            >
                <span
                    className="absolute inset-0 rotate-45 rounded-[4px] border-2 transition-colors duration-300"
                    style={{
                        borderColor: done ? "#34d399" : partial ? tint : "rgba(255,255,255,0.18)",
                        background: done ? "#34d399" : partial ? `color-mix(in srgb, ${tint} 22%, transparent)` : "transparent",
                    }}
                />
                {done && <Check className="relative w-3 h-3 text-[#04140d]" strokeWidth={3.5} />}
            </span>

            <div className="min-w-0 flex-1">
                <p className="flex items-baseline gap-2">
                    <span className={`text-[13px] font-semibold truncate transition-colors ${done ? "text-emerald-200/85" : "text-white"}`}>
                        {quest.name}
                    </span>
                    {/* Not on the season board itself — a badge that repeats
                        the heading above it is noise. */}
                    {quest.is_seasonal && showSeason && (
                        <span className="shrink-0 inline-flex items-center h-[15px] px-1.5 rounded-[3px] bg-[var(--accent)]/15 font-display text-[7.5px] font-black uppercase tracking-[0.12em] text-[var(--accent-ink)]">
                            Season
                        </span>
                    )}
                </p>
                <p className="mt-0.5 text-[11.5px] text-white/50 leading-snug">{quest.description}</p>

                {/* A one-step quest has nothing to measure — the mark says it all. */}
                {quest.criteria_value > 1 && (
                    <Meter
                        value={quest.progress}
                        max={quest.criteria_value}
                        showCount
                        tone={done ? "#34d399" : tint}
                        className="mt-2.5"
                    />
                )}
            </div>

            {/* The pay, as two chips rather than two numbers floating in a
                corner — the same shape the Today panel uses, so a quest is
                worth the same visible amount wherever it is drawn. */}
            <div className="shrink-0 flex flex-col items-end gap-1">
                {quest.xp_reward > 0 && (
                    <span
                        className="inline-flex items-center gap-1 h-[19px] px-1.5 rounded-[4px] font-display text-[10px] font-black tabular-nums"
                        style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent-ink)" }}
                    >
                        +{quest.xp_reward}<span className="text-white/30">XP</span>
                    </span>
                )}
                {quest.bounty_reward > 0 && (
                    <span className="inline-flex items-center gap-1 h-[19px] px-1.5 rounded-[4px] bg-amber-400/12 font-display text-[10px] font-black tabular-nums text-amber-400">
                        +{quest.bounty_reward}<span className="text-white/30">B</span>
                    </span>
                )}
            </div>
        </div>
    );
}

/** One layer of the board, with its own clock and its own colour. */
function Layer({ layer, quests }: { layer: (typeof LAYERS)[number]; quests: Quest[] }) {
    const { label, blurb, icon: Icon, tint, type } = layer;
    const resetIn = useResetIn(type);
    const [expanded, setExpanded] = useState(false);

    const done = quests.filter((q) => q.completed).length;
    const cleared = done === quests.length;

    // Five objectives, then it asks. One board with nine rows and another with
    // three is what turned a two-column grid into a column and a hole.
    const shown = expanded ? quests : quests.slice(0, CAP);
    const hidden = quests.length - shown.length;

    return (
        <section
            className="relative overflow-hidden rounded-[var(--radius-panel)] border p-4 mb-4 break-inside-avoid transition-colors duration-500"
            style={{
                background: "var(--surface-2)",
                borderColor: cleared ? `color-mix(in srgb, ${tint} 40%, transparent)` : "var(--line-strong)",
                boxShadow: cleared
                    ? `inset 0 1px 0 rgba(255,255,255,0.07), 0 0 34px -18px ${tint}`
                    : "inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
        >
            {/* the layer's seam along the top edge */}
            <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-[2px] transition-opacity duration-500"
                style={{
                    background: `linear-gradient(90deg, ${tint}, color-mix(in srgb, ${tint} 15%, transparent) 70%, transparent)`,
                    opacity: cleared ? 1 : 0.45,
                }}
            />

            <header className="flex items-center gap-2.5 mb-3.5">
                <Icon className="w-[19px] h-[19px] shrink-0" style={{ color: tint }} strokeWidth={1.6} />
                <h3 className="font-display text-[11px] font-black uppercase tracking-[0.14em] text-white">{label}</h3>

                {/* One pip per objective — a quest log counts in marks, not in
                    a fraction you have to read. */}
                <span className="flex items-center gap-1" aria-label={`${done} of ${quests.length} complete`}>
                    {quests.map((q) => (
                        <span
                            key={q.id}
                            className="block w-[7px] h-[7px] rounded-full transition-colors duration-300"
                            style={{
                                background: q.completed ? tint : "rgba(255,255,255,0.13)",
                                boxShadow: q.completed ? `0 0 8px color-mix(in srgb, ${tint} 70%, transparent)` : undefined,
                            }}
                        />
                    ))}
                </span>

                <span className="ml-auto shrink-0">
                    {cleared ? (
                        <span
                            className="inline-flex items-center gap-1 h-[20px] px-2 rounded-[4px] font-display text-[8px] font-black uppercase tracking-[0.14em]"
                            style={{ background: `color-mix(in srgb, ${tint} 18%, transparent)`, color: tint }}
                        >
                            <Check className="w-2.5 h-2.5" strokeWidth={3.5} /> Cleared
                        </span>
                    ) : resetIn ? (
                        <span className="font-display text-[9.5px] font-bold uppercase tracking-[0.12em] tabular-nums text-white/50">
                            {resetIn} left
                        </span>
                    ) : (
                        <span className="hidden sm:block text-[10.5px] text-white/45">{blurb}</span>
                    )}
                </span>
            </header>

            <div className="space-y-2">
                {shown.map((q) => (
                    <QuestRow key={q.id} quest={q} tint={tint} showSeason={type !== "monthly"} />
                ))}
            </div>

            {(hidden > 0 || expanded) && (
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-2.5 w-full h-8 rounded-[7px] border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/50 hover:text-white transition-colors"
                >
                    {expanded ? "Show fewer" : `${hidden} more`}
                </button>
            )}
        </section>
    );
}

/**
 * The quest board, grouped by the question each layer answers.
 *
 * The catalogue used to count two things — the collection and the journal — so
 * somebody who spent every evening on the forum, wrote lists and made friends
 * could finish a whole season without a single quest noticing them. It covers
 * the platform now, and the server hands back a shortlist rather than the
 * whole catalogue: three dailies, three weeklies, the season's arcs, and
 * whatever is left of the welcome chain.
 */
export default function QuestBoard() {
    const { data: quests } = useSWR<Quest[]>("/user/quests", fetcher, {
        dedupingInterval: 120_000,
        revalidateOnFocus: false,
    });

    if (!quests?.length) return null;

    return (
        // Columns rather than a grid. Four boards of three, three, five and
        // nine rows in a two-by-two grid gives every row the height of its
        // tallest member, so the short ones sat in the top corner of a tall
        // empty cell and the page ended in a hole the size of a board. Columns
        // balance on total height instead.
        <div className="columns-1 md:columns-2 gap-4">
            {LAYERS.map((layer) => {
                const group = quests.filter((q) => layerOf(q) === layer.type).sort(byNearest);

                if (group.length === 0) return null;

                return <Layer key={layer.type} layer={layer} quests={group} />;
            })}
        </div>
    );
}
