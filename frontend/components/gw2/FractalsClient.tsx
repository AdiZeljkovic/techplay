"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Panel from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import Meter from "@/components/ui/Meter";
import Select from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import GameIcon from "@/components/gw2/GameIcon";
import WikiLink from "@/components/gw2/WikiLink";
import { ActionLink, Gw2Panel, SectionHeader } from "@/components/gw2/Gw2Ui";
import { Gw2Card, PageSummary, SummaryFact } from "@/components/gw2/Gw2PageParts";
import { GroupCard, GuidesPanel, NearlyDoneCard } from "@/components/gw2/AchievementsClient";
import { DOMAIN_TONE } from "@/lib/gw2domain";
import { getFractals, type Gw2FractalDay, type Gw2Fractals } from "@/lib/gw2";

/**
 * The fractals page.
 *
 * Mockup 1 draws fractals as two figures — "Fractal Level 37, Tier 4" and
 * "Agony Resistance 61 / 100" — and both are wrong: level 37 is Tier 2, and
 * the target is 150 (REDIZAJN.md §4). Here the level and its tier, Agony
 * Resistance for every level 80 against the one target the game publishes,
 * the attunement mastery, the fractal currencies, today's fractals and the
 * fractal achievements.
 *
 * Not here, on purpose: a recommended Agony Resistance per scale. The fractal
 * UI shows one, the API does not, and a table typed from memory would be the
 * tool's first invented number.
 */

const TONE = DOMAIN_TONE.fractals;

export default function FractalsClient() {
    const { user, isLoading: authLoading } = useAuth();

    const [data, setData] = useState<Gw2Fractals | null>(null);
    const [state, setState] = useState<"loading" | "none" | "ready" | "error">("loading");
    const [character, setCharacter] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async (name: string | null) => {
        try {
            const payload = await getFractals(name);

            setData(payload);
            setState(payload ? "ready" : "none");
        } catch (e: unknown) {
            const status = (e as { response?: { status?: number } }).response?.status;

            if (status === 404 && name) {
                // The character went between reads; back to the advisor's own pick.
                setCharacter(null);
            } else {
                setState(status === 404 ? "none" : "error");
            }
        } finally {
            setBusy(false);
        }
    }, []);

    useEffect(() => {
        if (authLoading || !user) return;

        void load(character);
    }, [authLoading, user, load, character]);

    function choose(name: string) {
        setBusy(true);
        setCharacter(name);
    }

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
                        We could not load your fractals. This is a problem reaching our own server, not your data.
                    </p>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setState("loading");
                            void load(character);
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
        <div className="space-y-6" style={{ opacity: busy ? 0.6 : 1, transition: "opacity 200ms" }} aria-busy={busy}>
            {data.characters.length > 1 && data.character && (
                <div>
                    <span className="mb-1.5 block text-xs font-medium text-[var(--ink-low)]">Character</span>
                    <Select
                        value={data.character.name}
                        onChange={choose}
                        ariaLabel="Character"
                        className="h-10 w-64 max-w-full px-3 text-sm"
                        options={data.characters.map((c) => ({
                            value: c.name,
                            label: `${c.name} · ${c.profession ?? "?"} · ${c.agony_resistance} AR`,
                        }))}
                    />
                </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0 space-y-8">
                    <Summary data={data} />
                    <Today today={data.today} />
                    {data.characters.length > 0 && <Agony data={data} />}
                    {data.attunement && <Attunement attunement={data.attunement} />}
                    {(data.achievements || data.closest.length > 0) && <FractalAchievements data={data} />}
                </div>

                <div className="space-y-5">
                    <WalletPanel wallet={data.wallet} />
                    {data.character && <GearPanel character={data.character} target={data.agony_target} />}
                    {data.guides.length > 0 && <GuidesPanel guides={data.guides} />}
                </div>
            </div>
        </div>
    );
}

function ConnectFirst() {
    return (
        <Gw2Panel title="Connect your account first">
            <div className="space-y-4">
                <p className="text-sm text-[var(--ink-mid)]">
                    Your fractal level, Agony Resistance and relics are read off your own account, and nothing has been read
                    yet.
                </p>
                <Button asChild>
                    <Link href="/gw2">Go to the advisor</Link>
                </Button>
            </div>
        </Gw2Panel>
    );
}

function Summary({ data }: { data: Gw2Fractals }) {
    const level = data.personal_level;
    const character = data.character;

    return (
        <PageSummary
            title={level ? `Fractal level ${level} — Tier ${data.tier}` : "No fractal run yet"}
            description={
                character
                    ? character.shortfall > 0
                        ? `${character.name} wears ${character.agony_resistance} Agony Resistance. Tier 4 asks for ${data.agony_target} — ${character.shortfall} to go.`
                        : `${character.name} wears ${character.agony_resistance} Agony Resistance, enough for Tier 4.`
                    : "No character has been read yet."
            }
        >
            {character && <Meter value={character.agony_resistance} max={data.agony_target} tone={TONE} showCount />}

            <dl className="grid gap-4 sm:grid-cols-3">
                <SummaryFact
                    value={level ? String(level) : "—"}
                    label={level ? `personal fractal level, Tier ${data.tier} of 4` : "personal fractal level"}
                />
                <SummaryFact
                    value={character ? `${character.agony_resistance} / ${data.agony_target}` : "—"}
                    label="Agony Resistance, summed from the infusions worn"
                />
                <SummaryFact
                    value={data.attunement ? `${data.attunement.paid} / ${data.attunement.total}` : "—"}
                    label="Fractal Attunement tiers trained"
                />
            </dl>
        </PageSummary>
    );
}

/**
 * Today's fractals, as the game's daily list names them, and tomorrow's.
 *
 * Read once a day just after the reset, so a page view never reaches the
 * game's servers. The reset time is shown in the reader's own clock.
 */
function Today({ today }: { today: Gw2Fractals["today"] }) {
    return (
        <section className="space-y-4">
            <SectionHeader
                title="Today's fractals"
                description={
                    today
                        ? `The game's daily list. It changes at ${new Date(today.resets_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} your time.`
                        : "The game's daily list."
                }
            />

            {today ? (
                <div className="space-y-5">
                    <DayCards day={today.today} />

                    {today.tomorrow && (
                        <div className="space-y-2.5">
                            <p className="text-xs font-medium text-[var(--ink-low)]">Tomorrow</p>
                            <DayCards day={today.tomorrow} quiet />
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-sm text-[var(--ink-low)]">
                    Today&apos;s list has not been read yet. It is read once a day, just after the reset.
                </p>
            )}
        </section>
    );
}

function DayCards({ day, quiet = false }: { day: Gw2FractalDay; quiet?: boolean }) {
    const heading = quiet ? "text-[13px] text-[var(--ink-mid)]" : "font-display text-[15px] font-semibold text-[var(--ink-hi)]";

    return (
        <div className={quiet ? "grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-4"}>
            {day.fractals.map((fractal) => (
                <Gw2Card key={fractal.name} className={quiet ? "space-y-2 p-3" : "space-y-3"}>
                    <p className={heading}>{fractal.name}</p>
                    <ul className="flex gap-1.5" aria-label="Tiers">
                        {[1, 2, 3, 4].map((tier) => {
                            const on = fractal.tiers.includes(tier);

                            return (
                                <li
                                    key={tier}
                                    className="rounded-full border px-2 py-0.5 font-numeric text-[11px]"
                                    style={{
                                        borderColor: on ? "var(--line-strong)" : "var(--line)",
                                        color: on ? "var(--ink-hi)" : "var(--ink-faint)",
                                        background: on && !quiet ? "var(--fill-2)" : "transparent",
                                    }}
                                >
                                    T{tier}
                                </li>
                            );
                        })}
                    </ul>
                </Gw2Card>
            ))}

            {day.recommended.length > 0 && (
                <Gw2Card className={quiet ? "space-y-2 p-3" : "space-y-3"}>
                    <p className={heading}>Recommended scales</p>
                    <p className="font-numeric text-[13px] text-[var(--ink-mid)]">{day.recommended.join(" · ")}</p>
                </Gw2Card>
            )}

            {day.other.map((name) => (
                <Gw2Card key={name} className="p-3 text-[13px] text-[var(--ink-mid)]">
                    {name}
                </Gw2Card>
            ))}
        </div>
    );
}

/** Every level 80 against the one target, most first. */
function Agony({ data }: { data: Gw2Fractals }) {
    return (
        <section className="space-y-4">
            <SectionHeader
                title="Agony Resistance"
                description={`Every level 80, summed from the infusions each one wears. Tier 4 asks for ${data.agony_target}.`}
                action={{ href: "/gw2/ascended", label: "Ascended set" }}
            />

            <ul className="space-y-2">
                {data.characters.map((c) => {
                    const done = c.shortfall === 0;
                    const chosen = c.name === data.character?.name;

                    return (
                        <li
                            key={c.name}
                            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 rounded-[var(--radius-card)] border px-4 py-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto]"
                            style={{
                                background: chosen ? "var(--fill-2)" : "var(--surface-1)",
                                borderColor: chosen ? "var(--accent)" : "var(--line-strong)",
                            }}
                        >
                            <span className="min-w-0">
                                <span className="block truncate text-sm text-[var(--ink-hi)]">{c.name}</span>
                                <span className="block text-[11px] text-[var(--ink-faint)]">
                                    {c.profession ?? "Unknown"} · {c.ascended_core} / {c.core_slots} ascended
                                </span>
                            </span>
                            <Meter
                                value={c.agony_resistance}
                                max={data.agony_target}
                                size="sm"
                                tone={done ? "var(--success)" : TONE}
                                segmentLimit={0}
                                className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-1 sm:col-start-2"
                            />
                            <span className="text-right font-numeric text-xs text-[var(--ink-mid)] sm:col-start-3">
                                {done ? (
                                    <span className="inline-flex items-center gap-1 text-[var(--success)]">
                                        <Check size={12} aria-hidden />
                                        {c.agony_resistance}
                                    </span>
                                ) : (
                                    `${c.agony_resistance} / ${data.agony_target}`
                                )}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

function Attunement({ attunement }: { attunement: NonNullable<Gw2Fractals["attunement"]> }) {
    const next = attunement.tiers.find((t) => !t.paid);

    return (
        <section className="space-y-4">
            <SectionHeader
                title={attunement.name}
                description={
                    next
                        ? `${attunement.paid} of ${attunement.total} tiers. The next costs ${next.cost} ${attunement.region ?? ""} mastery ${next.cost === 1 ? "point" : "points"}${
                              attunement.unspent !== null ? ` — you have ${attunement.unspent} unspent` : ""
                          }.`
                        : "Every tier trained."
                }
                meta={<WikiLink wiki={attunement.wiki} name={attunement.name} />}
            />

            <ol className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {attunement.tiers.map((tier, i) => (
                    <li key={tier.name ?? i}>
                        <Gw2Card className="flex h-full flex-col gap-2">
                            <div className="flex items-center gap-2.5">
                                {tier.icon ? (
                                    <GameIcon src={tier.icon} alt="" size="md" />
                                ) : (
                                    <span aria-hidden className="h-9 w-9 shrink-0" />
                                )}
                                <div className="min-w-0">
                                    <p className="text-[14px] font-semibold leading-snug text-[var(--ink-hi)]">{tier.name}</p>
                                    {/* Trained in the success colour; the next tier to buy in plain ink, the rest quieter. */}
                                    <p
                                        className="inline-flex items-center gap-1 text-[11px]"
                                        style={{
                                            color: tier.paid ? "var(--success)" : tier === next ? "var(--ink-hi)" : "var(--ink-low)",
                                        }}
                                    >
                                        {tier.paid && <Check size={11} aria-hidden />}
                                        {tier.paid ? "Trained" : `${tier.cost} ${tier.cost === 1 ? "point" : "points"}`}
                                    </p>
                                </div>
                            </div>
                            {tier.description && <p className="line-clamp-4 text-[12px] text-[var(--ink-low)]">{tier.description}</p>}
                        </Gw2Card>
                    </li>
                ))}
            </ol>
        </section>
    );
}

function FractalAchievements({ data }: { data: Gw2Fractals }) {
    return (
        <section className="space-y-4">
            <SectionHeader
                title="Fractal achievements"
                description="The Fractals of the Mists group, and what in it is closest to done."
                action={{ href: "/gw2/achievements", label: "All achievements" }}
            />

            {data.closest.length > 0 && (
                <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                    {data.closest.map((win) => (
                        <li key={win.id}>
                            <NearlyDoneCard win={win} tone={TONE} />
                        </li>
                    ))}
                </ul>
            )}

            {data.achievements && <GroupCard group={data.achievements} tone={TONE} open />}
        </section>
    );
}

function WalletPanel({ wallet }: { wallet: Gw2Fractals["wallet"] }) {
    return (
        <Gw2Panel title="Fractal currencies" description="In your wallet at the last read">
            {wallet === null ? (
                <p className="text-xs text-[var(--ink-low)]">Your key does not share the wallet, so we cannot see these.</p>
            ) : (
                <ul className="space-y-3">
                    {wallet.map((currency) => (
                        <li key={currency.id} className="flex items-center gap-3">
                            <GameIcon src={currency.icon} alt="" size="sm" />
                            <span className="flex min-w-0 flex-1 items-center gap-1">
                                <span className="truncate text-[13px] text-[var(--ink-mid)]">{currency.name}</span>
                                <WikiLink wiki={currency.wiki} name={currency.name} compact />
                            </span>
                            <span className="shrink-0 font-numeric text-[15px] font-semibold text-[var(--ink-hi)]">
                                {currency.amount.toLocaleString()}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </Gw2Panel>
    );
}

/**
 * Agony infusions only fit ascended and legendary slots, so the gear is the
 * ceiling on the number above — and the ascended page is where that gets
 * planned.
 */
function GearPanel({ character, target }: { character: NonNullable<Gw2Fractals["character"]>; target: number }) {
    const gear = DOMAIN_TONE.gear;

    return (
        <Gw2Panel title="Room for infusions" description="Agony infusions go into ascended and legendary slots">
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <p className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-[var(--ink-hi)]">{character.name}</span>
                        <span className="font-numeric text-xs text-[var(--ink-mid)]">
                            {character.ascended_core} / {character.core_slots} core slots
                        </span>
                    </p>
                    <Meter value={character.ascended_core} max={character.core_slots} size="sm" tone={gear} />
                </div>
                {character.shortfall > 0 ? (
                    <p className="text-xs text-[var(--ink-low)]">
                        {character.shortfall} Agony Resistance short of {target}.
                        {character.ascended_core < character.core_slots
                            ? " Every slot below ascended is one that cannot hold an infusion yet."
                            : ""}
                    </p>
                ) : (
                    <p className="text-xs text-[var(--ink-low)]">At the Tier 4 target.</p>
                )}
                <ActionLink href="/gw2/ascended">Plan the ascended set</ActionLink>
            </div>
        </Gw2Panel>
    );
}
