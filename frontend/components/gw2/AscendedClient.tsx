"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
    BarChart3,
    Check,
    Circle,
    Coins,
    Flame,
    Hammer,
    Hourglass,
    Info,
    Package,
    PackageCheck,
    Pin,
    PinOff,
    Shield,
    ShieldCheck,
    ShoppingCart,
    Target,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Panel from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import Meter from "@/components/ui/Meter";
import Select from "@/components/ui/Select";
import Segmented from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import GameIcon, { RARITY_COLOUR } from "@/components/gw2/GameIcon";
import WikiLink from "@/components/gw2/WikiLink";
import { ActionLink, Gw2Panel, SectionHeader } from "@/components/gw2/Gw2Ui";
import { DOMAIN_TONE, domainTone } from "@/lib/gw2domain";
import {
    coin,
    getAscended,
    gw2Error,
    pinGoal,
    slotLabel,
    unpinGoal,
    type Gw2Ascended,
    type Gw2SetPiece,
    type Gw2SetStep,
    type PlanLine,
} from "@/lib/gw2";

/**
 * The ascended set — mockup 2.
 *
 * The mockup's planner has its target decided: Berserker's, six pieces. This
 * one reads the target off the character — the armour's own weight, the stat
 * prefix most of it wears — and puts both in front of the player as choices,
 * so the set it plans is the one they are wearing towards and not one we
 * picked. Changing the character resets both, because they belong to it.
 *
 * Every figure is the account's: the pieces from the last read, the materials
 * out of one stock shared by every piece still to make, the bill from the
 * nightly trading post prices. What the mockup draws and this does not:
 * "Confidence to complete: High" (in its place, whether anyone on the account
 * can craft it), "Gold spent" (nothing records it), and a four-step path
 * written in advance — the path here is the plan's own steps, and a step that
 * does not apply is not drawn.
 */

const GOAL = "first-ascended-set";
const GEAR = DOMAIN_TONE.gear;

type Choice = { character: string | null; stats: string | null; weight: string | null };

export default function AscendedClient() {
    const { user, isLoading: authLoading } = useAuth();

    const [data, setData] = useState<Gw2Ascended | null>(null);
    const [state, setState] = useState<"loading" | "none" | "ready" | "error">("loading");
    const [busy, setBusy] = useState(false);
    const [choice, setChoice] = useState<Choice>({ character: null, stats: null, weight: null });

    const load = useCallback(async (asked: Choice) => {
        try {
            const payload = await getAscended(asked);

            setData(payload);
            setState(payload ? "ready" : "none");
        } catch (e: unknown) {
            const status = (e as { response?: { status?: number } }).response?.status;

            setState(status === 404 ? "none" : "error");
        } finally {
            setBusy(false);
        }
    }, []);

    useEffect(() => {
        if (authLoading || !user) return;

        void load(choice);
    }, [authLoading, user, load, choice]);

    // Dimmed from the click, not from the effect: the page stays on screen
    // while the new choice is read, and an effect that set state before its
    // first await would render twice for nothing.
    function choose(next: Choice) {
        setBusy(true);
        setChoice(next);
    }

    async function togglePin() {
        if (!data) return;

        try {
            if (data.pinned) {
                await unpinGoal(GOAL);
            } else {
                await pinGoal(GOAL);
            }

            setData({ ...data, pinned: !data.pinned });
            toast.success(data.pinned ? "Unpinned." : "Pinned — the dashboard leans towards your armour now.");
        } catch (e: unknown) {
            toast.error(gw2Error(e, "We could not change the pin."));
        }
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
                        We could not load your armour. This is a problem reaching our own server, not your data.
                    </p>
                    <Button variant="secondary" onClick={() => void load(choice)}>
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
            <ChoiceBar
                data={data}
                onCharacter={(character) => choose({ character, stats: null, weight: null })}
                onStats={(stats) => choose({ ...choice, character: data.character.name, stats })}
                onWeight={(weight) => choose({ ...choice, character: data.character.name, weight })}
                onPin={() => void togglePin()}
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0 space-y-6">
                    <Summary data={data} />
                    <Pieces data={data} />
                    {data.materials.length > 0 && <Materials data={data} />}
                    {data.path.length > 0 && <ThePath steps={data.path} />}
                </div>

                <div className="space-y-5">
                    {data.guide && <WhyPanel guide={data.guide} />}
                    <ProgressPanel data={data} />
                    {data.related.length > 0 && <RelatedPanel related={data.related} />}
                </div>
            </div>
        </div>
    );
}

function ConnectFirst() {
    return (
        <Panel material="lit" crown title="Connect your account first">
            <div className="space-y-4">
                <p className="text-sm text-[var(--ink-mid)]">
                    The set is read off your own characters, and nothing has been read yet.
                </p>
                <Button asChild>
                    <Link href="/gw2">Go to the advisor</Link>
                </Button>
            </div>
        </Panel>
    );
}

/**
 * Whose armour, in which stats — and the pin.
 *
 * The weight is offered only when there was no armour to read it off. With
 * armour on, it is not a preference: the profession fixes it.
 */
function ChoiceBar({
    data,
    onCharacter,
    onStats,
    onWeight,
    onPin,
}: {
    data: Gw2Ascended;
    onCharacter: (name: string) => void;
    onStats: (stats: string) => void;
    onWeight: (weight: string) => void;
    onPin: () => void;
}) {
    const wornElsewhere = data.stats_worn !== null && !data.stat_options.includes(data.stats_worn);

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-end gap-3">
                <Field label="Character">
                    <Select
                        value={data.character.name}
                        onChange={onCharacter}
                        ariaLabel="Character"
                        className="h-10 w-64 max-w-full px-3 text-sm"
                        options={data.characters.map((c) => ({
                            value: c.name,
                            label: `${c.name} · ${c.profession ?? "?"} · ${c.armour_done}/6`,
                        }))}
                    />
                </Field>

                {!data.weight_known && (
                    <Field label="Armour weight">
                        <Select
                            value={data.weight ?? ""}
                            onChange={onWeight}
                            ariaLabel="Armour weight"
                            placeholder="Pick a weight"
                            className="h-10 w-40 px-3 text-sm"
                            options={["Heavy", "Medium", "Light"].map((w) => ({ value: w, label: w }))}
                        />
                    </Field>
                )}

                {data.stat_options.length > 0 && (
                    <Field label="Stats">
                        <Select
                            value={data.stats ?? ""}
                            onChange={onStats}
                            ariaLabel="Stats"
                            placeholder="Pick the stats"
                            className="h-10 w-56 max-w-full px-3 text-sm"
                            options={data.stat_options.map((s) => ({
                                value: s,
                                label: s === data.stats_worn ? `${s} (what you wear)` : s,
                            }))}
                        />
                    </Field>
                )}

                <button
                    type="button"
                    onClick={onPin}
                    aria-pressed={data.pinned}
                    className="ml-auto inline-flex h-10 items-center gap-2 rounded-[var(--radius-card)] border px-3.5 text-[13px] transition-colors hover:bg-[var(--fill-1)]"
                    style={{
                        borderColor: data.pinned ? `color-mix(in srgb, ${GEAR} 55%, transparent)` : "var(--line-strong)",
                        color: data.pinned ? "var(--ink-hi)" : "var(--ink-mid)",
                    }}
                >
                    {data.pinned ? <Pin size={14} aria-hidden style={{ color: GEAR }} /> : <PinOff size={14} aria-hidden />}
                    {data.pinned ? "Your pinned goal" : "Pin this goal"}
                </button>
            </div>

            {wornElsewhere && (
                <p className="text-xs text-[var(--ink-low)]">
                    {data.character.name} wears {data.stats_worn}, and no crafted ascended armour comes in those stats — pick
                    the set you want instead.
                </p>
            )}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="min-w-0">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">{label}</span>
            {children}
        </div>
    );
}

/** The panel across the top: how far along, what is left to buy, and who can make it. */
function Summary({ data }: { data: Gw2Ascended }) {
    const finished = data.done === data.total;
    const toCraft = data.pieces.filter((p) => p.state === "craft").length;

    return (
        <section
            className="relative overflow-hidden rounded-[var(--radius-panel)] border p-5 md:p-6"
            style={{ background: "var(--surface-1)", borderColor: `color-mix(in srgb, ${GEAR} 40%, var(--line-strong))` }}
        >
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: `radial-gradient(60% 90% at 0% 0%, color-mix(in srgb, ${GEAR} 16%, transparent), transparent 70%)` }}
            />

            <div className="relative space-y-5">
                <div className="flex items-start gap-4">
                    <span
                        aria-hidden
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2"
                        style={{
                            color: GEAR,
                            borderColor: `color-mix(in srgb, ${GEAR} 70%, transparent)`,
                            boxShadow: `0 0 24px color-mix(in srgb, ${GEAR} 30%, transparent)`,
                        }}
                    >
                        {finished ? <ShieldCheck size={26} /> : <Shield size={26} />}
                    </span>
                    <div className="min-w-0">
                        <h2 className="font-display text-xl font-bold leading-tight text-[var(--ink-hi)] md:text-2xl">
                            {finished
                                ? `${data.character.name}'s armour is all ascended`
                                : `Finish ${data.character.name}'s ascended armour`}
                        </h2>
                        <p className="mt-1 text-sm text-[var(--ink-mid)]">
                            {finished
                                ? `All six pieces are ascended or better. ${data.core.done} of ${data.core.total} core slots counting trinkets and the back item.`
                                : `${data.done} of ${data.total} pieces are ascended${
                                      data.stats ? ` — planning the rest in ${data.stats}` : ""
                                  }${data.weight ? `, ${data.weight.toLowerCase()} armour` : ""}.`}
                        </p>
                    </div>
                </div>

                <Meter value={data.done} max={data.total} tone={GEAR} showCount />

                <dl className="grid gap-4 sm:grid-cols-3">
                    <Fact icon={<Shield size={18} />} value={`${data.done} / ${data.total}`} label="armour pieces ascended" />
                    <Fact
                        icon={<Coins size={18} />}
                        value={data.prices ? coin(data.prices.buy_now) : "—"}
                        label={
                            data.prices
                                ? "still to buy at today's prices"
                                : toCraft > 0
                                  ? "no prices loaded"
                                  : "nothing left to buy"
                        }
                    />
                    <Fact
                        icon={<Hammer size={18} />}
                        value={
                            data.crafting
                                ? `${data.crafting.disciplines.join(" / ")} ${data.crafting.min_rating}`
                                : "—"
                        }
                        label={
                            data.crafting
                                ? data.crafting.ready
                                    ? "someone on your account can craft it"
                                    : "nobody on your account can craft it yet"
                                : "nothing left to craft"
                        }
                    />
                </dl>
            </div>
        </section>
    );
}

function Fact({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
    return (
        <div className="flex items-start gap-3">
            <span
                aria-hidden
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-card)]"
                style={{ background: "var(--fill-1)", color: "var(--ink-mid)" }}
            >
                {icon}
            </span>
            <div className="min-w-0">
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-lg font-bold leading-tight text-[var(--ink-hi)]">{value}</dd>
                <dd className="text-xs text-[var(--ink-low)]">{label}</dd>
            </div>
        </div>
    );
}

/** The six pieces, and the six slots that are ascended too but are not crafted. */
function Pieces({ data }: { data: Gw2Ascended }) {
    return (
        <section className="space-y-4">
            <SectionHeader
                icon={<Shield size={18} />}
                tone={GEAR}
                title="Your armour"
                description={`What ${data.character.name} wears now, and the crafted piece that replaces it.`}
            />

            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-6">
                {data.pieces.map((piece) => (
                    <li key={piece.slot}>
                        <PieceCard piece={piece} />
                    </li>
                ))}
            </ul>

            {/*
             * Not a plan: these come from laurels, fractal relics, achievements
             * and vendors, and which of those is right is not something the
             * account says. The state and the wiki are what we have.
             */}
            <div className="rounded-[var(--radius-card)] border px-4 py-3" style={{ borderColor: "var(--line)" }}>
                <p className="mb-2.5 text-xs text-[var(--ink-low)]">
                    Trinkets and the back item — ascended too, not crafted ·{" "}
                    <span className="text-[var(--ink-mid)]">
                        {data.core.done} of {data.core.total} core slots
                    </span>
                </p>
                <ul className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                    {data.others.map((slot) => (
                        <li key={slot.slot} className="flex min-w-0 items-center gap-2.5">
                            {slot.worn?.icon ? (
                                <GameIcon src={slot.worn.icon} alt="" size="sm" rarity={slot.worn.rarity} />
                            ) : (
                                <span aria-hidden className="h-6 w-6 shrink-0 rounded-[4px] bg-[var(--fill-2)]" />
                            )}
                            <span className="min-w-0 flex-1">
                                <span className="block text-[11px] text-[var(--ink-faint)]">{slotLabel(slot.slot)}</span>
                                <span
                                    className="block truncate text-[13px]"
                                    style={{ color: slot.state === "done" ? "var(--ink-hi)" : "var(--ink-low)" }}
                                >
                                    {slot.worn?.name ?? "Nothing equipped"}
                                </span>
                            </span>
                            {slot.state === "done" ? (
                                <Check size={14} aria-label="Ascended" className="shrink-0 text-[var(--success)]" />
                            ) : (
                                <WikiLink wiki={slot.worn?.wiki} name={slot.worn?.name} compact />
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

const PIECE_STATE: Record<Gw2SetPiece["state"], { label: string; tone: string }> = {
    done: { label: "Ascended", tone: "var(--success)" },
    craft: { label: "To craft", tone: GEAR },
    owned: { label: "In your account — equip it", tone: "var(--warning)" },
    choose: { label: "Pick the stats", tone: "var(--ink-low)" },
    unavailable: { label: "No crafted piece in these stats", tone: "var(--ink-low)" },
};

function PieceCard({ piece }: { piece: Gw2SetPiece }) {
    const look = PIECE_STATE[piece.state];
    const shown = piece.state === "done" ? piece.worn : (piece.target ?? piece.worn);
    const done = piece.state === "done";

    return (
        <div
            className="flex h-full flex-col items-center gap-2 rounded-[var(--radius-panel)] border px-3 pb-3 pt-4 text-center"
            style={{
                background: "var(--surface-1)",
                borderColor: `color-mix(in srgb, ${look.tone} 45%, var(--line))`,
                boxShadow: `inset 0 -40px 60px -40px color-mix(in srgb, ${look.tone} 22%, transparent)`,
            }}
        >
            {shown?.icon ? (
                <GameIcon src={shown.icon} alt="" size="xl" rarity={done ? piece.worn?.rarity : (piece.target ? "Ascended" : piece.worn?.rarity)} />
            ) : (
                <span aria-hidden className="h-16 w-16 rounded-[4px] bg-[var(--fill-2)]" />
            )}

            <div className="min-w-0 space-y-0.5">
                <p className="font-display text-[15px] font-bold text-[var(--ink-hi)]">{slotLabel(piece.slot)}</p>
                <p className="inline-flex items-center gap-1 text-[12px]" style={{ color: look.tone }}>
                    {done ? <Check size={12} aria-hidden /> : <Circle size={10} aria-hidden />}
                    {look.label}
                </p>
            </div>

            <p className="line-clamp-2 min-h-[2.5em] text-[12px] leading-snug text-[var(--ink-low)]">
                {shown?.name ?? "Nothing equipped"}
            </p>

            {/* What it replaces, in the rarity it is now — the reason the card is here. */}
            {!done && piece.worn && piece.target && (
                <p className="text-[11px] text-[var(--ink-faint)]">
                    now:{" "}
                    <span style={{ color: RARITY_COLOUR[piece.worn.rarity ?? ""] ?? "var(--ink-low)" }}>
                        {piece.worn.rarity}
                    </span>
                </p>
            )}

            <div className="mt-auto flex w-full items-center justify-center gap-1 pt-1">
                {piece.state === "craft" && piece.target ? (
                    <ActionLink href={`/gw2/planner?item=${piece.target.item_id}`} tone={GEAR} className="h-9">
                        Plan
                    </ActionLink>
                ) : (
                    <WikiLink wiki={shown?.wiki} name={shown?.name} />
                )}
            </div>
        </div>
    );
}

/**
 * What the pieces still to make draw on, out of one stock.
 *
 * Three views of the same list, as the mockup's tabs: what is still to get,
 * everything the plan uses, and the part already sitting in the bank. One
 * stock, spent once across every piece — six plans reading the same bank would
 * each find the same ectoplasm.
 */
function Materials({ data }: { data: Gw2Ascended }) {
    const [view, setView] = useState<"missing" | "total" | "owned">("missing");
    const [all, setAll] = useState(false);

    const lines = data.materials.filter((m) =>
        view === "missing" ? m.missing > 0 : view === "owned" ? m.owned > 0 : true
    );
    const shown = all ? lines : lines.slice(0, 12);

    return (
        <section className="space-y-4">
            <SectionHeader
                icon={<Package size={18} />}
                tone={GEAR}
                title="Materials"
                description="For the pieces still to craft — bank, material storage and every character's bags counted once."
                meta={
                    <Segmented
                        ariaLabel="Which materials"
                        value={view}
                        onChange={(id) => setView(id as typeof view)}
                        items={[
                            { id: "missing", label: "Still needed", count: data.materials.filter((m) => m.missing > 0).length },
                            { id: "total", label: "Total", count: data.materials.length },
                            { id: "owned", label: "Already yours", count: data.materials.filter((m) => m.owned > 0).length },
                        ]}
                    />
                }
            />

            {shown.length === 0 ? (
                <p className="text-sm text-[var(--ink-low)]">
                    {view === "owned" ? "None of it is on your account yet." : "Nothing left to get."}
                </p>
            ) : (
                <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {shown.map((line) => (
                        <li key={line.currency_id ? `c${line.currency_id}` : line.item_id}>
                            <MaterialTile line={line} view={view} />
                        </li>
                    ))}
                </ul>
            )}

            {lines.length > 12 && (
                <button
                    type="button"
                    onClick={() => setAll(!all)}
                    className="text-xs text-[var(--accent-ink)] hover:underline"
                >
                    {all ? "Show fewer" : `Show all ${lines.length}`}
                </button>
            )}

            {data.prices && (
                <div
                    className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[var(--radius-card)] border px-4 py-3"
                    style={{ borderColor: "var(--line-strong)", background: "var(--surface-1)" }}
                >
                    <span className="inline-flex items-center gap-3">
                        <Coins size={20} aria-hidden style={{ color: "#EAB308" }} />
                        <span>
                            <span className="block text-[11px] text-[var(--ink-low)]">What is missing costs</span>
                            <span className="font-display text-lg font-bold text-[var(--ink-hi)]">{coin(data.prices.buy_now)}</span>
                            <span className="ml-2 text-xs text-[var(--ink-low)]">
                                or {coin(data.prices.bid_and_wait)} bidding and waiting
                            </span>
                        </span>
                    </span>
                    <span className="text-[11px] text-[var(--ink-faint)]">
                        {data.prices.not_tradable.length > 0 &&
                            `${data.prices.not_tradable.length} ${data.prices.not_tradable.length === 1 ? "thing" : "things"} nobody sells are not in it. `}
                        {data.prices.observed_at &&
                            `Trading post as of ${new Date(data.prices.observed_at).toLocaleDateString()}.`}
                    </span>
                </div>
            )}
        </section>
    );
}

function MaterialTile({ line, view }: { line: PlanLine; view: "missing" | "total" | "owned" }) {
    const covered = line.missing === 0;

    return (
        <div
            className="flex h-full items-center gap-3 rounded-[var(--radius-card)] border px-3 py-2.5"
            style={{ background: "var(--surface-1)", borderColor: "var(--line)" }}
        >
            {line.icon ? (
                <GameIcon src={line.icon} alt="" size="md" rarity={line.rarity} />
            ) : (
                <span aria-hidden className="h-9 w-9 shrink-0 rounded-[4px] bg-[var(--fill-2)]" />
            )}
            <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1">
                    <span className="truncate text-[13px] text-[var(--ink-hi)]">{line.name ?? `#${line.item_id}`}</span>
                    <WikiLink wiki={line.wiki} name={line.name} compact />
                </div>
                <Meter value={line.owned} max={line.needed} size="sm" tone={covered ? "var(--success)" : GEAR} segmentLimit={0} />
                <p className="flex justify-between gap-2 text-[11px]">
                    <span className="font-numeric text-[var(--ink-mid)]">
                        {line.currency_id === 1 ? `${coin(line.owned)} / ${coin(line.needed)}` : `${line.owned} / ${line.needed}`}
                    </span>
                    <span style={{ color: covered ? "var(--success)" : "var(--ink-low)" }}>
                        {covered
                            ? "covered"
                            : view === "owned"
                              ? `${line.owned} yours`
                              : line.currency_id === 1
                                ? `${coin(line.missing)} to go`
                                : `${line.missing} needed`}
                    </span>
                </p>
            </div>
        </div>
    );
}

const STEP_ICON: Record<string, React.ReactNode> = {
    equip: <PackageCheck size={16} />,
    discipline: <Hammer size={16} />,
    recipes: <Info size={16} />,
    time_gated: <Hourglass size={16} />,
    buy: <ShoppingCart size={16} />,
    gather: <Package size={16} />,
    craft: <Shield size={16} />,
};

/** The way there, in the order it has to be done. */
function ThePath({ steps }: { steps: Gw2SetStep[] }) {
    return (
        <section className="space-y-4">
            <SectionHeader
                icon={<Target size={18} />}
                tone={GEAR}
                title="The way there"
                description="Built from your plan, in order. A step that does not apply to you is not here."
            />

            <ol className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {steps.map((step, i) => (
                    <li key={step.key}>
                        <StepCard step={step} number={i + 1} />
                    </li>
                ))}
            </ol>
        </section>
    );
}

function StepCard({ step, number }: { step: Gw2SetStep; number: number }) {
    const done = step.state === "done";
    const tone = done ? "var(--success)" : GEAR;

    return (
        <div
            className="flex h-full flex-col gap-2.5 rounded-[var(--radius-panel)] border p-4"
            style={{ background: "var(--surface-1)", borderColor: `color-mix(in srgb, ${tone} 30%, var(--line))` }}
        >
            <div className="flex items-start gap-3">
                <span
                    aria-hidden
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-[13px] font-bold"
                    style={{ background: `color-mix(in srgb, ${tone} 30%, transparent)`, color: "var(--ink-hi)" }}
                >
                    {done ? <Check size={14} /> : number}
                </span>
                <div className="min-w-0">
                    <h3 className="flex items-center gap-1.5 text-[15px] font-semibold leading-snug text-[var(--ink-hi)]">
                        <span aria-hidden style={{ color: tone }}>
                            {STEP_ICON[step.key]}
                        </span>
                        {step.title}
                    </h3>
                    <p className="mt-1 text-[13px] text-[var(--ink-low)]">{step.body}</p>
                </div>
            </div>

            {step.cost && (
                <p className="text-[13px] text-[var(--ink-mid)]">
                    <span className="font-display font-bold text-[var(--ink-hi)]">{coin(step.cost.buy_now)}</span>{" "}
                    <span className="text-[var(--ink-low)]">· {coin(step.cost.bid_and_wait)} bidding</span>
                </p>
            )}

            {step.items && step.items.length > 0 && (
                <ul className="space-y-1">
                    {step.items.slice(0, 6).map((item, i) => (
                        <li key={`${item.name}-${i}`} className="flex items-center gap-1.5 text-[12px] text-[var(--ink-mid)]">
                            <span className="min-w-0 truncate">{item.name ?? "Unnamed"}</span>
                            <WikiLink wiki={item.wiki} name={item.name} compact />
                            {typeof item.missing === "number" && (
                                <span className="ml-auto shrink-0 font-numeric text-[var(--ink-low)]">×{item.missing}</span>
                            )}
                            {item.done_today === true && (
                                <span className="shrink-0 text-[11px] text-[var(--success)]">done today</span>
                            )}
                        </li>
                    ))}
                    {step.items.length > 6 && (
                        <li className="text-[11px] text-[var(--ink-faint)]">and {step.items.length - 6} more</li>
                    )}
                </ul>
            )}

            {step.progress && (
                <div className="mt-auto pt-1">
                    <Meter value={step.progress.current} max={step.progress.target} size="sm" tone={tone} segmentLimit={6} />
                    <p className="mt-1 text-right font-numeric text-[11px] text-[var(--ink-low)]">
                        {step.progress.current} / {step.progress.target}
                    </p>
                </div>
            )}
        </div>
    );
}

function WhyPanel({ guide }: { guide: NonNullable<Gw2Ascended["guide"]> }) {
    return (
        <Gw2Panel icon={<Flame size={18} />} title="Why this matters" tone={GEAR}>
            <div className="space-y-4">
                {guide.standfirst && <p className="text-sm text-[var(--ink-mid)]">{guide.standfirst}</p>}
                <ActionLink href={guide.href} tone={GEAR}>
                    Read: {guide.title}
                </ActionLink>
            </div>
        </Gw2Panel>
    );
}

/**
 * Pieces that turned ascended, by game week.
 *
 * Only what happened between two of our reads. The game keeps no date on any
 * piece of gear, so the chart starts empty and fills from the read after this
 * page arrived — and says so, rather than drawing a line it cannot know.
 */
function ProgressPanel({ data }: { data: Gw2Ascended }) {
    const { weeks, this_week, events } = data.progress;
    const peak = Math.max(1, ...weeks.map((w) => w.pieces));

    return (
        <Gw2Panel
            icon={<BarChart3 size={18} />}
            title="Weekly progress"
            description="Pieces that turned ascended, by game week"
            tone={GEAR}
        >
            <div className="space-y-4">
                <p className="font-display text-2xl font-bold text-[var(--ink-hi)]">
                    +{this_week}
                    <span className="ml-2 text-xs font-normal text-[var(--ink-low)]">this week</span>
                </p>

                <div className="flex h-24 items-end gap-2" role="img" aria-label={`Pieces per week: ${weeks.map((w) => w.pieces).join(", ")}`}>
                    {weeks.map((week) => (
                        <div key={week.starts_at} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                            <div className="flex h-20 w-full items-end">
                                <span
                                    className="block w-full rounded-t-[3px]"
                                    style={{
                                        height: week.pieces > 0 ? `${(week.pieces / peak) * 100}%` : "2px",
                                        background: week.pieces > 0 ? GEAR : "var(--track)",
                                    }}
                                />
                            </div>
                            <span className="truncate text-[10px] text-[var(--ink-faint)]">
                                {new Date(week.starts_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                        </div>
                    ))}
                </div>

                {events.length > 0 ? (
                    <ul className="space-y-2 border-t pt-3" style={{ borderColor: "var(--line)" }}>
                        {events.map((event, i) => (
                            <li key={`${event.item_id}-${i}`} className="flex items-center gap-2.5">
                                <GameIcon src={event.icon} alt="" size="sm" rarity={event.rarity} />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[13px] text-[var(--ink-hi)]">
                                        {event.name ?? (event.slot ? slotLabel(event.slot) : "A piece")}
                                    </span>
                                    {event.slot && <span className="block text-[11px] text-[var(--ink-faint)]">{slotLabel(event.slot)}</span>}
                                </span>
                                <span className="shrink-0 text-[11px] text-[var(--ink-faint)]">
                                    {new Date(event.occurred_at.replace(" ", "T")).toLocaleDateString()}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="border-t pt-3 text-xs text-[var(--ink-low)]" style={{ borderColor: "var(--line)" }}>
                        No piece has turned ascended between two of our reads yet. Guild Wars 2 keeps no date on gear, so
                        we count from the read after this page arrived — nothing earlier can be recovered.
                    </p>
                )}
            </div>
        </Gw2Panel>
    );
}

function RelatedPanel({ related }: { related: Gw2Ascended["related"] }) {
    return (
        <Gw2Panel icon={<Target size={18} />} title="Related goals" description="What an ascended set feeds into">
            <ul className="space-y-4">
                {related.map((goal) => {
                    const tone = domainTone(goal.domain);

                    return (
                        <li key={goal.slug}>
                            <Link href={goal.href} className="group block space-y-1.5">
                                <span className="flex items-baseline justify-between gap-3">
                                    <span className="text-sm text-[var(--ink-hi)] group-hover:text-[var(--accent-ink)]">
                                        {goal.title}
                                    </span>
                                    {goal.current !== null && goal.target !== null && (
                                        <span className="shrink-0 font-numeric text-xs text-[var(--ink-mid)]">
                                            {goal.current} / {goal.target}
                                        </span>
                                    )}
                                </span>
                                <span className="block text-[11px] text-[var(--ink-low)]">{goal.label}</span>
                                {goal.current !== null && goal.target !== null && (
                                    <Meter value={goal.current} max={goal.target} size="sm" tone={tone} />
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </Gw2Panel>
    );
}
