"use client";

import toast from "react-hot-toast";
import Chip from "@/components/ui/Chip";
import Select from "@/components/ui/Select";
import StatCards from "@/components/gw2/StatCards";
import RecommendationCard, { type WornPiece } from "@/components/gw2/RecommendationCard";
import GameIcon, { RARITY_COLOUR } from "@/components/gw2/GameIcon";
import WikiLink from "@/components/gw2/WikiLink";
import { EasyWins, TonightTeaser } from "@/components/gw2/DashboardRail";
import { Gw2Panel, SectionHeader } from "@/components/gw2/Gw2Ui";
import { chooseCharacter, gw2Error, slotLabel, type Gw2Dashboard } from "@/lib/gw2";

/**
 * The dashboard, once an account has been read — mockup 1.
 *
 * Readouts across the top, the three best recommendations in the middle with
 * the way to the rest of them, and two panels on the right: the first hour of
 * tonight's plan and the easy wins. Choosing a goal, a time budget and what to
 * leave out lives on its own page now (`/gw2/next`), where the full list is;
 * here the advice is weighed for the pinned goal, if there is one, and nothing
 * else.
 *
 * And there is no completion score anywhere. One figure over five unrelated
 * domains would have to invent both its weights and its denominator.
 */
export default function DashboardView({
    dashboard,
    onRefresh,
}: {
    dashboard: Gw2Dashboard;
    onRefresh: () => void;
}) {
    const { cards, advice } = dashboard;
    const pieces = wornPieces(cards.gear);

    return (
        <div className="space-y-6">
            <CharacterBar dashboard={dashboard} onChanged={onRefresh} />

            <StatCards dashboard={dashboard} />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-6">
                    <section className="space-y-4">
                        <SectionHeader
                            title="Recommended next steps"
                            description="From your account, your goals and what is open right now."
                            action={{ href: "/gw2/next", label: "View all recommendations" }}
                        />

                        {advice.headline.length === 0 ? (
                            <p className="py-6 text-center text-sm text-[var(--ink-low)]">
                                {advice.considered === 0
                                    ? "Nothing matched right now — which usually means your account is in good shape."
                                    : "Everything we weighed was filtered out."}
                            </p>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-3">
                                {advice.headline.map((recommendation, i) => (
                                    <RecommendationCard
                                        key={recommendation.key + recommendation.subject}
                                        recommendation={recommendation}
                                        featured={i === 0}
                                        pieces={recommendation.domain === "gear" ? pieces : undefined}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {cards.gear && <GearPanel gear={cards.gear} />}
                </div>

                <div className="space-y-5">
                    <TonightTeaser />
                    <EasyWins wins={cards.achievements.closest} oneStepAway={cards.achievements.one_step_away} />
                </div>
            </div>
        </div>
    );
}

/** Armour first, then trinkets — the order the game's hero panel shows them in. */
const CORE_SLOTS = [
    "Helm", "Shoulders", "Coat", "Gloves", "Leggings", "Boots",
    "Backpack", "Amulet", "Ring1", "Ring2", "Accessory1", "Accessory2",
];

/** The twelve core slots as worn pieces, for the row under a gear card. */
export function wornPieces(gear: Gw2Dashboard["cards"]["gear"]): WornPiece[] {
    if (!gear) return [];

    return CORE_SLOTS.filter((slot) => slot in gear.slots).map((slot) => ({
        slot,
        icon: gear.items?.[slot]?.icon ?? null,
        rarity: gear.slots[slot],
        done: gear.slots[slot] === "Ascended" || gear.slots[slot] === "Legendary",
    }));
}

/**
 * Which character the cards are about.
 *
 * We rank by level and gear until told otherwise, which is a reasonable guess
 * and still a guess — a veteran with fifteen characters has a main, and nothing
 * in the API says which. One character needs no control, only its name.
 */
export function CharacterBar({ dashboard, onChanged }: { dashboard: Gw2Dashboard; onChanged: () => void }) {
    const current = dashboard.account.featured_character;
    const characters = dashboard.characters ?? [];

    if (!current) return null;

    const chosen = dashboard.featured_character ?? "";

    async function pick(name: string) {
        try {
            await chooseCharacter(name || null);
            onChanged();
        } catch (e: unknown) {
            toast.error(gw2Error(e, "We could not change the character just now."));
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <span className="text-xs font-medium text-[var(--ink-low)]">Advice is about</span>

            {characters.length > 1 ? (
                <Select
                    value={chosen}
                    onChange={(name) => void pick(name)}
                    ariaLabel="Character the advice is about"
                    className="h-9 min-w-[220px] px-3 text-[13px]"
                    options={[
                        {
                            value: "",
                            // Named, so the reader can see what our guess is
                            // before deciding whether to overrule it.
                            label: `Our pick — ${chosen ? "by level and gear" : current.name}`,
                        },
                        ...characters.map((c) => ({
                            value: c.name,
                            label: `${c.name} — ${[c.profession, `level ${c.level}`].filter(Boolean).join(", ")}`,
                        })),
                    ]}
                />
            ) : (
                <span className="text-[var(--ink-hi)]">{current.name}</span>
            )}
        </div>
    );
}

function GearPanel({ gear }: { gear: NonNullable<Gw2Dashboard["cards"]["gear"]> }) {
    return (
        <Gw2Panel
            title={`${gear.character} — equipment`}
            description={`${gear.ascended_core} of ${gear.core_slots} core slots ascended · ${gear.ascended_weapons} of ${gear.weapon_slots} weapons`}
        >
            {/*
             * Twelve slots as twelve worn pieces rather than twelve words.
             *
             * The frame is the game's own rarity colour — a player reads pink
             * for ascended and orange for exotic faster than either word, and
             * "which three are behind" is the only question this panel exists
             * to answer.
             */}
            <div className="grid grid-cols-2 gap-x-5 gap-y-2.5 sm:grid-cols-3">
                {Object.entries(gear.slots).map(([slot, rarity]) => {
                    const done = rarity === "Ascended" || rarity === "Legendary";
                    const item = gear.items?.[slot];

                    return (
                        <div key={slot} className="flex items-center gap-2.5">
                            <GameIcon src={item?.icon} alt="" size="md" rarity={rarity} dim={done} />
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-xs text-[var(--ink-low)]">{slotLabel(slot)}</div>
                                <div
                                    className="truncate text-xs"
                                    style={{ color: done ? "var(--ink-mid)" : RARITY_COLOUR[rarity] }}
                                    title={item?.name}
                                >
                                    {item?.name ?? rarity}
                                </div>
                            </div>
                            <WikiLink wiki={item?.wiki} name={item?.name} compact />
                        </div>
                    );
                })}
            </div>

            {gear.empty.length > 0 && (
                <p className="mt-3 text-xs text-[var(--accent-ink)]">
                    Nothing equipped in: {gear.empty.map(slotLabel).join(", ")}
                </p>
            )}

            {gear.crafting.length === 0 && (
                <p className="mt-3 text-xs text-[var(--ink-low)]">
                    No crafting discipline is active on this character — ascended armour and weapons are
                    crafted.
                </p>
            )}

            {gear.crafting.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {gear.crafting.map((discipline) => (
                        <Chip key={discipline} variant="neutral" size="sm">
                            {discipline}
                        </Chip>
                    ))}
                </div>
            )}
        </Gw2Panel>
    );
}
