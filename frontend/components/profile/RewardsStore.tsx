"use client";

import { useMemo, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { Coins, Award, Frame, Palette, Sparkles, Ticket, Package, Loader2, History, Check, Lock, HelpCircle, ChevronRight, ChevronDown, Target, Clock3, TrendingUp, TrendingDown, ShoppingBag, type LucideIcon } from "lucide-react";
import Panel from "@/components/ui/Panel";
import EmptyState from "@/components/ui/EmptyState";
import { useCountUp } from "@/hooks/useCountUp";
import { getStorageUrl } from "@/lib/imageUrl";
import { timeAgo, timeLeft } from "@/lib/timeAgo";
import type {
    BountyWallet, RewardRedemption, StoreCatalog, StoreItem, StoreRarity,
} from "@/lib/types/profile";

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
    legendary: { label: "Legendary", color: "#f0b429" },
};

const TYPE_ICONS: Record<string, LucideIcon> = {
    frame: Frame, theme: Palette, badge: Award, perk: Sparkles, discount: Ticket, physical: Package,
};

type SortId = "featured" | "cheap" | "expensive" | "rarity";

const SORTS: { id: SortId; label: string }[] = [
    { id: "featured", label: "Featured" },
    { id: "cheap", label: "Price: low to high" },
    { id: "expensive", label: "Price: high to low" },
    { id: "rarity", label: "Rarity" },
];

const RARITY_ORDER: StoreRarity[] = ["legendary", "epic", "rare", "uncommon", "common"];

interface Quest {
    id: number;
    name: string;
    criteria_value: number;
    bounty_reward: number;
    progress: number;
    completed: boolean;
    expires_at: string | null;
}

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

/* ── one store card ───────────────────────────────────────────────────── */

function StoreCard({
    item, busy, onBuy, onEquip,
}: {
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
                boxShadow: legendary ? `0 0 0 1px color-mix(in srgb, ${rarity.color} 18%, transparent)` : undefined,
            }}
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

/* ── wallet hero ──────────────────────────────────────────────────────── */

function WalletHero({ wallet, onOpenTiers }: { wallet: BountyWallet; onOpenTiers: () => void }) {
    const balance = useCountUp(wallet.balance, 1200);
    const tier = wallet.tier;

    return (
        <div className="relative overflow-hidden rounded-[var(--radius-panel)] border border-amber-500/[0.18] bg-[var(--surface-2)]">
            <span
                aria-hidden
                className="absolute inset-0"
                style={{ background: "radial-gradient(120% 140% at 10% 0%, rgba(240,180,41,0.10), transparent 55%)" }}
            />

            <div className="relative grid grid-cols-1 lg:grid-cols-2">
                <div className="flex items-center gap-5 p-6">
                    <span className="relative w-[92px] h-[92px] shrink-0">
                        <span aria-hidden className="absolute inset-0 rounded-full border-2 border-amber-500/30" />
                        <span aria-hidden className="absolute inset-[7px] rounded-full border border-amber-400/20" />
                        <span
                            aria-hidden
                            className="absolute inset-[14px] rounded-full"
                            style={{ background: "radial-gradient(circle, rgba(240,180,41,0.22), transparent 70%)" }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center">
                            <Coins className="w-9 h-9 text-amber-400" />
                        </span>
                    </span>

                    <div className="min-w-0">
                        <p className="font-display text-[9.5px] font-bold uppercase tracking-[0.18em] text-amber-400/70">
                            Bounty Wallet
                        </p>
                        <p className="mt-1 flex items-baseline gap-2.5">
                            <span className="font-display text-[38px] font-black tabular-nums leading-none text-amber-400">
                                {balance.toLocaleString("en-US")}
                            </span>
                            <span className="font-display text-[13px] font-black uppercase tracking-[0.14em] text-white/45">
                                Bounty
                            </span>
                        </p>
                        <p className="mt-2 text-[12px] text-white/40 leading-snug">
                            Earn Bounty by being active across TechPlay — reading, playing, posting and finishing quests.
                        </p>
                    </div>
                </div>

                <div className="relative flex items-center gap-5 p-6 border-t lg:border-t-0 lg:border-l border-white/[0.06]">
                    <span
                        className="relative w-[62px] h-[70px] shrink-0 flex items-center justify-center"
                        style={{ background: tier.color, clipPath: "polygon(50% 0%, 100% 22%, 100% 70%, 50% 100%, 0% 70%, 0% 22%)" }}
                    >
                        <span
                            className="w-[52px] h-[60px] flex items-center justify-center bg-[var(--surface-2)]"
                            style={{ clipPath: "polygon(50% 0%, 100% 22%, 100% 70%, 50% 100%, 0% 70%, 0% 22%)" }}
                        >
                            <span className="font-display text-[15px] font-black" style={{ color: tier.color }}>
                                {tier.numeral}
                            </span>
                        </span>
                    </span>

                    <div className="min-w-0 flex-1">
                        <p className="font-display text-[9.5px] font-bold uppercase tracking-[0.18em] text-white/40">Reward Tier</p>
                        <p className="mt-0.5 flex items-baseline justify-between gap-3">
                            <span className="font-display text-[21px] font-black uppercase tracking-[0.02em] leading-none" style={{ color: tier.color }}>
                                {tier.name}
                            </span>
                            {tier.next && (
                                <span className="font-display text-[11px] font-bold tabular-nums text-white/40 whitespace-nowrap">
                                    {wallet.earned_lifetime.toLocaleString("en-US")} / {tier.next.at.toLocaleString("en-US")}
                                </span>
                            )}
                        </p>

                        <span className="block mt-2.5 h-[7px] rounded-full bg-[var(--track)] overflow-hidden">
                            <span
                                className="block h-full rounded-full transition-[width] duration-700 ease-[var(--ease-hud)]"
                                style={{ width: `${tier.progress}%`, background: `linear-gradient(90deg, ${tier.color}90, ${tier.color})` }}
                            />
                        </span>

                        <p className="mt-2.5 flex items-center justify-between gap-3">
                            <span className="text-[11.5px] text-white/45">
                                {tier.next ? (
                                    <>Earn <span className="font-bold text-white">{tier.remaining.toLocaleString("en-US")}</span> more to reach {tier.next.name}</>
                                ) : (
                                    "Top of the ladder — nothing left to climb."
                                )}
                            </span>
                            <button
                                onClick={onOpenTiers}
                                className="shrink-0 inline-flex items-center gap-1 h-[26px] px-2.5 rounded-[6px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.09] font-display text-[9px] font-black uppercase tracking-[0.1em] text-white/70 transition-colors"
                            >
                                View tiers <ChevronRight className="w-3 h-3" />
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TierLadder({ wallet, onClose }: { wallet: BountyWallet; onClose: () => void }) {
    return (
        <Panel title="Reward tiers" action={{ label: "Close", onClick: onClose }}>
            <p className="mb-4 text-[12px] text-white/40 leading-snug">
                Tiers climb on Bounty <span className="text-white font-semibold">earned</span>, never on Bounty held — spending
                in the store can never cost you a tier.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {wallet.ladder.map((rung) => {
                    const reached = wallet.earned_lifetime >= rung.at;
                    const current = rung.name === wallet.tier.name;
                    return (
                        <div
                            key={rung.name}
                            className="flex items-center gap-2.5 p-2.5 rounded-[9px] border"
                            style={{
                                borderColor: current ? rung.color : "rgba(255,255,255,0.07)",
                                background: reached ? `color-mix(in srgb, ${rung.color} 9%, transparent)` : "rgba(255,255,255,0.015)",
                            }}
                        >
                            <span className="w-2 h-8 rounded-full shrink-0" style={{ background: reached ? rung.color : "rgba(255,255,255,0.1)" }} />
                            <span className="min-w-0">
                                <span className="block font-display text-[11.5px] font-bold" style={{ color: reached ? rung.color : "rgba(255,255,255,0.45)" }}>
                                    {rung.name}
                                </span>
                                <span className="block font-display text-[10px] font-bold tabular-nums text-white/30">
                                    {rung.at.toLocaleString("en-US")} earned
                                </span>
                            </span>
                        </div>
                    );
                })}
            </div>
        </Panel>
    );
}

/* ── sidebar pieces ───────────────────────────────────────────────────── */

function WalletBreakdown({ wallet, onHelp }: { wallet: BountyWallet; onHelp: () => void }) {
    const row = (label: string, value: number, tint: string, icon: React.ReactNode) => (
        <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[12px] text-white/50">{icon}{label}</span>
            <span className="font-display text-[12.5px] font-black tabular-nums" style={{ color: tint }}>
                {value.toLocaleString("en-US")}
            </span>
        </div>
    );

    return (
        <Panel title="Wallet Breakdown">
            <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-white/[0.07]">
                    <span className="flex items-center gap-2 text-[12.5px] font-semibold text-white">
                        <Coins className="w-3.5 h-3.5 text-amber-400" /> Total Bounty
                    </span>
                    <span className="font-display text-[15px] font-black tabular-nums text-amber-400">
                        {wallet.balance.toLocaleString("en-US")}
                    </span>
                </div>
                {row("Earned (lifetime)", wallet.earned_lifetime, "#34d399", <TrendingUp className="w-3.5 h-3.5 text-emerald-400/60" />)}
                {row("Spent (lifetime)", wallet.spent_lifetime, "#f87171", <TrendingDown className="w-3.5 h-3.5 text-red-400/60" />)}
            </div>

            <button
                onClick={onHelp}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 h-9 rounded-[8px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] font-display text-[10px] font-bold uppercase tracking-[0.1em] text-white/60 transition-colors"
            >
                <HelpCircle className="w-3.5 h-3.5" /> How bounty works
            </button>
        </Panel>
    );
}

function DailyBounties() {
    const { data } = useSWR<{ data: Quest[] }>("/user/quests", fetcher, { revalidateOnFocus: false });
    const quests = (data?.data ?? []).filter((q) => q.bounty_reward > 0).slice(0, 4);

    if (quests.length === 0) return null;

    const soonest = quests.map((q) => q.expires_at).filter(Boolean).sort()[0];

    return (
        <Panel
            title="Daily Missions"
            meta={soonest ? (
                <span className="inline-flex items-center gap-1.5 font-display text-[10px] font-bold tabular-nums text-amber-400/80">
                    <Clock3 className="w-3.5 h-3.5" /> {timeLeft(soonest)}
                </span>
            ) : undefined}
        >
            <div className="space-y-3">
                {quests.map((q) => {
                    const pct = Math.min(100, Math.round((q.progress / Math.max(1, q.criteria_value)) * 100));
                    return (
                        <div key={q.id} className="flex items-center gap-3">
                            <span className={`w-7 h-7 shrink-0 rounded-[7px] flex items-center justify-center ${q.completed ? "bg-emerald-500/15" : "bg-white/[0.05]"}`}>
                                {q.completed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Target className="w-3.5 h-3.5 text-white/35" />}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="flex items-center justify-between gap-2">
                                    <span className="text-[12px] font-semibold text-white/80 truncate">{q.name}</span>
                                    <span className="font-display text-[10px] font-bold tabular-nums text-white/30 shrink-0">
                                        {Math.min(q.progress, q.criteria_value)}/{q.criteria_value}
                                    </span>
                                </span>
                                <span className="block mt-1.5 h-[4px] rounded-full bg-[var(--track)] overflow-hidden">
                                    <span
                                        className="block h-full rounded-full"
                                        style={{ width: `${pct}%`, background: q.completed ? "#34d399" : "var(--accent)" }}
                                    />
                                </span>
                            </span>
                            <span className="shrink-0 inline-flex items-center gap-1 font-display text-[11px] font-black tabular-nums text-amber-400">
                                <Coins className="w-3 h-3" /> {q.bounty_reward}
                            </span>
                        </div>
                    );
                })}
            </div>
        </Panel>
    );
}

/* ── the tab ──────────────────────────────────────────────────────────── */

export default function RewardsStore({ username, isOwnProfile }: { username: string; isOwnProfile: boolean }) {
    const { data: catalogRes, mutate: mutateCatalog } = useSWR<{ data: StoreCatalog }>(
        isOwnProfile ? "/rewards/catalog" : null, fetcher
    );
    const { data: walletRes, mutate: mutateWallet } = useSWR<{ data: BountyWallet }>(
        isOwnProfile ? "/bounty" : null, fetcher
    );
    const { data: redemptionsRes } = useSWR<{ data: RewardRedemption[] }>(
        isOwnProfile ? "/rewards/redemptions" : null, fetcher
    );

    const [busy, setBusy] = useState<string | null>(null);
    const [category, setCategory] = useState<string>("all");
    const [sort, setSort] = useState<SortId>("featured");
    const [showTiers, setShowTiers] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const catalog = catalogRes?.data;
    const wallet = walletRes?.data;
    const items = useMemo(() => catalog?.items ?? [], [catalog]);

    const visible = useMemo(() => {
        const filtered = items.filter((i) =>
            category === "all" ? true : category === "Limited" ? i.limited : i.category === category
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

    const ownedCosmetics = useMemo(() => items.filter((i) => i.owned && i.source === "cosmetic"), [items]);

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
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    {[...Array(10)].map((_, i) => <div key={i} className="h-[262px] rounded-[12px] bg-white/[0.04] animate-pulse" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
            <div className="xl:col-span-9 min-w-0 space-y-4">
                <WalletHero wallet={wallet} onOpenTiers={() => setShowTiers((v) => !v)} />

                {showTiers && <TierLadder wallet={wallet} onClose={() => setShowTiers(false)} />}

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
                                Everything on this page costs Bounty and nothing else. Cosmetics are yours permanently;
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

                {/* ── filters ── */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            onClick={() => setCategory("all")}
                            className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full font-display text-[10.5px] font-bold uppercase tracking-[0.08em] transition-colors ${
                                category === "all" ? "bg-[var(--accent)] text-white" : "bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.08]"
                            }`}
                        >
                            All <span className={category === "all" ? "text-white/70" : "text-white/25"}>{items.length}</span>
                        </button>
                        {catalog.categories.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setCategory(c.id)}
                                className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full font-display text-[10.5px] font-bold uppercase tracking-[0.08em] transition-colors ${
                                    category === c.id ? "bg-[var(--accent)] text-white" : "bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.08]"
                                }`}
                            >
                                {c.label} <span className={category === c.id ? "text-white/70" : "text-white/25"}>{c.count}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex-1" />

                    <div className="relative">
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
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
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

                {/* ── history ── */}
                <Panel title="Bounty History" padding="none">
                    {wallet.transactions.length === 0 ? (
                        <div className="p-5">
                            <EmptyState variant="compact" title="No bounty movement yet" body="Everything you earn and spend is logged here." />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[620px] text-left">
                                <thead>
                                    <tr className="border-b border-white/[0.07]">
                                        {["Type", "Description", "Amount", "Date", "Balance"].map((h, i) => (
                                            <th
                                                key={h}
                                                className={`px-5 py-2.5 font-display text-[9px] font-bold uppercase tracking-[0.14em] text-white/35 ${i > 1 ? "text-right" : ""}`}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {wallet.transactions.slice(0, 8).map((t) => {
                                        const earned = t.amount > 0;
                                        return (
                                            <tr key={t.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.015] transition-colors">
                                                <td className="px-5 py-2.5">
                                                    <span className={`inline-flex items-center gap-1.5 font-display text-[10.5px] font-bold ${earned ? "text-emerald-400" : "text-red-400"}`}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                        {earned ? "Earned" : "Redeemed"}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-2.5 text-[12px] text-white/60 max-w-[280px] truncate">{t.reason ?? "—"}</td>
                                                <td className={`px-5 py-2.5 text-right font-display text-[12px] font-black tabular-nums ${earned ? "text-emerald-400" : "text-red-400"}`}>
                                                    {earned ? "+" : ""}{t.amount.toLocaleString("en-US")}
                                                </td>
                                                <td className="px-5 py-2.5 text-right text-[11.5px] tabular-nums text-white/35 whitespace-nowrap">
                                                    {timeAgo(t.created_at)}
                                                </td>
                                                <td className="px-5 py-2.5 text-right font-display text-[12px] font-bold tabular-nums text-white/70">
                                                    {t.balance_after.toLocaleString("en-US")}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Panel>
            </div>

            {/* ── sidebar ── */}
            <aside className="xl:col-span-3 min-w-0 space-y-4">
                <WalletBreakdown wallet={wallet} onHelp={() => setShowHelp((v) => !v)} />

                <Panel title="Recently Redeemed">
                    {(redemptionsRes?.data ?? []).length === 0 ? (
                        <EmptyState variant="compact" title="Nothing redeemed yet" />
                    ) : (
                        <div className="space-y-3">
                            {(redemptionsRes?.data ?? []).slice(0, 4).map((r) => (
                                <div key={r.id} className="flex items-center gap-3">
                                    <span className="w-9 h-9 shrink-0 rounded-[8px] bg-white/[0.04] flex items-center justify-center overflow-hidden">
                                        {r.reward_item?.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={getStorageUrl(r.reward_item.image)} alt="" aria-hidden className="w-full h-full object-cover" />
                                        ) : (
                                            <Sparkles className="w-4 h-4 text-white/25" />
                                        )}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[12.5px] font-bold text-white truncate">
                                            {r.reward_item?.name ?? "Reward"}
                                        </span>
                                        <span className="block font-display text-[9.5px] font-bold uppercase tracking-[0.1em] text-white/30">
                                            {timeAgo(r.created_at)}
                                        </span>
                                    </span>
                                    <span className="shrink-0 font-display text-[11.5px] font-black tabular-nums text-red-400">
                                        -{r.cost.toLocaleString("en-US")}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </Panel>

                <Panel
                    title="Owned Cosmetics"
                    meta={<span className="font-display text-[11px] font-black tabular-nums text-white/35">{ownedCosmetics.length}</span>}
                >
                    {ownedCosmetics.length === 0 ? (
                        <EmptyState variant="compact" title="No cosmetics yet" body="Redeem a frame or theme to start your inventory." />
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {ownedCosmetics.slice(0, 7).map((c) => (
                                <span
                                    key={c.key}
                                    title={`${c.name}${c.equipped ? " · equipped" : ""}`}
                                    className="relative w-[42px] h-[42px] rounded-[9px] border flex items-center justify-center overflow-hidden"
                                    style={{
                                        borderColor: c.equipped ? "#34d399" : `color-mix(in srgb, ${RARITY[c.rarity]?.color ?? "#9ca3af"} 40%, transparent)`,
                                        background: "var(--surface-1)",
                                    }}
                                >
                                    <span className="w-[26px] h-[26px] rounded-full" style={{ background: c.value ?? RARITY[c.rarity]?.color }} />
                                </span>
                            ))}
                            {ownedCosmetics.length > 7 && (
                                <span className="w-[42px] h-[42px] rounded-[9px] border border-white/[0.08] flex items-center justify-center font-display text-[11px] font-black text-white/40">
                                    +{ownedCosmetics.length - 7}
                                </span>
                            )}
                        </div>
                    )}
                </Panel>

                <DailyBounties />
            </aside>
        </div>
    );
}
