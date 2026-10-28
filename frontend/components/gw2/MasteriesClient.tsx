"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Award, Check, CircleDollarSign, Compass, Info, Layers, MapPin, Sparkles, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Panel from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import Meter from "@/components/ui/Meter";
import Chip from "@/components/ui/Chip";
import { Skeleton } from "@/components/ui/Skeleton";
import GameIcon from "@/components/gw2/GameIcon";
import WikiLink from "@/components/gw2/WikiLink";
import ChatCode from "@/components/gw2/ChatCode";
import { TileThumb, ZoneMap } from "@/components/gw2/Gw2Map";
import { Gw2Panel, SectionHeader } from "@/components/gw2/Gw2Ui";
import { DOMAIN_TONE, regionTone } from "@/lib/gw2domain";
import { insightHref } from "@/lib/gw2public";
import {
    getMasteries,
    type Gw2Masteries,
    type MasteryRegionView,
    type MasteryTrackView,
    type NearlyDone,
    type PointToGet,
} from "@/lib/gw2";

/**
 * Masteries and easy wins — mockup 3.
 *
 * The regions run across the top as tabs, and the rest of the page is about the
 * one chosen: where its next points are, what its unspent ones buy, and its
 * maps with every insight on them. The easy wins along the foot are the
 * account's, whatever region is chosen.
 *
 * The headline figure — "Heart of Thorns 73% · 186 / 254 Mastery Points" — is
 * drawn for real. The denominator is summed from every tier's point cost in our
 * mirror of the catalogue, and it reconciles against what the account itself
 * reports as spent; that reconciliation is a test.
 *
 * What the mockup draws and this does not, each with what stands in its place:
 * "Currently Training" (the API does not say which track is being trained, or
 * how much experience it has) is the next tier the region's points can buy;
 * "Nearby Priorities" in metres (that needs the player's live position) is the
 * list of insights with their nearest waypoint and its chat code; "1–2 hours ·
 * Easy" (the game reports how long nothing takes) is a straight-line distance
 * band; and the Weekly Completion Score is not here at all.
 */

/** The expansions in release order, which is how a player thinks of them. */
const REGION_ORDER = [
    "Central Tyria",
    "Heart of Thorns",
    "Path of Fire",
    "Icebrood Saga",
    "End of Dragons",
    "Secrets of the Obscure",
    "Janthir Wilds",
];

export default function MasteriesClient() {
    const { user, isLoading: authLoading } = useAuth();

    const [data, setData] = useState<Gw2Masteries | null>(null);
    const [state, setState] = useState<"loading" | "none" | "ready" | "error">("loading");
    const [chosen, setChosen] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const payload = await getMasteries();

            setData(payload);
            setState(payload ? "ready" : "none");
        } catch (e: unknown) {
            const status = (e as { response?: { status?: number } }).response?.status;

            setState(status === 404 ? "none" : "error");
        }
    }, []);

    /*
     * Signed out is a branch below, not a state set from here. Calling setState
     * in an effect body for something already derivable from `user` costs a
     * second render and reads as if the two could disagree.
     */
    useEffect(() => {
        if (authLoading || !user) return;

        void load();
    }, [authLoading, user, load]);

    if (!authLoading && !user) {
        return <ConnectFirst />;
    }

    if (authLoading || state === "loading") {
        return <Skeleton className="h-96 w-full" />;
    }

    if (state === "error") {
        return (
            <Panel material="matte">
                <div className="space-y-3">
                    <p className="text-sm text-[var(--ink-mid)]">
                        We could not load your masteries. This is a problem reaching our own server, not your data.
                    </p>
                    <Button variant="secondary" onClick={() => void load()}>
                        Try again
                    </Button>
                </div>
            </Panel>
        );
    }

    if (state === "none" || !data) {
        return <ConnectFirst />;
    }

    const regions = [...data.regions].sort(
        (a, b) => rank(a.region) - rank(b.region) || a.region.localeCompare(b.region)
    );
    const selected = regions.find((r) => r.region === chosen) ?? opening(regions);

    return (
        <div className="space-y-6">
            <RegionTabs regions={regions} selected={selected?.region ?? null} onSelect={setChosen} />

            {selected && (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="min-w-0 space-y-6">
                        <BestPoints region={selected} known={data.insights_known} />
                        <RegionTracks region={selected} />
                    </div>

                    <div className="space-y-5">
                        <NextTier region={selected} />
                        <ZonesPanel region={selected} known={data.insights_known} />
                    </div>
                </div>
            )}

            {data.easy_wins.length > 0 && <EasyWinsRow wins={data.easy_wins} />}

            {data.unpaired.length > 0 && (
                <Panel material="matte" title="Tracks we cannot place yet">
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <Info size={16} className="mt-0.5 shrink-0 text-[var(--ink-low)]" aria-hidden />
                            <p className="text-sm text-[var(--ink-mid)]">
                                Guild Wars 2 names regions differently in its two endpoints — the catalogue says{" "}
                                <em>Maguuma</em> where your account says <em>Heart of Thorns</em> — and these tracks
                                belong to a region with no counterpart at all. We would rather show them apart than
                                file your points under a guessed expansion.
                            </p>
                        </div>
                        <ul className="flex flex-wrap gap-2">
                            {data.unpaired.map((track) => (
                                <li key={track.id} className="inline-flex items-center gap-0.5">
                                    <Chip variant="neutral" size="sm">
                                        {track.name} · {track.points_total} points
                                    </Chip>
                                    <WikiLink wiki={track.wiki} name={track.name} compact />
                                </li>
                            ))}
                        </ul>
                    </div>
                </Panel>
            )}
        </div>
    );
}

function rank(region: string): number {
    const i = REGION_ORDER.indexOf(region);

    return i === -1 ? REGION_ORDER.length : i;
}

/**
 * The region the page opens on: the one with the most points still to earn
 * among those where we can name somewhere to earn them. A region whose every
 * tier is paid for is the least useful place to start, however good it looks.
 */
function opening(regions: MasteryRegionView[]): MasteryRegionView | undefined {
    const useful = regions.filter((r) => r.points_needed > 0 && r.points_to_get.length > 0);

    return [...(useful.length > 0 ? useful : regions)].sort((a, b) => b.points_needed - a.points_needed)[0];
}

function ConnectFirst() {
    return (
        <Panel material="lit" crown title="Connect your account first">
            <div className="space-y-4">
                <p className="text-sm text-[var(--ink-mid)]">Mastery progress is read from your own Guild Wars 2 account.</p>
                <Button asChild>
                    <Link href="/gw2">Go to the advisor</Link>
                </Button>
            </div>
        </Panel>
    );
}

/**
 * The regions across the top, as the tabs the mockup draws them as. A row that
 * scrolls sideways rather than wraps: seven expansions wrap into a block that
 * stops reading as a choice.
 */
function RegionTabs({
    regions,
    selected,
    onSelect,
}: {
    regions: MasteryRegionView[];
    selected: string | null;
    onSelect: (region: string) => void;
}) {
    return (
        <div className="-mx-4 overflow-x-auto px-4 pb-1 scrollbar-hide lg:mx-0 lg:px-0">
            <div className="flex gap-3" role="group" aria-label="Region">
                {regions.map((region) => (
                    <RegionCard
                        key={region.region}
                        region={region}
                        on={region.region === selected}
                        onSelect={() => onSelect(region.region)}
                    />
                ))}
            </div>
        </div>
    );
}

function RegionCard({ region, on, onSelect }: { region: MasteryRegionView; on: boolean; onSelect: () => void }) {
    const tone = regionTone(region.region);

    /*
     * The first track that has one. Deliberately the first in catalogue order
     * rather than a favourite — a region's identity should not move about
     * because the account trained something.
     */
    const art = region.tracks.find((track) => track.background)?.background ?? null;
    const emblem = region.tracks.find((track) => track.tier_icons?.length)?.tier_icons[0] ?? null;

    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={on}
            className="relative flex w-[212px] shrink-0 flex-col gap-3 overflow-hidden rounded-[var(--radius-panel)] border p-4 text-left transition-colors"
            style={{
                background: on ? `color-mix(in srgb, ${tone} 10%, var(--surface-1))` : "var(--surface-1)",
                /*
                 * The expansion's own colour. Seven regions in one accent read
                 * as one long list; in seven hues they read as seven places,
                 * which is what they are — points do not move between them.
                 */
                borderColor: on
                    ? `color-mix(in srgb, ${tone} 75%, transparent)`
                    : `color-mix(in srgb, ${tone} 22%, var(--line-strong))`,
                boxShadow: on ? `0 0 26px -6px color-mix(in srgb, ${tone} 55%, transparent)` : undefined,
            }}
        >
            {/* A track's scene render, borrowed as the region's. The API has no
                art for a region — this is the nearest honest thing. */}
            {art && (
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                        backgroundImage: `linear-gradient(to top, var(--surface-1) 40%, transparent), url(${art})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        opacity: on ? 0.5 : 0.3,
                    }}
                />
            )}

            <div className="relative flex items-center gap-3">
                {emblem ? (
                    <GameIcon src={emblem} alt="" size="md" tone={tone} />
                ) : (
                    <span aria-hidden style={{ color: tone }}>
                        <Sparkles size={22} />
                    </span>
                )}
                <span className="text-[13px] font-medium leading-tight text-[var(--ink-hi)]">{region.region}</span>
            </div>

            <div className="relative">
                <div className="font-display text-[26px] font-bold leading-none text-[var(--ink-hi)]">{region.percent}%</div>
                <div className="mt-2">
                    <Meter value={region.points_spent} max={region.points_total} size="sm" tone={tone} />
                </div>
                <div className="mt-1.5 flex justify-between gap-2 font-numeric text-[11px] text-[var(--ink-low)]">
                    <span>
                        {region.points_spent} / {region.points_total} points
                    </span>
                    {region.unspent > 0 && <span style={{ color: tone }}>{region.unspent} to spend</span>}
                </div>
            </div>
        </button>
    );
}

const REACH: Record<"close" | "walk" | "far", { label: string; colour: string }> = {
    close: { label: "Beside a waypoint", colour: "var(--success)" },
    walk: { label: "A short walk", colour: "var(--warning)" },
    far: { label: "A long walk", colour: "var(--accent-ink)" },
};

function BestPoints({ region, known }: { region: MasteryRegionView; known: boolean }) {
    const tone = regionTone(region.region);
    const masteryTone = DOMAIN_TONE.masteries;

    const description =
        region.points_needed === 0
            ? `Every tier in ${region.region} is already paid for — another point here would sit unspent.`
            : `${region.points_needed} more points would buy everything in ${region.region}. Closest first: achievements a step from done, then insights nearest a waypoint.`;

    return (
        <section className="space-y-4">
            <SectionHeader icon={<Compass size={18} />} tone={tone} title="Best mastery points for you" description={description} />

            {region.points_needed === 0 ? null : region.points_to_get.length === 0 ? (
                <p className="rounded-[var(--radius-panel)] border px-5 py-4 text-sm text-[var(--ink-low)]" style={{ borderColor: "var(--line)" }}>
                    {known
                        ? `Nothing in ${region.region} is close enough to name. Its other points come from achievements further from done, and from story.`
                        : "Your key does not share which insights you have — that needs the progression permission — so none can be called missing."}
                </p>
            ) : (
                <ol className="space-y-2.5">
                    {region.points_to_get.map((point, i) => (
                        <li
                            key={`${point.kind}-${point.id}`}
                            className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[var(--radius-panel)] border p-3 sm:flex-nowrap"
                            style={{
                                background: "var(--surface-1)",
                                borderColor: `color-mix(in srgb, ${tone} ${i === 0 ? "40%" : "16%"}, var(--line-strong))`,
                            }}
                        >
                            <span className="w-6 shrink-0 text-center font-display text-2xl font-bold" style={{ color: tone }}>
                                {i + 1}
                            </span>

                            <PointPicture point={point} tone={tone} />

                            <div className="min-w-0 flex-1 basis-48">
                                <PointText point={point} />
                            </div>

                            <div className="flex shrink-0 items-center gap-4">
                                {point.kind === "insight" ? (
                                    point.reach && (
                                        <span
                                            className="rounded-full border px-2.5 py-0.5 text-[11px]"
                                            style={{
                                                color: REACH[point.reach].colour,
                                                borderColor: `color-mix(in srgb, ${REACH[point.reach].colour} 50%, transparent)`,
                                            }}
                                            title="A straight line from the nearest waypoint — climbs, canopies and jumping puzzles are not counted."
                                        >
                                            {REACH[point.reach].label}
                                        </span>
                                    )
                                ) : (
                                    <span className="rounded-full border px-2.5 py-0.5 text-[11px] text-[var(--ink-mid)]" style={{ borderColor: "var(--line-strong)" }}>
                                        {point.remaining === 1 ? "1 step left" : `${point.remaining} steps left`}
                                    </span>
                                )}

                                <div className="w-[118px] text-right">
                                    <div className="inline-flex items-center gap-1 text-xs" style={{ color: masteryTone }}>
                                        <Sparkles size={12} aria-hidden />
                                        +1 mastery point
                                    </div>
                                    <div className="text-[11px] text-[var(--ink-faint)]">
                                        {point.kind === "achievement" && point.points ? `and ${point.points} AP` : point.kind === "insight" ? "Mastery insight" : "Achievement"}
                                    </div>
                                </div>

                                {point.kind === "insight" ? (
                                    point.chat_link && <ChatCode code={point.chat_link} label={point.waypoint} />
                                ) : (
                                    <WikiLink wiki={point.wiki} name={point.name} compact />
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}

function PointPicture({ point, tone }: { point: PointToGet; tone: string }) {
    if (point.kind === "insight") {
        return point.coord ? (
            <TileThumb coord={point.coord} size={64} />
        ) : (
            <span aria-hidden className="flex h-16 w-16 shrink-0 items-center justify-center" style={{ color: tone }}>
                <MapPin size={20} />
            </span>
        );
    }

    return point.icon ? (
        <GameIcon src={point.icon} alt="" size="xl" tone={tone} />
    ) : (
        <span aria-hidden className="flex h-16 w-16 shrink-0 items-center justify-center" style={{ color: tone }}>
            <Award size={20} />
        </span>
    );
}

function PointText({ point }: { point: PointToGet }) {
    if (point.kind === "insight") {
        return (
            <>
                <Link
                    href={insightHref(point.map_id, point.map_slug)}
                    className="block truncate text-sm font-medium text-[var(--ink-hi)] hover:text-[var(--accent-ink)]"
                >
                    Mastery insight in {point.map}
                </Link>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-[var(--ink-low)]">
                    <MapPin size={11} className="shrink-0" aria-hidden />
                    {point.waypoint ? `Nearest waypoint: ${point.waypoint}` : "No waypoint on this map"}
                </p>
            </>
        );
    }

    return (
        <>
            <p className="truncate text-sm font-medium text-[var(--ink-hi)]">{point.name ?? `Achievement #${point.id}`}</p>
            {point.next_step && <p className="mt-0.5 line-clamp-2 text-xs text-[var(--ink-low)]">{point.next_step}</p>}
            <p className="mt-0.5 font-numeric text-[11px] text-[var(--ink-faint)]">
                {point.current} / {point.max}
            </p>
        </>
    );
}

/**
 * In the mockup's "Currently Training" slot, because the API does not say
 * which track is being trained or how much experience it has. What it does say
 * is which tier the region's spare points can buy, and that is the next thing
 * to do with them.
 */
function NextTier({ region }: { region: MasteryRegionView }) {
    const tone = regionTone(region.region);
    const open = region.tracks.filter((t) => !t.finished && t.next_cost !== null);
    const affordable = open.filter((t) => t.affordable).sort((a, b) => (a.next_cost ?? 0) - (b.next_cost ?? 0));
    const cheapest = [...open].sort((a, b) => (a.next_cost ?? 0) - (b.next_cost ?? 0))[0];
    const track: MasteryTrackView | undefined = affordable[0] ?? cheapest;

    return (
        <Gw2Panel icon={<Sparkles size={18} />} tone={tone} title="Next tier your points buy" description={region.region}>
            {!track ? (
                <p className="text-sm text-[var(--ink-low)]">Every track in {region.region} is finished.</p>
            ) : (
                <div className="space-y-3">
                    <div
                        className="relative flex items-center gap-3 overflow-hidden rounded-[var(--radius-card)] border p-3"
                        style={{ borderColor: "var(--line)", background: "var(--surface-2)" }}
                    >
                        {track.background && (
                            <span
                                aria-hidden
                                className="pointer-events-none absolute inset-0"
                                style={{
                                    backgroundImage: `linear-gradient(to right, var(--surface-2) 35%, transparent), url(${track.background})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    opacity: 0.55,
                                }}
                            />
                        )}
                        <GameIcon
                            src={track.tier_icons?.[Math.min(track.tiers_paid, (track.tier_icons?.length ?? 1) - 1)]}
                            alt=""
                            size="lg"
                            tone={tone}
                            className="relative"
                        />
                        <div className="relative min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="truncate text-sm font-medium text-[var(--ink-hi)]">{track.name}</span>
                                <WikiLink wiki={track.wiki} name={track.name} compact />
                            </div>
                            <p className="truncate text-[11px] text-[var(--ink-low)]">
                                Tier {track.tiers_paid + 1} of {track.tiers}
                                {track.next_tier ? `: ${track.next_tier}` : ""}
                            </p>
                        </div>
                    </div>

                    <Meter value={track.tiers_paid} max={track.tiers} size="sm" tone={tone} />

                    <p className="text-xs" style={{ color: track.affordable ? tone : "var(--ink-mid)" }}>
                        {track.affordable
                            ? `Costs ${track.next_cost} of your ${region.unspent} unspent points — within reach now.`
                            : `Costs ${track.next_cost}; you have ${region.unspent} unspent, so ${
                                  (track.next_cost ?? 0) - region.unspent
                              } more to go.`}
                    </p>

                    <p className="text-[11px] text-[var(--ink-faint)]">
                        Points buy the tier; the experience to train it is earned in game, and the API does not say how
                        much you have.
                    </p>
                </div>
            )}
        </Gw2Panel>
    );
}

function ZonesPanel({ region, known }: { region: MasteryRegionView; known: boolean }) {
    const tone = regionTone(region.region);

    return (
        <Gw2Panel
            icon={<MapPin size={18} />}
            tone={tone}
            title={`${region.region} zones`}
            description={
                known
                    ? "Every insight on the game's own map, in colour where you still need it."
                    : "Every insight on the game's own map. Which you have needs the progression permission."
            }
        >
            {region.zones.length === 0 ? (
                <p className="text-sm text-[var(--ink-low)]">
                    No mastery insights on the map here — this region&apos;s points come from achievements and story.
                </p>
            ) : (
                <div className="space-y-3">
                    <ZoneMap maps={region.zones} tone={tone} label={region.region} />

                    <ul className="space-y-1.5">
                        {region.zones.map((zone) => (
                            <li key={zone.id} className="flex items-center justify-between gap-3 text-xs">
                                <Link
                                    href={insightHref(zone.id, zone.slug)}
                                    className="truncate text-[var(--ink-mid)] hover:text-[var(--accent-ink)]"
                                >
                                    {zone.name}
                                </Link>
                                <span className="shrink-0 font-numeric text-[var(--ink-low)]">
                                    {zone.collected === null ? (
                                        `${zone.total} insights`
                                    ) : zone.collected === zone.total ? (
                                        <span className="inline-flex items-center gap-1">
                                            <Check size={12} aria-hidden /> all {zone.total}
                                        </span>
                                    ) : (
                                        <>
                                            {zone.collected} / {zone.total}
                                            <span className="ml-2" style={{ color: tone }}>
                                                {Math.round((zone.collected / zone.total) * 100)}%
                                            </span>
                                        </>
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </Gw2Panel>
    );
}

function RegionTracks({ region }: { region: MasteryRegionView }) {
    const affordable = region.tracks.filter((t) => t.affordable).length;
    const tone = regionTone(region.region);

    return (
        <Gw2Panel
            icon={<Layers size={18} />}
            tone={tone}
            title={`Tracks in ${region.region}`}
            description={region.unspent > 0 ? `${region.unspent} unspent · ${affordable} within reach` : "Nothing to spend here"}
        >
            <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
                {region.tracks.map((track) => (
                    <TrackRow key={track.id} track={track} tone={tone} />
                ))}
            </ul>
        </Gw2Panel>
    );
}

function TrackRow({ track, tone }: { track: MasteryTrackView; tone: string }) {
    return (
        <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0">
            {/*
             * The tier being bought, pictured — or the first one on a track
             * that is finished, so a completed row still shows what it was.
             */}
            <GameIcon
                src={track.tier_icons?.[Math.min(track.tiers_paid, (track.tier_icons?.length ?? 1) - 1)]}
                alt=""
                size="lg"
                tone={tone}
                dim={track.finished}
            />

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    {track.finished && <Check size={14} className="shrink-0 text-[var(--ink-low)]" aria-hidden />}
                    <span className="truncate text-sm text-[var(--ink-hi)]">{track.name}</span>
                    <WikiLink wiki={track.wiki} name={track.name} compact />
                </div>
                {track.next_tier && (
                    <p className="truncate text-[11px] text-[var(--ink-faint)]">
                        {/*
                         * The tier being bought, which is one past the last one
                         * paid for. Counting the paid ones would read "tier 0 of
                         * 4" for a track nobody has started.
                         */}
                        Next: {track.next_tier} — tier {track.tiers_paid + 1} of {track.tiers}
                    </p>
                )}
            </div>

            <div className="w-28 shrink-0">
                <Meter value={track.tiers_paid} max={track.tiers} segmentLimit={12} size="sm" tone={tone} />
            </div>

            <div className="w-24 shrink-0 text-right">
                {track.finished ? (
                    <span className="text-[11px] text-[var(--ink-faint)]">done</span>
                ) : (
                    <span
                        className="inline-flex items-center gap-1 font-numeric text-xs"
                        style={{ color: track.affordable ? tone : "var(--ink-low)" }}
                    >
                        <CircleDollarSign size={12} aria-hidden />
                        {track.next_cost}
                        {track.affordable && <span className="text-[10px] uppercase">now</span>}
                    </span>
                )}
            </div>
        </li>
    );
}

/**
 * The row along the foot of mockup 3: achievements closest to done, each with
 * what finishing pays — points from the catalogue's tiers, a mastery point
 * where the rewards name a region.
 */
function EasyWinsRow({ wins }: { wins: NearlyDone[] }) {
    const tone = DOMAIN_TONE.achievements;

    return (
        <section className="space-y-4">
            <SectionHeader
                icon={<Zap size={18} />}
                tone={tone}
                title="Easy wins today"
                description="The achievements closest to finishing, and what finishing pays."
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                {wins.map((win) => (
                    <article
                        key={win.id}
                        className="flex flex-col gap-3 rounded-[var(--radius-panel)] border p-4"
                        style={{
                            background: "var(--surface-1)",
                            borderColor: `color-mix(in srgb, ${tone} 22%, var(--line-strong))`,
                        }}
                    >
                        <div className="flex items-start gap-3">
                            {win.icon ? (
                                <GameIcon src={win.icon} alt="" size="md" tone={tone} />
                            ) : (
                                <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center" style={{ color: tone }}>
                                    <Award size={18} />
                                </span>
                            )}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-start gap-1">
                                    <h3 className="line-clamp-2 text-sm font-medium leading-snug text-[var(--ink-hi)]">
                                        {win.name ?? `#${win.id}`}
                                    </h3>
                                    <WikiLink wiki={win.wiki} name={win.name} compact className="mt-0.5" />
                                </div>
                                <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--ink-low)]">
                                    {win.steps_remaining[0] ?? win.requirement ?? ""}
                                </p>
                            </div>
                        </div>

                        <div className="mt-auto space-y-1.5">
                            <div className="font-numeric text-xs text-[var(--ink-mid)]">
                                {win.current} / {win.max}
                            </div>
                            <Meter value={win.current} max={win.max} size="sm" tone={tone} />
                        </div>

                        {(win.points || win.mastery_region) && (
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                                {win.points ? (
                                    <span className="inline-flex items-center gap-1" style={{ color: tone }}>
                                        <Award size={12} aria-hidden />+{win.points} AP
                                    </span>
                                ) : null}
                                {win.mastery_region && (
                                    <span
                                        className="inline-flex items-center gap-1"
                                        style={{ color: DOMAIN_TONE.masteries }}
                                        title={win.mastery_region}
                                    >
                                        <Sparkles size={12} aria-hidden />
                                        +1 mastery point
                                    </span>
                                )}
                            </div>
                        )}
                    </article>
                ))}
            </div>
        </section>
    );
}
