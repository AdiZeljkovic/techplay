"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Info, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Panel from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import Meter from "@/components/ui/Meter";
import Select from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { DOMAIN_TONE } from "@/lib/gw2domain";
import { getStory, gw2Error, type Gw2Story, type Gw2StorySeason } from "@/lib/gw2";

/**
 * Story detected on one character.
 *
 * §16 of the working document is the most cautious section in it, and this page
 * keeps its language: per character, "detected", never "complete". The game
 * records quests per character, a player may well have done a chapter on another
 * one, and the quest data is documented as able to lag behind what was played.
 *
 * Two numbers are deliberately missing rather than wrong. A chapter only some
 * races get is shown with its races, never counted against a character who can
 * never reach it; and a season that branches — by race, by order, by the
 * biography picked at creation, none of which the API exposes — carries no
 * denominator at all. "49 steps seen" is honest. "49 of 137" would read as a
 * third done for somebody who may have finished.
 */
export default function StoryClient() {
    const { user, isLoading: authLoading } = useAuth();

    const [data, setData] = useState<Gw2Story | null>(null);
    const [state, setState] = useState<"loading" | "none" | "ready" | "error">("loading");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async (character?: string | null) => {
        setBusy(true);

        try {
            const payload = await getStory(character);

            setData(payload);
            setState(payload ? "ready" : "none");
        } catch (e: unknown) {
            const status = (e as { response?: { status?: number } }).response?.status;

            if (status === 404 && !character) {
                setState("none");
            } else {
                setError(gw2Error(e, "We could not load this. It is a problem reaching our own server."));
                setState("error");
            }
        } finally {
            setBusy(false);
        }
    }, []);

    useEffect(() => {
        if (authLoading || !user) return;

        void load();
    }, [authLoading, user, load]);

    if (!authLoading && !user) return <ConnectFirst signedOut />;
    if (authLoading || state === "loading") return <Skeleton className="h-96 w-full" />;

    if (state === "error") {
        return (
            <Panel material="matte">
                <div className="space-y-3">
                    <p className="text-sm text-[var(--ink-mid)]">{error}</p>
                    <Button variant="secondary" onClick={() => void load(data?.character)}>
                        Try again
                    </Button>
                </div>
            </Panel>
        );
    }

    if (state === "none" || !data) return <ConnectFirst />;

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--ink-faint)]">
                    <UserRound size={12} aria-hidden />
                    Character
                </span>

                {data.characters.length > 1 ? (
                    <Select
                        value={data.character}
                        onChange={(name) => void load(name)}
                        ariaLabel="Character to show story for"
                        disabled={busy}
                        className="h-9 min-w-[220px] px-3 text-[13px]"
                        options={data.characters.map((c) => ({
                            value: c.name,
                            label: `${c.name} — ${[c.race, c.profession, `level ${c.level}`].filter(Boolean).join(", ")}`,
                        }))}
                    />
                ) : (
                    <span className="text-[var(--ink-hi)]">{data.character}</span>
                )}
            </div>

            <Panel material="instrument">
                <div className="flex gap-3">
                    <Info size={16} className="mt-0.5 shrink-0 text-[var(--ink-low)]" aria-hidden />
                    <div className="space-y-1 text-sm text-[var(--ink-mid)]">
                        {data.known && typeof data.steps_seen === "number" && (
                            <p>
                                <strong className="text-[var(--ink-hi)]">{data.steps_seen}</strong> story steps
                                detected on {data.character}.
                            </p>
                        )}
                        <p>{data.note}</p>
                    </div>
                </div>
            </Panel>

            {!data.known ? (
                <Panel material="matte">
                    <div className="space-y-3 text-sm text-[var(--ink-mid)]">
                        <p>
                            Story is read once per character on a full read, and only with the{" "}
                            <strong className="text-[var(--ink-hi)]">characters</strong> permission on your key.
                            If your key has it, a full read from the advisor will fill this in.
                        </p>
                        <Button variant="secondary" size="sm" asChild>
                            <Link href="/gw2">Back to the advisor</Link>
                        </Button>
                    </div>
                </Panel>
            ) : (
                <div className={busy ? "space-y-5 opacity-60 transition-opacity" : "space-y-5 transition-opacity"}>
                    {data.seasons.map((season) => (
                        <Season key={`${season.order}-${season.name}`} season={season} />
                    ))}
                </div>
            )}
        </div>
    );
}

function Season({ season }: { season: Gw2StorySeason }) {
    const counted = season.steps_total !== null;

    return (
        <Panel
            material="matte"
            title={season.name}
            meta={
                <span className="font-numeric text-xs text-[var(--ink-faint)]">
                    {counted ? `${season.steps_seen} / ${season.steps_total}` : `${season.steps_seen} steps seen`}
                </span>
            }
        >
            <div className="space-y-3">
                {season.branches && (
                    <p className="text-[11px] text-[var(--ink-faint)]">
                        This one branches — by race, and by choices made when the character was created — and the
                        game does not say which branch was taken, so there is no honest total to show.
                    </p>
                )}

                <ul className="space-y-2.5">
                    {season.stories.map((story) => {
                        const started = story.steps_seen > 0;

                        return (
                            <li key={story.id} className="space-y-1">
                                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                                    <span
                                        className="min-w-0 truncate text-sm"
                                        style={{ color: started ? "var(--ink-hi)" : "var(--ink-low)" }}
                                    >
                                        {story.name}
                                        {story.races.length > 0 && (
                                            <span className="ml-2 text-[11px] text-[var(--ink-faint)]">
                                                {story.races.join(", ")} only
                                            </span>
                                        )}
                                    </span>
                                    <span className="shrink-0 font-numeric text-xs text-[var(--ink-low)]">
                                        {counted && story.steps_total > 0
                                            ? `${story.steps_seen} / ${story.steps_total}`
                                            : `${story.steps_seen} seen`}
                                    </span>
                                </div>
                                {counted && story.steps_total > 0 && (
                                    <Meter
                                        value={story.steps_seen}
                                        max={story.steps_total}
                                        size="sm"
                                        tone={DOMAIN_TONE.story}
                                    />
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
        </Panel>
    );
}

function ConnectFirst({ signedOut = false }: { signedOut?: boolean }) {
    return (
        <Panel material="lit" crown title={signedOut ? "Sign in first" : "Connect your account first"}>
            <div className="space-y-4">
                <p className="text-sm text-[var(--ink-mid)]">
                    Story progress is read from your own Guild Wars 2 account, one character at a time.
                </p>
                <Button asChild>
                    <Link href={signedOut ? "/login?redirect=/gw2/story" : "/gw2"}>
                        {signedOut ? "Sign in" : "Go to the advisor"}
                    </Link>
                </Button>
            </div>
        </Panel>
    );
}
