"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, CircleDollarSign, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Panel from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import Meter from "@/components/ui/Meter";
import Chip from "@/components/ui/Chip";
import { Skeleton } from "@/components/ui/Skeleton";
import {
    getMasteries,
    type Gw2Masteries,
    type MasteryRegionView,
    type MasteryTrackView,
} from "@/lib/gw2";

/**
 * Masteries, region by region.
 *
 * The mockup's headline figure — "Heart of Thorns 73% · 186 / 254 Mastery
 * Points" — is drawn here for real. The denominator is summed from every tier's
 * point cost in our mirror of the game catalogue, and it reconciles against what
 * the account itself reports as spent. That reconciliation is a test, because
 * two things about this API are undocumented and silent when wrong: the two
 * endpoints use different names for the same region, and the `level` field counts
 * from zero.
 *
 * Three things the mockup draws that are not here, because nothing computes
 * them: a "Currently Training" panel, which the API does not expose; "Nearby
 * Priorities" with distances in metres, which would need the player's live
 * position; and a Weekly Completion Score.
 */
export default function MasteriesClient() {
    const { user, isLoading: authLoading } = useAuth();

    const [data, setData] = useState<Gw2Masteries | null>(null);
    const [state, setState] = useState<"loading" | "none" | "ready" | "error">("loading");

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
                        We could not load your masteries. This is a problem reaching our own server, not
                        your data.
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

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                {data.regions.map((region) => (
                    <RegionCard key={region.region} region={region} />
                ))}
            </div>

            <div className="space-y-5">
                {data.regions.map((region) => (
                    <RegionTracks key={region.region} region={region} />
                ))}
            </div>

            {data.unpaired.length > 0 && (
                <Panel material="matte" title="Tracks we cannot place yet">
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <Info size={16} className="mt-0.5 shrink-0 text-[var(--ink-low)]" aria-hidden />
                            <p className="text-sm text-[var(--ink-mid)]">
                                Guild Wars 2 names regions differently in its two endpoints — the catalogue
                                says <em>Maguuma</em> where your account says <em>Heart of Thorns</em> — and
                                these tracks belong to a region with no counterpart at all. We would rather
                                show them apart than file your points under a guessed expansion.
                            </p>
                        </div>
                        <ul className="flex flex-wrap gap-2">
                            {data.unpaired.map((track) => (
                                <li key={track.id}>
                                    <Chip variant="neutral" size="sm">
                                        {track.name} · {track.points_total} points
                                    </Chip>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Panel>
            )}
        </div>
    );
}

function ConnectFirst() {
    return (
        <Panel material="lit" crown title="Connect your account first">
            <div className="space-y-4">
                <p className="text-sm text-[var(--ink-mid)]">
                    Mastery progress is read from your own Guild Wars 2 account.
                </p>
                <Button asChild>
                    <Link href="/gw2">Go to the advisor</Link>
                </Button>
            </div>
        </Panel>
    );
}

function RegionCard({ region }: { region: MasteryRegionView }) {
    return (
        <div
            className="flex flex-col gap-3 rounded-[var(--radius-card)] border p-4"
            style={{
                background: "var(--surface-2)",
                borderColor:
                    region.unspent > 0
                        ? "color-mix(in srgb, var(--accent) 30%, transparent)"
                        : "var(--line-strong)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
        >
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--ink-low)]">
                {region.region}
            </span>

            <div>
                <div className="font-numeric text-2xl leading-none text-[var(--ink-hi)]">
                    {region.percent}%
                </div>
                <div className="mt-1.5 font-numeric text-xs text-[var(--ink-low)]">
                    {region.points_spent} / {region.points_total} points
                </div>
            </div>

            <Meter value={region.points_spent} max={region.points_total} size="sm" />

            {region.unspent > 0 && (
                <p className="text-[11px] text-[var(--accent-ink)]">{region.unspent} to spend</p>
            )}
        </div>
    );
}

function RegionTracks({ region }: { region: MasteryRegionView }) {
    const affordable = region.tracks.filter((t) => t.affordable).length;

    return (
        <Panel
            material="matte"
            title={region.region}
            meta={
                <span className="text-xs text-[var(--ink-faint)]">
                    {region.unspent > 0
                        ? `${region.unspent} unspent · ${affordable} within reach`
                        : "nothing to spend here"}
                </span>
            }
        >
            <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
                {region.tracks.map((track) => (
                    <TrackRow key={track.id} track={track} />
                ))}
            </ul>
        </Panel>
    );
}

function TrackRow({ track }: { track: MasteryTrackView }) {
    return (
        <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    {track.finished && (
                        <Check size={14} className="shrink-0 text-[var(--ink-low)]" aria-hidden />
                    )}
                    <span className="truncate text-sm text-[var(--ink-hi)]">{track.name}</span>
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
                <Meter value={track.tiers_paid} max={track.tiers} segmentLimit={12} size="sm" />
            </div>

            <div className="w-24 shrink-0 text-right">
                {track.finished ? (
                    <span className="text-[11px] text-[var(--ink-faint)]">done</span>
                ) : (
                    <span
                        className="inline-flex items-center gap-1 font-numeric text-xs"
                        style={{ color: track.affordable ? "var(--accent-ink)" : "var(--ink-low)" }}
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
