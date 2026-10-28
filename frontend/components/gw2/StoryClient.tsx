"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Panel from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import Meter from "@/components/ui/Meter";
import Select from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { ActionLink, Gw2Panel, SectionHeader } from "@/components/gw2/Gw2Ui";
import { Gw2Card, PageSummary, SummaryFact } from "@/components/gw2/Gw2PageParts";
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
 *
 * A summary across the top, each season its own card, and down the right an
 * index of seasons and the reason the page says "detected". The story colour
 * is in the bars and nowhere else.
 */

const STORY = DOMAIN_TONE.story;

export default function StoryClient() {
    const { user, isLoading: authLoading } = useAuth();

    const [data, setData] = useState<Gw2Story | null>(null);
    const [state, setState] = useState<"loading" | "none" | "ready" | "error">("loading");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async (character?: string | null) => {
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

    // Dimmed from the click, not from inside the read: the effect's first read
    // should set nothing before it has an answer.
    function choose(character?: string | null) {
        setBusy(true);
        void load(character);
    }

    if (!authLoading && !user) return <ConnectFirst signedOut />;
    if (authLoading || state === "loading") return <Skeleton className="h-96 w-full" />;

    if (state === "error") {
        return (
            <Panel material="matte">
                <div className="space-y-3">
                    <p className="text-sm text-[var(--ink-mid)]">{error}</p>
                    <Button variant="secondary" onClick={() => choose(data?.character)}>
                        Try again
                    </Button>
                </div>
            </Panel>
        );
    }

    if (state === "none" || !data) return <ConnectFirst />;

    const current = data.characters.find((c) => c.name === data.character);
    const who = [current?.race ?? data.race, current?.profession, current ? `level ${current.level}` : null]
        .filter(Boolean)
        .join(", ");

    // Counts of what was read, not estimates: a chapter or season is in here
    // when at least one of its steps was seen on this character.
    const chaptersStarted = data.seasons.reduce((n, s) => n + s.stories.filter((st) => st.steps_seen > 0).length, 0);
    const seasonsStarted = data.seasons.filter((s) => s.steps_seen > 0).length;

    return (
        <div className="space-y-6">
            <CharacterBar data={data} busy={busy} onChoose={(name) => choose(name)} />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div
                    className="min-w-0 space-y-6"
                    style={{ opacity: busy ? 0.6 : 1, transition: "opacity 200ms" }}
                    aria-busy={busy}
                >
                    <PageSummary
                        title={data.known ? `Story detected on ${data.character}` : `Nothing read for ${data.character} yet`}
                        description={who || undefined}
                    >
                        {data.known ? (
                            <dl className="grid gap-4 sm:grid-cols-3">
                                {typeof data.steps_seen === "number" && (
                                    <SummaryFact value={String(data.steps_seen)} label="story steps detected" />
                                )}
                                <SummaryFact value={String(chaptersStarted)} label="chapters with a step detected" />
                                <SummaryFact value={String(seasonsStarted)} label="seasons with a step detected" />
                            </dl>
                        ) : (
                            <div className="space-y-4 text-sm text-[var(--ink-mid)]">
                                <p>
                                    Story is read once per character on a full read, and only with the{" "}
                                    <strong className="text-[var(--ink-hi)]">characters</strong> permission on your
                                    key. If your key has it, a full read from the advisor will fill this in.
                                </p>
                                <ActionLink href="/gw2" className="sm:w-auto">
                                    Back to the advisor
                                </ActionLink>
                            </div>
                        )}
                    </PageSummary>

                    {data.known && <Seasons seasons={data.seasons} />}
                </div>

                <div className="space-y-5">
                    {data.known && data.seasons.length > 0 && <SeasonIndex seasons={data.seasons} />}

                    <Gw2Panel title="Why it says “detected”">
                        <p className="text-sm text-[var(--ink-mid)]">{data.note}</p>
                    </Gw2Panel>
                </div>
            </div>
        </div>
    );
}

function CharacterBar({
    data,
    busy,
    onChoose,
}: {
    data: Gw2Story;
    busy: boolean;
    onChoose: (name: string) => void;
}) {
    return (
        <div className="min-w-0">
            <span className="mb-1.5 block text-xs font-medium text-[var(--ink-low)]">Character</span>

            {data.characters.length > 1 ? (
                <Select
                    value={data.character}
                    onChange={onChoose}
                    ariaLabel="Character to show story for"
                    disabled={busy}
                    className="h-10 w-80 max-w-full px-3 text-sm"
                    options={data.characters.map((c) => ({
                        value: c.name,
                        label: `${c.name} — ${[c.race, c.profession, `level ${c.level}`].filter(Boolean).join(", ")}`,
                    }))}
                />
            ) : (
                <span className="text-sm text-[var(--ink-hi)]">{data.character}</span>
            )}
        </div>
    );
}

/**
 * Every season as its own card, in the order the game tells them.
 *
 * The anchor is the season's place in the list rather than its `order`, which
 * the catalogue does not promise is unique.
 */
function Seasons({ seasons }: { seasons: Gw2StorySeason[] }) {
    return (
        <section className="space-y-4">
            <SectionHeader
                title="Chapters by season"
                description="Steps detected per chapter. A season that branches has no total to measure against."
            />

            <ul className="grid gap-4 lg:grid-cols-2">
                {seasons.map((season, i) => (
                    <li key={`${season.order}-${season.name}`} id={`season-${i}`} className="scroll-mt-24">
                        <SeasonCard season={season} />
                    </li>
                ))}
            </ul>
        </section>
    );
}

function SeasonCard({ season }: { season: Gw2StorySeason }) {
    const counted = season.steps_total !== null;

    return (
        <Gw2Card className="h-full space-y-3">
            <div className="flex items-baseline justify-between gap-3">
                <h3 className="min-w-0 font-display text-[16px] font-semibold leading-snug text-[var(--ink-hi)]">
                    {season.name}
                </h3>
                <span className="shrink-0 font-numeric text-xs text-[var(--ink-mid)]">
                    {counted ? `${season.steps_seen} / ${season.steps_total}` : `${season.steps_seen} steps seen`}
                </span>
            </div>

            {counted && (season.steps_total ?? 0) > 0 && (
                <Meter value={season.steps_seen} max={season.steps_total ?? 0} tone={STORY} />
            )}

            {season.branches && (
                <p className="text-[11px] text-[var(--ink-faint)]">
                    This one branches — by race, and by choices made when the character was created — and the game
                    does not say which branch was taken, so there is no honest total to show.
                </p>
            )}

            <ul className="space-y-2.5 border-t pt-3" style={{ borderColor: "var(--line)" }}>
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
                                <Meter value={story.steps_seen} max={story.steps_total} size="sm" tone={STORY} />
                            )}
                        </li>
                    );
                })}
            </ul>
        </Gw2Card>
    );
}

/** The seasons in one column, each a jump to its card — the page is long. */
function SeasonIndex({ seasons }: { seasons: Gw2StorySeason[] }) {
    return (
        <Gw2Panel title="Seasons at a glance" description="Jump to one">
            <ul className="space-y-3">
                {seasons.map((season, i) => {
                    const counted = season.steps_total !== null && season.steps_total > 0;

                    return (
                        <li key={`${season.order}-${season.name}`}>
                            <a href={`#season-${i}`} className="group block space-y-1">
                                <span className="flex items-baseline justify-between gap-3">
                                    <span
                                        className="min-w-0 truncate text-[13px] group-hover:text-[var(--accent-ink)]"
                                        style={{ color: season.steps_seen > 0 ? "var(--ink-hi)" : "var(--ink-low)" }}
                                    >
                                        {season.name}
                                    </span>
                                    <span className="shrink-0 font-numeric text-[11px] text-[var(--ink-low)]">
                                        {counted ? `${season.steps_seen} / ${season.steps_total}` : `${season.steps_seen} seen`}
                                    </span>
                                </span>
                                {counted && (
                                    <Meter value={season.steps_seen} max={season.steps_total ?? 0} size="sm" tone={STORY} />
                                )}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </Gw2Panel>
    );
}

function ConnectFirst({ signedOut = false }: { signedOut?: boolean }) {
    return (
        <Gw2Panel title={signedOut ? "Sign in first" : "Connect your account first"}>
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
        </Gw2Panel>
    );
}
