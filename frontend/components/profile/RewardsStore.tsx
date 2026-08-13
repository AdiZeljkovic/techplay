"use client";

import { useMemo, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { Coins, Award, Frame, Palette, Sparkles, Ticket, Package, Loader2, Check, Lock, HelpCircle, ChevronDown, TrendingUp, TrendingDown, ShoppingBag , type LucideIcon } from "lucide-react";
import Panel from "@/components/ui/Panel";
import EmptyState from "@/components/ui/EmptyState";
import Segmented from "@/components/ui/Segmented";
import { useCountUp } from "@/hooks/useCountUp";
import { getStorageUrl } from "@/lib/imageUrl";
import type {
    BountyWallet, StoreCatalog, StoreItem, StoreRarity } from "@/lib/types/profile";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

/**
 * Rarity is the store's reading order — the eye should find the legendary
 * before it reads a single word.
 */
const RARITY: Record<StoreRarity, { label: string; color: string }> = {
    common: { label: "Common", color: "#9ca3af" },
    uncommon: { label: "Uncommon", color: "#34d399" },
    rare: { label: "Rare", color: "#60a5fa" },
    epic: { label: "Epic", color: "#a855f7" },
    legendary: { label: "Legendary", color: "#f0b429" } };

const TYPE_ICONS: Record<string, LucideIcon> = {
    frame: Frame, theme: Palette, badge: Award, perk: Sparkles, discount: Ticket, physical: Package };

type SortId = "featured" | "cheap" | "expensive" | "rarity";

const SORTS: { id: SortId; label: string }[] = [
    { id: "featured", label: "Featured" },
    { id: "cheap", label: "Price: low to high" },
    { id: "expensive", label: "Price: high to low" },
    { id: "rarity", label: "Rarity" },
];

const RARITY_ORDER: StoreRarity[] = ["legendary", "epic", "rare", "uncommon", "common"];

/* ── card art ─────────────────────────────────────────────────────────── */

/**
 * Every item gets real artwork without a single upload: the cosmetic's own
 * colour, drawn as the thing it actually is — a ring for a frame, a field for
 * a theme, a crest for a badge. `image` takes over the moment one is set.
 */
function ItemArt({ item }: { item: StoreItem }) {
    const tint = RARITY[item.rarity]?.color ?? RARITY.common.color;
    const paint = item.value || tint;
    const Icon = TYPE_ICONS[item.type] ?? Sparkles;
    const percent = /(\d+)\s*%/.exec(item.name)?.[1];

    if (item.image) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={getStorageUrl(item.image)} alt="" aria-hidden loading="lazy" className="w-full h-full object-cover" />
        );
    }

    return (
        <span className="relative w-full h-full flex items-center justify-center">
            <span
                aria-hidden
                className="absolute inset-0"
                style={{ background: `radial-gradient(circle at 50% 45%, color-mix(in srgb, ${tint} 26%, transparent), transparent 70%)` }}
            />

            {item.type === "frame" && (
                <span className="relative w-[76px] h-[76px] rounded-full p-[4px]" style={{ background: paint }}>
                    <span className="block w-full h-full rounded-full bg-[var(--surface-0)]" />
                </span>
            )}

            {item.type === "theme" && (
                <span className="relative flex flex-col items-center gap-2">
                    <span className="block w-[84px] h-[34px] rounded-[8px]" style={{ background: paint }} />
                    <span className="flex gap-1.5">
                        {[0.7, 0.45, 0.25].map((o) => (
                            <span key={o} className="block w-[24px] h-[6px] rounded-full" style={{ background: paint, opacity: o }} />
                        ))}
                    </span>
                </span>
            )}

            {item.type === "badge" && (
                <span
                    className="relative w-[70px] h-[78px] flex items-center justify-center"
                    style={{ background: paint, clipPath: "polygon(50% 0%, 100% 22%, 100% 70%, 50% 100%, 0% 70%, 0% 22%)" }}
                >
                    <span
                        className="w-[58px] h-[66px] flex items-center justify-center bg-[var(--surface-0)]"
                        style={{ clipPath: "polygon(50% 0%, 100% 22%, 100% 70%, 50% 100%, 0% 70%, 0% 22%)" }}
                    >
                        <Award className="w-7 h-7" style={{ color: paint }} />
                    </span>
                </span>
            )}

            {item.type === "discount" && (
                <span
                    className="relative flex items-center justify-center w-[96px] h-[54px] rounded-[8px] border-2 border-dashed"
                    style={{ borderColor: tint, background: `color-mix(in srgb, ${tint} 12%, transparent)` }}
                >
                    <span className="font-display text-[21px] font-black" style={{ color: tint }}>
                        {percent ? `${percent}%` : <Ticket className="w-7 h-7" />}
                    </span>
                </span>
            )}

            {!["frame", "theme", "badge", "discount"].includes(item.type) && (
                <Icon className="relative w-11 h-11" style={{ color: tint }} />
            )}
        </span>
    );
}

/* ── the shelf, while it is empty ─────────────────────────────────────── */

/**
 * The catalogue is live and buyable, and the artwork for it is not finished —
 * every cosmetic is currently a generated placeholder standing in for a thing
 * that has not been drawn. Selling those would spend real bounty on art that
 * is about to change underneath the people who bought it.
 *
 * So the shelf is closed and says so. The wallet above it and the ledger below
 * stay open, because the point of closing the shelf rather than hiding the tab
 * is that bounty keeps accruing while it is shut — a page that says "come back
 * with a balance" is worth more than one that is not there.
 *
 * Reopening is this constant. When the art lands, flip it; nothing else about
 * the store was removed.
 */
const STORE_OPEN = false;

function StoreComingSoon() {
    const soon: { type: string; label: string; blurb: string }[] = [
        { type: "frame", label: "Frames", blurb: "Rings for your portrait" },
        { type: "theme", label: "Themes", blurb: "Repaint your profile" },
        { type: "badge", label: "Badges", blurb: "Worn beside your name" },
        { type: "perk", label: "Perks", blurb: "Things the site does for you" },
        { type: "discount", label: "Discounts", blurb: "Codes for the shop" },
    ];

    return (
        <section
            className="relative overflow-hidden rounded-[var(--radius-panel)] border p-8 md:p-10"
            style={{ background: "var(--surface-2)", borderColor: "var(--line-strong)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)" }}
        >
            <span
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(60% 110% at 50% 0%, color-mix(in srgb, var(--accent) 11%, transparent), transparent 62%)" }}
            />

            <div className="relative text-center max-w-[560px] mx-auto">
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)]">
                    <ShoppingBag className="w-7 h-7" strokeWidth={1.5} />
                </span>

                <h2 className="mt-5 font-display text-[24px] md:text-[28px] font-black uppercase tracking-tight text-white leading-none">
                    The store opens soon
                </h2>
                <p className="mt-3 text-[13px] text-white/45 leading-relaxed">
                    We are drawing the rewards properly before putting a price on them. Keep earning — your bounty is
                    banked, it does not expire, and your tier climbs on what you earn whether or not there is anything
                    to spend it on yet.
                </p>
            </div>

            {/* What is coming, as the shape it will arrive in. */}
            <div className="relative mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {soon.map(({ type, label, blurb }) => {
                    const Icon = TYPE_ICONS[type] ?? Sparkles;

                    return (
                        <div
                            key={type}
                            className="flex flex-col items-center gap-2 rounded-[12px] border border-dashed border-white/[0.1] bg-white/[0.015] px-3 py-5 text-center"
                        >
                            <Icon className="w-[26px] h-[26px] text-white/25" strokeWidth={1.5} />
                            <span className="font-display text-[10.5px] font-black uppercase tracking-[0.14em] text-white/45">{label}</span>
                            <span className="text-[10.5px] text-white/25 leading-snug">{blurb}</span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

/* ── one store card ───────────────────────────────────────────────────── */

function StoreCard({
    item, busy, onBuy, onEquip }: {
    item: StoreItem;
    busy: boolean;
    onBuy: () => void;
    onEquip: () => void;
}) {
    const rarity = RARITY[item.rarity] ?? RARITY.common;
    const legendary = item.rarity === "legendary";

    return (
        <div
            className="group relative flex flex-col rounded-[12px] overflow-hidden border transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5"
            style={{
                borderColor: `color-mix(in srgb, ${rarity.color} ${item.owned ? 40 : 22}%, transparent)`,
                background: "var(--surface-1)",
                boxShadow: legendary ? `0 0 0 1px color-mix(in srgb, ${rarity.color} 18%, transparent)` : undefined }}
        >
            <span className="relative flex h-[124px] bg-[var(--surface-0)] overflow-hidden">
                <ItemArt item={item} />

                <span
                    className="absolute top-2.5 left-2.5 inline-flex items-center h-[19px] px-2 rounded-[4px] font-display text-[8px] font-black uppercase tracking-[0.12em]"
                    style={item.owned
                        ? { background: "#34d399", color: "#04140d" }
                        : { background: rarity.color, color: "var(--surface-0)" }}
                >
                    {item.owned ? "Owned" : rarity.label}
                </span>

                {item.limited && !item.owned && (
                    <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 h-[19px] px-2 rounded-[4px] bg-black/60 backdrop-blur-sm font-display text-[8px] font-black uppercase tracking-[0.12em] text-white/70">
                        {item.stock != null ? `${item.stock} left` : "Limited"}
                    </span>
                )}

                <span aria-hidden className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--surface-1)] to-transparent" />
            </span>

            <span className="flex flex-col flex-1 p-3.5">
                <span className="block font-display text-[13.5px] font-bold text-white leading-snug line-clamp-1">{item.name}</span>
                {item.description && (
                    <span className="block mt-1 text-[11.5px] text-white/40 leading-snug line-clamp-2 min-h-[30px]">
                        {item.description}
                    </span>
                )}

                <span className="mt-3 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-display text-[14px] font-black tabular-nums text-amber-400">
                            {item.cost.toLocaleString("en-US")}
                        </span>
                    </span>

                    {item.owned ? (
                        item.source === "cosmetic" ? (
                            <button
                                onClick={onEquip}
                                disabled={busy || item.equipped}
                                className={`inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-[6px] font-display text-[9.5px] font-black uppercase tracking-[0.1em] transition-colors disabled:opacity-100 ${
                                    item.equipped ? "text-emerald-400" : "bg-white/[0.07] hover:bg-white/[0.13] text-white"
                                }`}
                            >
                                {item.equipped ? <><Check className="w-3 h-3" /> Equipped</> : "Equip"}
                            </button>
                        ) : (
                            <span className="inline-flex items-center gap-1 font-display text-[9.5px] font-black uppercase tracking-[0.1em] text-emerald-400">
                                <Check className="w-3 h-3" /> Owned
                            </span>
                        )
                    ) : item.tier_locked ? (
                        <span
                            title={`Requires the ${item.required_tier} supporter tier`}
                            className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-[6px] bg-white/[0.05] font-display text-[9px] font-black uppercase tracking-[0.08em] text-white/40"
                        >
                            <Lock className="w-3 h-3" /> {item.required_tier}
                        </span>
                    ) : item.sold_out ? (
                        <span className="inline-flex items-center h-[26px] px-2.5 rounded-[6px] bg-white/[0.05] font-display text-[9px] font-black uppercase tracking-[0.08em] text-white/35">
                            Sold out
                        </span>
                    ) : (
                        <button
                            onClick={onBuy}
                            disabled={busy || !item.affordable}
                            className={`inline-flex items-center gap-1.5 h-[26px] px-3 rounded-[6px] font-display text-[9.5px] font-black uppercase tracking-[0.1em] transition-[filter,background] ${
                                item.affordable
                                    ? "bg-[var(--accent)] hover:brightness-110 text-white"
                                    : "bg-white/[0.05] text-white/30 cursor-not-allowed"
                            }`}
                        >
                            {busy && <Loader2 className="w-3 h-3 animate-spin" />}
                            {item.affordable ? "Redeem" : <><Lock className="w-3 h-3" /> Short</>}
                        </button>
                    )}
                </span>
            </span>
        </div>
    );
}

/* ── the wallet ───────────────────────────────────────────────────────── */

/**
 * Balance, what it came from, and where you stand on the ladder — one banner.
 *
 * These were three things in three places: a hero across the top, a Wallet
 * Breakdown panel in the rail repeating the balance under a different
 * heading, and a Reward Tiers panel behind a toggle that opened a grid of
 * eight cards. Between them the balance was stated three times on one page,
 * four counting the tab strip above it.
 *
 * The ladder is a rail rather than a grid of cards. A ladder is a line you
 * are somewhere on; drawn as eight tiles it became a table of thresholds you
 * had to read to work out which one was yours. Rungs behind you are full, the
 * one ahead fills as you earn toward it, and the tier you are on stands
 * taller and lit.
 */
function WalletBanner({ wallet, onHelp }: { wallet: BountyWallet; onHelp: () => void }) {
    const balance = useCountUp(wallet.balance, 1200);
    const tier = wallet.tier;
    const here = wallet.ladder.findIndex((r) => r.name === tier.name);

    return (
        <div className="relative overflow-hidden rounded-[var(--radius-panel)] border border-amber-500/[0.18]">
            <span
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(70% 130% at 8% 0%, rgba(240,180,41,0.12), transparent 60%)" }}
            />
            <span aria-hidden className="absolute inset-x-0 top-0 h-[2px]" style={{ background: "linear-gradient(90deg, #f0b429, rgba(240,180,41,0.18) 60%, transparent)" }} />

            <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-px" style={{ background: "var(--line)" }}>
                {/* what you can spend */}
                <div className="flex items-center gap-5 p-6" style={{ background: "var(--surface-2)" }}>
                    {/* The coin, alone. It sat inside two drawn rings and a
                        radial glow, which left a 46px object at the centre of
                        an 84px target — the rings were the thing you saw and
                        the icon was what they were pointing at. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/images/profile/v2-bounty.webp"
                        alt=""
                        aria-hidden
                        className="w-[84px] h-[84px] shrink-0 object-contain"
                        style={{ filter: "drop-shadow(0 6px 20px rgba(240,180,41,0.28))" }}
                    />

                    <div className="min-w-0">
                        <p className="font-display text-[9.5px] font-bold uppercase tracking-[0.18em] text-amber-400/70">
                            Spendable
                        </p>
                        <p className="mt-1.5 font-display text-[38px] font-black tabular-nums leading-none text-amber-400">
                            {balance.toLocaleString("en-US")}
                        </p>

                        <p className="mt-3 flex items-center gap-4 font-display text-[10px] font-bold uppercase tracking-[0.1em] tabular-nums">
                            <span className="inline-flex items-center gap-1.5 text-emerald-400/80">
                                <TrendingUp className="w-3.5 h-3.5" /> {wallet.earned_lifetime.toLocaleString("en-US")}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-red-400/70">
                                <TrendingDown className="w-3.5 h-3.5" /> {wallet.spent_lifetime.toLocaleString("en-US")}
                            </span>
                        </p>
                    </div>
                </div>

                {/* where you stand */}
                <div className="flex items-center gap-5 p-6" style={{ background: "var(--surface-2)" }}>
                    {/* The rank insignia we already draw everywhere else.
                        A hollow hexagon with a roman numeral in it was a
                        placeholder for exactly this art, and the reward
                        families are named after the ranks — Bronze, Silver,
                        Gold, Platinum — so the crest already exists. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={`/images/ranks/${tier.family.toLowerCase()}.webp`}
                        alt={tier.family}
                        className="w-[86px] h-[86px] shrink-0 object-contain"
                        style={{ filter: `drop-shadow(0 6px 20px color-mix(in srgb, ${tier.color} 35%, transparent))` }}
                    />

                    <div className="min-w-0 flex-1">
                        <p className="flex items-baseline justify-between gap-3">
                            <span className="font-display text-[9.5px] font-bold uppercase tracking-[0.18em] text-white/40">Reward tier</span>
                            <button
                                onClick={onHelp}
                                className="shrink-0 inline-flex items-center gap-1 font-display text-[9px] font-bold uppercase tracking-[0.12em] text-white/30 hover:text-white transition-colors"
                            >
                                <HelpCircle className="w-3 h-3" /> How bounty works
                            </button>
                        </p>
                        <p className="mt-1 font-display text-[21px] font-black uppercase tracking-[0.02em] leading-none" style={{ color: tier.color }}>
                            {tier.name}
                        </p>

                        {/* the ladder */}
                        <div className="mt-3 flex items-end gap-[3px]" aria-hidden>
                            {wallet.ladder.map((rung, i) => {
                                const passed = i <= here;
                                const next = i === here + 1;
                                const current = i === here;

                                return (
                                    <span
                                        key={rung.name}
                                        title={`${rung.name} · ${rung.at.toLocaleString("en-US")} earned`}
                                        className="flex-1 rounded-[2px] overflow-hidden transition-[height] duration-500"
                                        style={{
                                            height: current ? 15 : 9,
                                            background: passed ? rung.color : "rgba(255,255,255,0.07)",
                                            boxShadow: current ? `0 0 14px color-mix(in srgb, ${rung.color} 65%, transparent)` : undefined,
                                        }}
                                    >
                                        {/* the rung ahead fills as you earn toward it */}
                                        {next && (
                                            <span
                                                className="block h-full transition-[width] duration-700"
                                                style={{ width: `${tier.progress}%`, background: rung.color, opacity: 0.55 }}
                                            />
                                        )}
                                    </span>
                                );
                            })}
                        </div>

                        <p className="mt-2.5 flex items-baseline justify-between gap-3 font-display text-[10px] font-bold uppercase tracking-[0.1em] tabular-nums">
                            <span className="text-white/30">{wallet.earned_lifetime.toLocaleString("en-US")} earned</span>
                            <span className="text-white/45">
                                {tier.next ? (
                                    <><span className="text-white">{tier.remaining.toLocaleString("en-US")}</span> to {tier.next.name}</>
                                ) : (
                                    "Top of the ladder"
                                )}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* Daily Missions used to sit here as well as in the overview's Daily Hub,
   which is the owner's landing page and the natural home for anything with a
   deadline. One of the two had to go, and it was not going to be the one on
   the page people open first. */

/* ── the tab ──────────────────────────────────────────────────────────── */

export default function RewardsStore({ username, isOwnProfile }: { username: string; isOwnProfile: boolean }) {
    const { data: catalogRes, mutate: mutateCatalog } = useSWR<{ data: StoreCatalog }>(
        isOwnProfile ? "/rewards/catalog" : null, fetcher
    );
    const { data: walletRes, mutate: mutateWallet } = useSWR<{ data: BountyWallet }>(
        isOwnProfile ? "/bounty" : null, fetcher
    );

    const [busy, setBusy] = useState<string | null>(null);
    const [category, setCategory] = useState<string>("all");
    const [sort, setSort] = useState<SortId>("featured");
    const [showHelp, setShowHelp] = useState(false);

    const catalog = catalogRes?.data;
    const wallet = walletRes?.data;
    const items = useMemo(() => catalog?.items ?? [], [catalog]);

    const visible = useMemo(() => {
        // "Owned" is a shelf of the same bar rather than a panel of its own.
        // An Owned Cosmetics panel in the rail listed exactly the items whose
        // cards already say Owned and Equipped, three feet to the left.
        const filtered = items.filter((i) =>
            category === "all" ? true
                : category === "owned" ? i.owned
                : category === "Limited" ? i.limited
                : i.category === category
        );

        return [...filtered].sort((a, b) => {
            switch (sort) {
                case "cheap": return a.cost - b.cost;
                case "expensive": return b.cost - a.cost;
                case "rarity": return RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
                default:
                    // Featured: what you can act on first, rarest of those first.
                    if (a.owned !== b.owned) return a.owned ? 1 : -1;
                    if (a.affordable !== b.affordable) return a.affordable ? -1 : 1;
                    return RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
            }
        });
    }, [items, category, sort]);

    const refresh = () => {
        mutateCatalog();
        mutateWallet();
        globalMutate(`/users/${username}`);
    };

    const buy = async (item: StoreItem) => {
        setBusy(item.key);
        try {
            await axios.post(item.purchase.path);
            toast.success(`Redeemed: ${item.name}`);
            refresh();
        } catch (e: any) {
            toast.error(e?.response?.data?.message ?? "Redemption failed.");
        } finally {
            setBusy(null);
        }
    };

    const equip = async (item: StoreItem) => {
        setBusy(item.key);
        try {
            await axios.post(`/customizations/${item.id}/equip`);
            toast.success(`${item.name} equipped`);
            refresh();
        } catch {
            toast.error("Couldn't equip that.");
        } finally {
            setBusy(null);
        }
    };

    if (!isOwnProfile) {
        return <EmptyState icon={<ShoppingBag className="w-[18px] h-[18px]" />} title="The store is private" body="Rewards are only visible on your own profile." />;
    }

    if (!catalog || !wallet) {
        return (
            <div className="space-y-4">
        <div className="h-[168px] rounded-[var(--radius-panel)] bg-white/[0.04] animate-pulse" />
        <div className="h-9 w-[420px] max-w-full rounded-[10px] bg-white/[0.04] animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {[...Array(12)].map((_, i) => <div key={i} className="h-[262px] rounded-[12px] bg-white/[0.04] animate-pulse" />)}
        </div>
    </div>
);
    }

    return (
// One column. The store had a nine-and-three split whose rail carried
// a second copy of the balance, a list of the redemptions already in
// the ledger below, and an inventory of the items whose own cards say
// Owned — three panels of restatement taking a quarter of the width
// off the only thing on the page you can act on.
<div className="space-y-4">
        <WalletBanner wallet={wallet} onHelp={() => setShowHelp((v) => !v)} />

        {showHelp && (
            <Panel
                title="How bounty works"
                action={{ label: "Close", onClick: () => setShowHelp(false) }}
            >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[12.5px] text-white/50 leading-relaxed">
                    <p>
                        <span className="block font-display text-[10px] font-black uppercase tracking-[0.12em] text-white mb-1.5">Earning</span>
                        Bounty lands alongside XP — reading articles, commenting, posting on the forum, adding and
                        finishing games, and completing daily missions.
                    </p>
                    <p>
                        <span className="block font-display text-[10px] font-black uppercase tracking-[0.12em] text-white mb-1.5">Spending</span>
                        Everything in the store will cost Bounty and nothing else. Cosmetics are yours permanently;
                        coupons and perks are consumed when used.
                    </p>
                    <p>
                        <span className="block font-display text-[10px] font-black uppercase tracking-[0.12em] text-white mb-1.5">Tiers</span>
                        Your reward tier climbs on Bounty earned over your whole time here, so spending never sets
                        you back. Bounty does not expire.
                    </p>
                </div>
            </Panel>
        )}

        {STORE_OPEN ? (
            <>
                {/* ── filters ── */}
                <div className="flex items-center gap-2">
                    <Segmented
                        ariaLabel="Filter the store"
                        value={category}
                        onChange={setCategory}
                        className="flex-1 min-w-0"
                        items={[
                            { id: "all", label: "All", count: items.length },
                            ...catalog.categories.map((c) => ({ id: c.id, label: c.label, count: c.count })),
                            { id: "owned", label: "Owned", count: items.filter((i) => i.owned).length, dot: "#34d399" },
                        ]}
                    />

                    <div className="relative shrink-0">
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortId)}
                            className="h-8 pl-3 pr-7 rounded-[7px] bg-white/[0.04] border border-white/[0.08] text-[12px] text-white/70 appearance-none focus:outline-none cursor-pointer"
                        >
                            {SORTS.map((s) => <option key={s.id} value={s.id}>Sort: {s.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                    </div>
                </div>

                {/* ── grid ── */}
                {visible.length === 0 ? (
                    <EmptyState variant="compact" title="Nothing on this shelf" body="Try another category." />
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                        {visible.map((item) => (
                            <StoreCard
                                key={item.key}
                                item={item}
                                busy={busy === item.key}
                                onBuy={() => buy(item)}
                                onEquip={() => equip(item)}
                            />
                        ))}
                    </div>
                )}
            </>
        ) : (
            <StoreComingSoon />
        )}
        </div>
    );
}
