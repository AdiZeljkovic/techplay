import axiosInstance from "@/lib/axios";

/**
 * The Guild Wars 2 advisor, from the browser's side.
 *
 * Everything here is a client-side call through `lib/axios`, which attaches the
 * Bearer token. That is deliberate and not a shortcut: the dashboard is per
 * account, the token lives in `localStorage`, and there is no server-side session
 * to render it from — the same constraint every signed-in page on this site has.
 *
 * What the backend guarantees, and what these types therefore rely on: **no
 * request from this file reaches ArenaNet.** The game's rate limit is counted per
 * IP and every request the site makes leaves from one server, so a page that
 * fetched from the game on render would spend the whole site's budget on whoever
 * happened to open it. The dashboard reads tables a queued job filled hours ago.
 */

/** Certainty a recommendation carries. `hidden` never reaches the browser. */
export type Confidence = "confirmed" | "high" | "medium" | "needs_confirmation";

/** What the player is being asked to spend. `null` means the rule does not say. */
export type Effort = "quick" | "session" | "long" | null;

export interface Recommendation {
    key: string;
    domain: string;
    title: string;
    body: string;
    subject: string;
    confidence: Confidence;
    effort: Effort;
    /**
     * What stands in the way, in the order it must be cleared.
     *
     * Not an error and not a reason to hide the card. "This needs ascended gear
     * first" is often the most useful sentence on the page — it just ranks below
     * something the player can go and do right now.
     */
    blockers: string[];
    score: number;
}

export interface MasteryRegion {
    region: string;
    earned: number;
    spent: number;
    unspent: number;
    /**
     * Summed from the catalogue's per-tier point costs, not chosen.
     *
     * The tier costs climb steeply — Itzel Lore runs 1, 2, 3, 5, 8, 12 — so this
     * denominator is real work to compute and is the reason the catalogue is
     * mirrored locally at all.
     */
    points_spent?: number;
    points_total?: number;
    percent?: number;
    tracks_finished?: number;
    /** A count. The masteries payload's `tracks` is the list itself. */
    track_count?: number;
    affordable?: {
        id: number;
        name: string;
        tier: string | null;
        buying_tier: number;
        tiers: number;
        cost: number | null;
        points_remaining: number;
    }[];
}

export interface VaultObjective {
    id: number;
    title: string;
    period: "daily" | "weekly";
    track: string;
    acclaim: number;
    current: number;
    target: number;
}

export interface NearlyDone {
    id: number;
    name: string | null;
    requirement: string | null;
    current: number;
    max: number;
    remaining: number;
    /** Whether a person has checked this row. Some achievements are seasonal or retired. */
    reviewed: boolean;
    effort: string | null;
}

export interface MasteryTrackView {
    id: number;
    name: string;
    requirement: string | null;
    tiers_paid: number;
    tiers: number;
    tier_costs: number[];
    tier_names: string[];
    next_tier: string | null;
    next_cost: number | null;
    points_spent: number;
    points_total: number;
    points_remaining: number;
    finished: boolean;
    /** Nothing paid for. Different from a track sitting at its first tier. */
    untouched: boolean;
    /** Whether this region's spare points reach the next tier. */
    affordable: boolean;
}

export interface MasteryRegionView extends MasteryRegion {
    points_spent: number;
    points_total: number;
    percent: number;
    tracks: MasteryTrackView[];
}

export interface Gw2Masteries {
    regions: MasteryRegionView[];
    unspent_total: number;
    /**
     * Tracks the catalogue holds that no account region claims.
     *
     * The game names regions differently in its two endpoints — the catalogue
     * says `Maguuma`, the account says `Heart of Thorns` — and one catalogue
     * region has no counterpart at all. Rather than file its points under a
     * guessed expansion, those tracks are listed apart and the page says why.
     */
    unpaired: { id: number; name: string; catalogue_region: string | null; tiers: number; points_total: number }[];
    observed_at: string | null;
}

export interface Gw2ItemSummary {
    id: number;
    name: string;
    rarity: string | null;
    type: string | null;
    level: number;
    icon: string | null;
}

export interface PlanLine {
    item_id: number;
    name: string | null;
    rarity: string | null;
    icon: string | null;
    needed: number;
    owned: number;
    missing: number;
}

export interface PlanNode extends PlanLine {
    craftable: boolean;
    disciplines: string[];
    min_rating: number;
    recipe_was_chosen: boolean;
    depth: number;
    children: PlanNode[];
}

export interface Gw2Plan {
    target: Gw2ItemSummary & { item_id: number; quantity: number };
    craftable: boolean;
    already_have: number;
    tree: PlanNode;
    /**
     * The part worth acting on — leaves only.
     *
     * Intermediates are interesting to look at and useless to shop for: nobody
     * buys a steel ingot they are about to make out of ore they already have.
     */
    shopping_list: PlanLine[];
    disciplines_used: string[];
    /** Whether anybody on the account can make it, and at what rating. */
    requires: { disciplines: string[]; min_rating: number; have_it: boolean } | null;
    /**
     * Always null, and the field exists to say so.
     *
     * Trading post prices are live market data we do not mirror, so the mockup's
     * "18g 42s estimated remaining cost" would have been a number nobody
     * computed. A materials plan is what this is.
     */
    prices: null;
    observed_at: string | null;
}

export interface SessionStep {
    key: string;
    subject: string;
    domain: string;
    title: string;
    body: string;
    confidence: Confidence;
    effort: Effort;
    blockers: string[];
    /**
     * An editorial estimate, never a measurement — the game reports the
     * duration of nothing. Null means nobody has judged this rule yet, and the
     * UI must render that as silence rather than as zero.
     */
    minutes_low: number | null;
    minutes_high: number | null;
    /** Minutes from the start of the session, or null when there is no estimate. */
    starts_at: number | null;
    costs: number | null;
}

export interface Priority {
    key: string;
    label: string;
    current: number;
    target: number;
    unit: string;
    note?: string;
}

export interface ScheduledEvent {
    name: string;
    slug: string;
    kind: string;
    region: string | null;
    waypoint: string | null;
    rewards: string | null;
    minutes_away: number;
    live_now: boolean;
}

export interface Gw2Tonight {
    plan: {
        minutes: number | null;
        steps: SessionStep[];
        /** The same recommendations, below the line the budget drew. */
        if_you_have_longer: SessionStep[];
        accounted_for: number;
        /**
         * How much of the stated time the estimates do not cover.
         *
         * Shown rather than hidden: a plan filling eighteen minutes of a stated
         * hour is saying something true about how much we actually know.
         */
        unaccounted: number | null;
        estimates_are_ours: true;
    };
    priorities: Priority[];
    /**
     * Empty until somebody enters and verifies the times.
     *
     * There is no schedule endpoint in the game's API — /v2/account/worldbosses
     * says which ones you killed today, never when the next one spawns. A wrong
     * spawn time sends a player to an empty map, so an empty panel is the better
     * failure.
     */
    events: ScheduledEvent[];
    observed_at: string | null;
}

export interface Gw2Dashboard {
    account: {
        name: string;
        fractal_level: number | null;
        daily_ap: number | null;
        wvw_rank: number | null;
        characters: number;
        expansions: string[];
        observed_at: string | null;
        last_full_sync_at: string | null;
        featured_character: {
            name: string;
            profession: string | null;
            race: string | null;
            level: number;
        } | null;
    };
    cards: {
        masteries: {
            unspent_total: number;
            regions: MasteryRegion[];
            tracks_started: number;
            tracks_finished: number;
            tracks_total: number;
        };
        /** `null` when no character has been read yet. */
        gear: {
            character: string;
            ascended_core: number;
            core_slots: number;
            below_ascended: string[];
            empty: string[];
            ascended_weapons: number;
            weapon_slots: number;
            slots: Record<string, string>;
            crafting: string[];
        } | null;
        fractals: {
            personal_level: number | null;
            agony_resistance: number;
            tier_4_target: number;
            shortfall: number;
            /**
             * Always false, and the flag exists to say so out loud: the per-scale
             * Agony Resistance requirements are not in the game's API and are not
             * in our catalogue, so only the Tier 4 target is modelled. A tier
             * verdict drawn from a guessed table would be the first invented
             * number in this tool.
             */
            tiers_modelled: boolean;
        } | null;
        achievements: {
            nearly_done: number;
            one_step_away: number;
            daily_ap: number | null;
            closest: NearlyDone[];
        };
        /**
         * `null` means the key has no `progression` permission, which is not the
         * same as an empty vault. The UI must be able to tell those apart, or a
         * player with a narrow key is shown a vault with nothing in it.
         */
        vault: {
            daily: { progress: number; target: number; claimed: boolean };
            weekly: { progress: number; target: number; claimed: boolean };
            unclaimed_acclaim: number;
            open: VaultObjective[];
        } | null;
    };
    advice: {
        headline: Recommendation[];
        alternatives: Recommendation[];
        /** How many candidates the engine weighed. Distinguishes "nothing matched" from "the cut was harsh". */
        considered: number;
    };
    since_last_sync: {
        events: { type: string; id: number | null; name: string | null; occurred_at: string }[];
        /**
         * When we started watching.
         *
         * It bounds the history above, and it has to be shown: the game's API has
         * no lifetime view of raid clears or world bosses, so nothing before this
         * date exists anywhere and never will.
         */
        tracked_since: string | null;
    };
    connection: Gw2Connection;
}

export interface Gw2Connection {
    connected: true;
    account_name: string | null;
    key_name: string | null;
    permissions: string[];
    /** Permission name → the feature that goes dark without it. */
    missing_features: Record<string, string>;
    sync_status: string | null;
    sync_error: string | null;
    last_synced_at: string | null;
    last_full_sync_at: string | null;
    world: number | null;
    fractal_level: number | null;
    access: string[];
    characters: number;
}

/** What the player asked for. Every field optional; the empty case is normal. */
export interface Gw2Intent {
    minutes?: number | null;
    goal?: string | null;
    avoid?: string[];
}

interface Envelope<T> {
    success: boolean;
    data: T;
    message?: string;
}

/**
 * The connection, or `null` when there is none.
 *
 * A missing connection is the expected first answer, not a failure, so it does
 * not throw — the page draws the connect form instead.
 */
export async function getConnection(): Promise<Gw2Connection | null> {
    const { data } = await axiosInstance.get<Envelope<Gw2Connection | null>>("/gw2/connection");

    return data.data ?? null;
}

/**
 * The dashboard.
 *
 * Returns `null` while a freshly connected account is still being read — the
 * backend answers with the connection alone for the half minute the queued sync
 * takes, and the page says so rather than drawing an empty dashboard that looks
 * broken.
 */
export async function getDashboard(intent?: Gw2Intent): Promise<Gw2Dashboard | null> {
    const params = new URLSearchParams();

    if (intent?.minutes) params.set("minutes", String(intent.minutes));
    if (intent?.goal) params.set("goal", intent.goal);
    // Laravel reads repeated `avoid[]` keys as an array; a comma-joined string
    // would arrive as one domain named "vault,gear".
    for (const domain of intent?.avoid ?? []) params.append("avoid[]", domain);

    const query = params.toString();
    const { data } = await axiosInstance.get<Envelope<Gw2Dashboard | { connection: Gw2Connection }>>(
        `/gw2/dashboard${query ? `?${query}` : ""}`
    );

    return "cards" in data.data ? (data.data as Gw2Dashboard) : null;
}

export async function getMasteries(): Promise<Gw2Masteries | null> {
    const { data } = await axiosInstance.get<Envelope<Gw2Masteries | null>>("/gw2/masteries");

    return data.data ?? null;
}

export async function searchItems(q: string): Promise<Gw2ItemSummary[]> {
    const { data } = await axiosInstance.get<Envelope<Gw2ItemSummary[]>>(
        `/gw2/items?q=${encodeURIComponent(q)}`
    );

    return data.data ?? [];
}

export async function getPlan(itemId: number, quantity = 1): Promise<Gw2Plan> {
    const { data } = await axiosInstance.get<Envelope<Gw2Plan>>(
        `/gw2/plan?item_id=${itemId}&quantity=${quantity}`
    );

    return data.data;
}

export async function getTonight(minutes?: number | null): Promise<Gw2Tonight | null> {
    const { data } = await axiosInstance.get<Envelope<Gw2Tonight | null>>(
        `/gw2/tonight${minutes ? `?minutes=${minutes}` : ""}`
    );

    return data.data ?? null;
}

export async function connectKey(apiKey: string): Promise<Gw2Connection> {
    // In the body, never the query string: a URL ends up in access logs, in
    // referrers and in error reports, and a read-only key is still somebody's
    // account.
    const { data } = await axiosInstance.post<Envelope<Gw2Connection>>("/gw2/connect", {
        api_key: apiKey.trim(),
    });

    return data.data;
}

export async function requestSync(full = false): Promise<Gw2Connection> {
    const { data } = await axiosInstance.post<Envelope<Gw2Connection>>(
        `/gw2/sync${full ? "?full=1" : ""}`
    );

    return data.data;
}

export async function disconnect(): Promise<void> {
    await axiosInstance.delete("/gw2/connection");
}

/** Slot names come back as the game spells them: `Ring1`, `WeaponA1`, `Backpack`. */
export function slotLabel(slot: string): string {
    const named: Record<string, string> = {
        Ring1: "Ring 1",
        Ring2: "Ring 2",
        Accessory1: "Accessory 1",
        Accessory2: "Accessory 2",
        Backpack: "Back item",
        Coat: "Chest",
    };

    return named[slot] ?? slot;
}

/**
 * How sure we are, in words a reader can act on.
 *
 * The labels matter more than they look. `needs_confirmation` is not weak advice,
 * it is a question — and a card worded as a statement when we are guessing is the
 * failure mode this whole scale exists to prevent.
 */
export const CONFIDENCE_LABEL: Record<Confidence, string> = {
    confirmed: "Confirmed",
    high: "Very likely",
    medium: "Worth doing",
    needs_confirmation: "Worth a look",
};

export const EFFORT_LABEL: Record<string, string> = {
    quick: "A few minutes",
    session: "An evening",
    long: "A longer project",
};
