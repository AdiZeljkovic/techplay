"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, BookOpen, CheckCircle2, ChevronDown, Crown, Layers, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Panel from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import Meter from "@/components/ui/Meter";
import { Skeleton } from "@/components/ui/Skeleton";
import GameIcon from "@/components/gw2/GameIcon";
import WikiLink from "@/components/gw2/WikiLink";
import { Gw2Panel, SectionHeader } from "@/components/gw2/Gw2Ui";
import { PageSummary, SummaryFact, ToneCard } from "@/components/gw2/Gw2PageParts";
import { DOMAIN_TONE, regionTone } from "@/lib/gw2domain";
import { getAchievements, type Gw2AchievementGroup, type Gw2Achievements, type Gw2TitleWithinReach, type NearlyDone } from "@/lib/gw2";

/**
 * The achievements page.
 *
 * The mockup's menu has it and its pictures never drew it, so the shape is the
 * game's own panel — groups, then categories — because that is the map a
 * player already carries. What the game's panel does not do, and this does:
 * add the points up (the API has no total), put what is nearly done first, and
 * remember what was finished between two of our reads.
 *
 * Mockup 1's "48% complete" is not here. A share of every achievement in the
 * game counts dailies, festivals out of season and achievements nobody can
 * see yet, and the number it gives is nobody's progress.
 */

const TONE = DOMAIN_TONE.achievements;

export default function AchievementsClient() {
    const { user, isLoading: authLoading } = useAuth();

    const [data, setData] = useState<Gw2Achievements | null>(null);
    const [state, setState] = useState<"loading" | "none" | "ready" | "error">("loading");
    // Bumped by "Try again"; the read itself lives in the effect.
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (authLoading || !user) return;

        let cancelled = false;

        getAchievements()
            .then((payload) => {
                if (cancelled) return;
                setData(payload);
                setState(payload ? "ready" : "none");
            })
            .catch((e: unknown) => {
                if (cancelled) return;
                const status = (e as { response?: { status?: number } }).response?.status;

                setState(status === 404 ? "none" : "error");
            });

        return () => {
            cancelled = true;
        };
    }, [authLoading, user, attempt]);

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
                        We could not load your achievements. This is a problem reaching our own server, not your data.
                    </p>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setState("loading");
                            setAttempt((n) => n + 1);
                        }}
                    >
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
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-8">
                <Summary data={data} />
                <Closest wins={data.closest} total={data.nearly_done} />
                <Groups groups={data.groups} />
            </div>

            <div className="space-y-5">
                <WeeklyPanel recent={data.recent} />
                <TitlesPanel titles={data.titles} />
                {data.guides.length > 0 && <GuidesPanel guides={data.guides} tone={TONE} />}
            </div>
        </div>
    );
}

function ConnectFirst() {
    return (
        <Panel material="lit" crown title="Connect your account first">
            <div className="space-y-4">
                <p className="text-sm text-[var(--ink-mid)]">
                    Your points and progress are read off your own account, and nothing has been read yet.
                </p>
                <Button asChild>
                    <Link href="/gw2">Go to the advisor</Link>
                </Button>
            </div>
        </Panel>
    );
}

function Summary({ data }: { data: Gw2Achievements }) {
    const { points } = data;
    const extra = [
        points.daily !== null ? `${points.daily.toLocaleString()} daily` : null,
        points.monthly ? `${points.monthly.toLocaleString()} monthly` : null,
    ].filter(Boolean);

    return (
        <PageSummary
            icon={<Trophy size={26} />}
            tone={TONE}
            title={`${points.total.toLocaleString()} achievement points`}
            description={`Every tier you have reached, repeatable achievements up to their cap${
                extra.length > 0 ? `, and the ${extra.join(" and ")} points the game counts on their own` : ""
            }. Guild Wars 2 publishes no total, so this is the sum.`}
        >
            <dl className="grid gap-4 sm:grid-cols-3">
                <SummaryFact icon={<CheckCircle2 size={18} />} value={data.done.toLocaleString()} label="achievements done, dailies aside" />
                <SummaryFact icon={<Target size={18} />} value={String(data.nearly_done)} label="four fifths of the way or more" />
                <SummaryFact icon={<Zap size={18} />} value={`+${data.recent.this_week}`} label="finished this game week" />
            </dl>

            {points.repeats_uncapped > 0 && (
                <p className="text-xs text-[var(--ink-low)]">
                    {points.repeats_uncapped} repeatable{" "}
                    {points.repeats_uncapped === 1 ? "achievement is" : "achievements are"} counted once until our copy of
                    the game&apos;s catalogue knows where {points.repeats_uncapped === 1 ? "its" : "their"} points stop.
                </p>
            )}
        </PageSummary>
    );
}

function Closest({ wins, total }: { wins: NearlyDone[]; total: number }) {
    return (
        <section className="space-y-4">
            <SectionHeader
                icon={<Target size={18} />}
                tone={TONE}
                title="Closest to done"
                description={
                    total > wins.length
                        ? `The ${wins.length} nearest of ${total} achievements you are most of the way through.`
                        : "Achievements you are most of the way through, nearest first."
                }
            />

            {wins.length === 0 ? (
                <p className="text-sm text-[var(--ink-low)]">Nothing is close to finishing right now.</p>
            ) : (
                <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                    {wins.map((win) => (
                        <li key={win.id}>
                            <NearlyDoneCard win={win} tone={TONE} />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

/**
 * One achievement close to finishing: what is left in the game's own words,
 * and what finishing pays — points, and a mastery point where it gives one.
 */
export function NearlyDoneCard({ win, tone }: { win: NearlyDone; tone: string }) {
    const steps = win.steps_remaining.slice(0, 3);

    return (
        <ToneCard tone={tone} className="flex h-full flex-col gap-3">
            <div className="flex items-start gap-3">
                {win.icon ? (
                    <GameIcon src={win.icon} alt="" size="md" tone={tone} />
                ) : (
                    <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center" style={{ color: tone }}>
                        <Trophy size={16} />
                    </span>
                )}
                <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5">
                        <span className="text-[15px] font-semibold leading-snug text-[var(--ink-hi)]">{win.name ?? `#${win.id}`}</span>
                        <WikiLink wiki={win.wiki} name={win.name} compact />
                    </p>
                    {win.requirement && <p className="mt-0.5 line-clamp-2 text-xs text-[var(--ink-low)]">{win.requirement}</p>}
                </div>
            </div>

            {steps.length > 0 && (
                <ul className="space-y-1">
                    {steps.map((step) => (
                        <li key={step} className="flex items-start gap-1.5 text-[12px] text-[var(--ink-mid)]">
                            <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ background: tone }} />
                            {step}
                        </li>
                    ))}
                    {win.steps_remaining.length > steps.length && (
                        <li className="text-[11px] text-[var(--ink-faint)]">and {win.steps_remaining.length - steps.length} more</li>
                    )}
                </ul>
            )}

            <div className="mt-auto space-y-1.5">
                <Meter value={win.current} max={win.max} size="sm" tone={tone} />
                <p className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-numeric text-[var(--ink-mid)]">
                        {win.current.toLocaleString()} / {win.max.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-2">
                        {win.points ? <span style={{ color: tone }}>+{win.points} AP</span> : null}
                        {win.mastery_region && (
                            <span style={{ color: regionTone(win.mastery_region) }}>+1 {win.mastery_region} mastery</span>
                        )}
                    </span>
                </p>
            </div>
        </ToneCard>
    );
}

function Groups({ groups }: { groups: Gw2AchievementGroup[] }) {
    return (
        <section className="space-y-4">
            <SectionHeader
                icon={<Layers size={18} />}
                tone={TONE}
                title="By group"
                description="The game's own groups and categories. Dailies are left out, and so are hidden achievements you have not found."
            />

            <ul className="grid gap-3 lg:grid-cols-2">
                {groups.map((group) => (
                    <li key={group.id}>
                        <GroupCard group={group} tone={TONE} />
                    </li>
                ))}
            </ul>
        </section>
    );
}

/**
 * A group with its categories folded under it. `<details>` rather than state:
 * nineteen groups each holding up to sixty-eight categories is a long page
 * open, and the browser already knows how to fold one.
 */
export function GroupCard({ group, tone, open = false }: { group: Gw2AchievementGroup; tone: string; open?: boolean }) {
    return (
        <ToneCard tone={tone} className="p-0">
            <details className="group" open={open}>
                <summary className="flex cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden">
                    {group.icon ? (
                        <GameIcon src={group.icon} alt="" size="md" tone={tone} />
                    ) : (
                        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center" style={{ color: tone }}>
                            <Trophy size={16} />
                        </span>
                    )}
                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-baseline justify-between gap-3">
                            <span className="text-[15px] font-semibold text-[var(--ink-hi)]">{group.name}</span>
                            <span className="shrink-0 font-numeric text-xs text-[var(--ink-mid)]">
                                {group.total === null ? `${group.done} done` : `${group.done} / ${group.total}`}
                            </span>
                        </div>
                        {group.total !== null ? (
                            <Meter value={group.done} max={group.total} size="sm" tone={tone} segmentLimit={0} />
                        ) : (
                            <p className="text-[11px] text-[var(--ink-low)]">Can no longer be earned.</p>
                        )}
                        <p className="text-[11px] text-[var(--ink-faint)]">
                            {group.points.toLocaleString()} points earned · {group.categories.length}{" "}
                            {group.categories.length === 1 ? "category" : "categories"}
                        </p>
                    </div>
                    <ChevronDown
                        size={16}
                        aria-hidden
                        className="mt-1 shrink-0 text-[var(--ink-low)] transition-transform group-open:rotate-180"
                    />
                </summary>

                <ul className="space-y-2.5 border-t px-4 pb-4 pt-3" style={{ borderColor: "var(--line)" }}>
                    {group.categories.map((category) => (
                        <li key={category.id} className="flex items-center gap-2.5">
                            {category.icon ? (
                                <GameIcon src={category.icon} alt="" size="sm" />
                            ) : (
                                <span aria-hidden className="h-6 w-6 shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="flex items-baseline justify-between gap-2 text-[13px]">
                                    <span className="truncate text-[var(--ink-mid)]">{category.name}</span>
                                    <span className="shrink-0 font-numeric text-[11px] text-[var(--ink-low)]">
                                        {category.total === null ? `${category.done} done` : `${category.done} / ${category.total}`}
                                    </span>
                                </p>
                                {category.total !== null && (
                                    <Meter
                                        value={category.done}
                                        max={category.total}
                                        size="sm"
                                        tone={category.done === category.total ? "var(--success)" : tone}
                                        segmentLimit={0}
                                        className="mt-1"
                                    />
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </details>
        </ToneCard>
    );
}

/**
 * Achievements finished between two of our reads, by game week.
 *
 * The game keeps no date on an achievement, so this starts on the day the
 * account was connected and says so when it is empty.
 */
function WeeklyPanel({ recent }: { recent: Gw2Achievements["recent"] }) {
    const peak = Math.max(1, ...recent.weeks.map((w) => w.count));

    return (
        <Gw2Panel icon={<BarChart3 size={18} />} title="Weekly progress" description="Achievements finished, by game week" tone={TONE}>
            <div className="space-y-4">
                <p className="font-display text-2xl font-bold text-[var(--ink-hi)]">
                    +{recent.this_week}
                    <span className="ml-2 text-xs font-normal text-[var(--ink-low)]">this week</span>
                </p>

                <div
                    className="flex h-24 items-end gap-2"
                    role="img"
                    aria-label={`Achievements per week: ${recent.weeks.map((w) => w.count).join(", ")}`}
                >
                    {recent.weeks.map((week) => (
                        <div key={week.starts_at} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                            <div className="flex h-20 w-full items-end">
                                <span
                                    className="block w-full rounded-t-[3px]"
                                    style={{
                                        height: week.count > 0 ? `${(week.count / peak) * 100}%` : "2px",
                                        background: week.count > 0 ? TONE : "var(--track)",
                                    }}
                                />
                            </div>
                            <span className="truncate text-[10px] text-[var(--ink-faint)]">
                                {new Date(week.starts_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                        </div>
                    ))}
                </div>

                {recent.events.length > 0 ? (
                    <ul className="space-y-2 border-t pt-3" style={{ borderColor: "var(--line)" }}>
                        {recent.events.map((event, i) => (
                            <li key={`${event.id}-${i}`} className="flex items-center gap-2.5">
                                <GameIcon src={event.icon} alt="" size="sm" tone={TONE} />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[13px] text-[var(--ink-hi)]">{event.name}</span>
                                    <span className="block text-[11px] text-[var(--ink-faint)]">
                                        {new Date(event.occurred_at.replace(" ", "T")).toLocaleDateString()}
                                    </span>
                                </span>
                                {event.points > 0 && (
                                    <span className="shrink-0 font-numeric text-[11px]" style={{ color: TONE }}>
                                        +{event.points} AP
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="border-t pt-3 text-xs text-[var(--ink-low)]" style={{ borderColor: "var(--line)" }}>
                        Nothing finished between two of our reads in these six weeks. Guild Wars 2 keeps no date on an
                        achievement, so we count from the day your account was connected.
                    </p>
                )}
            </div>
        </Gw2Panel>
    );
}

function TitlesPanel({ titles }: { titles: Gw2TitleWithinReach[] | null }) {
    return (
        <Gw2Panel icon={<Crown size={18} />} title="Titles within reach" description="Started, and not yet yours" tone={TONE}>
            {titles === null ? (
                <p className="text-xs text-[var(--ink-low)]">
                    Your titles have not been read yet. They come with a full read of your account, and only with a key
                    that has the unlocks permission.
                </p>
            ) : titles.length === 0 ? (
                <p className="text-xs text-[var(--ink-low)]">No title you lack has an achievement you have started.</p>
            ) : (
                <ul className="space-y-3.5">
                    {titles.map((title) => (
                        <li key={title.title_id} className="space-y-1.5">
                            <p className="flex items-baseline justify-between gap-3">
                                <span className="min-w-0 truncate text-sm text-[var(--ink-hi)]">{title.title ?? "Untitled"}</span>
                                <span className="shrink-0 font-numeric text-xs text-[var(--ink-mid)]">
                                    {title.current} / {title.max}
                                </span>
                            </p>
                            <p className="flex items-center gap-1 text-[11px] text-[var(--ink-low)]">
                                <span className="truncate">{title.achievement}</span>
                                <WikiLink wiki={title.wiki} name={title.achievement} compact />
                            </p>
                            <Meter value={title.current} max={title.max} size="sm" tone={TONE} segmentLimit={0} />
                        </li>
                    ))}
                </ul>
            )}
        </Gw2Panel>
    );
}

/** The published guides of the page's family. */
export function GuidesPanel({
    guides,
    tone,
}: {
    guides: { href: string; title: string; standfirst: string | null }[];
    tone: string;
}) {
    return (
        <Gw2Panel icon={<BookOpen size={18} />} title="Guides" description="From the TechPlay desk" tone={tone}>
            <ul className="space-y-3">
                {guides.map((guide) => (
                    <li key={guide.href}>
                        <Link href={guide.href} className="group block">
                            <span className="flex items-center gap-1.5 text-sm text-[var(--ink-hi)] group-hover:text-[var(--accent-ink)]">
                                <Sparkles size={13} aria-hidden style={{ color: tone }} />
                                {guide.title}
                            </span>
                            {guide.standfirst && (
                                <span className="mt-0.5 line-clamp-2 block text-[11px] text-[var(--ink-low)]">{guide.standfirst}</span>
                            )}
                        </Link>
                    </li>
                ))}
            </ul>
        </Gw2Panel>
    );
}
