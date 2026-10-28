import axiosInstance from "@/lib/axios";
import type { InsightMap, InsightRegion } from "@/lib/gw2public";

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

/**
 * Where something lives on the official GW2 Wiki, built by the backend from our
 * own catalogue. Items carry their chat code — exact, and still useful in game
 * when the wiki is down; everything else is a search for its exact name.
 */
export interface Gw2WikiLink {
    url: string;
    chat_link: string | null;
}

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
    /**
     * Structured extras, absent on most cards.
     *
     * Kept apart from the sentence rather than folded into it because the
     * steps carry an index each, and the index is what lets a client line the
     * remaining ones up against the full list. A comma-separated string would
     * lose that.
     */
    details?: {
        /**
         * The thing the card is about, pictured.
         *
         * The exotic ring for a gear card, the achievement for an achievement
         * card, the mount for a mount card. Absent where nothing specific
         * applies, and then the card draws its domain glyph instead.
         */
        icon?: string;
        /** Named alongside the icon where the subject is an item. */
        item?: string;
        /** A mastery track's scene render. */
        background?: string;
        steps_total?: number;
        /** Only what is left. The wording is the game's own. */
        steps_remaining?: { index: number; text: string | null }[];
        /** The wiki page for what the card is about. */
        wiki?: Gw2WikiLink;
        /**
         * How far along the card's subject is, counted off the account: nine
         * of twelve slots ascended, 20 of 150 Agony Resistance. Absent where
         * there is nothing to count towards — spent against earned points is
         * not a goal anybody has.
         */
        progress?: { current: number; target: number; unit: string | null };
        /**
         * The page of ours that answers the card, for the button at its foot.
         * Absent rather than vague: a guide is linked only while it is
         * published, and a card about one achievement has its wiki link instead.
         */
        action?: { href: string; label: string };
    };
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
    /**
     * The achievement's own picture, or its category's.
     *
     * Only about a sixth of achievements carry one; every category does, and
     * the fallback takes coverage to roughly 92%. Null for the rest.
     */
    icon: string | null;
    /** The game's own wording for what is left, where it gave any. */
    steps_remaining: string[];
    wiki?: Gw2WikiLink | null;
    /** Achievement points that finishing pays. Null where the catalogue has no tiers for it. */
    points?: number | null;
    /** The region a mastery point lands in, in the account's spelling, when the achievement pays one. */
    mastery_region?: string | null;
}

export interface MasteryTrackView {
    id: number;
    name: string;
    requirement: string | null;
    tiers_paid: number;
    tiers: number;
    tier_costs: number[];
    tier_names: string[];
    /** One icon per tier, from the game. */
    tier_icons: string[];
    /**
     * A scene render for the track.
     *
     * The only art at this scale the API publishes, and what lets a mastery
     * row look like the place it is about. Null on a track that has none.
     */
    background: string | null;
    wiki?: Gw2WikiLink | null;
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

/**
 * One map of a region, for the zone map on the masteries page: its frame in
 * continent coordinates and its insights, ticked where the account has them.
 * `collected` is null when the read had no unlocked list — not the same as none.
 */
export interface InsightZone {
    id: number;
    name: string;
    slug: string;
    continent_rect: [[number, number], [number, number]] | null;
    total: number;
    collected: number | null;
    insights: { id: number; coord: [number, number] | null; collected: boolean | null }[];
}

/**
 * Where a region's next mastery point is: an insight on the map, or an
 * achievement close to done whose rewards name the region.
 *
 * `reach` is a straight line from the nearest waypoint, in bands set from the
 * measured spread — never a time.
 */
export type PointToGet =
    | {
          kind: "insight";
          id: number;
          map_id: number;
          map: string;
          map_slug: string;
          coord: [number, number] | null;
          waypoint: string | null;
          chat_link: string | null;
          distance: number | null;
          reach: "close" | "walk" | "far" | null;
      }
    | {
          kind: "achievement";
          id: number;
          name: string | null;
          icon: string | null;
          current: number;
          max: number;
          remaining: number;
          points: number | null;
          next_step: string | null;
          wiki?: Gw2WikiLink | null;
      };

export interface MasteryRegionView extends MasteryRegion {
    points_spent: number;
    points_total: number;
    percent: number;
    tracks: MasteryTrackView[];
    /** More points that would buy everything here. Zero: another point would sit unspent. */
    points_needed: number;
    points_to_get: PointToGet[];
    zones: InsightZone[];
}

export interface Gw2Masteries {
    regions: MasteryRegionView[];
    unspent_total: number;
    /** False when the read had no unlocked insight list, so none can be called missing. */
    insights_known: boolean;
    /** The achievements closest to done, with what finishing pays. */
    easy_wins: NearlyDone[];
    /**
     * Tracks the catalogue holds that no account region claims.
     *
     * The game names regions differently in its two endpoints — the catalogue
     * says `Maguuma`, the account says `Heart of Thorns` — and one catalogue
     * region has no counterpart at all. Rather than file its points under a
     * guessed expansion, those tracks are listed apart and the page says why.
     */
    unpaired: {
        id: number;
        name: string;
        catalogue_region: string | null;
        tiers: number;
        points_total: number;
        wiki?: Gw2WikiLink | null;
    }[];
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
    /** A wallet currency in a Mystic Forge recipe; `item_id` is 0 then. */
    currency_id?: number | null;
    name: string | null;
    rarity: string | null;
    icon: string | null;
    wiki?: Gw2WikiLink;
    needed: number;
    owned: number;
    missing: number;
}

export interface PlanNode extends PlanLine {
    craftable: boolean;
    disciplines: string[];
    min_rating: number;
    recipe_was_chosen: boolean;
    /** Taught by a recipe sheet: learned or not. Null when it comes with the discipline, or is unknown. */
    recipe_learned?: boolean | null;
    /** Made in the Mystic Forge from a sourced recipe. Null for everything else. */
    forge?: {
        source_url: string | null;
        source_label: string | null;
        /** The date the source vouches for — a dataset's, or an editor's check. */
        checked_at: string | null;
        /** The forge is random for this one; `attempts` is the average needed. */
        random: boolean;
        attempts: number;
        /** Other recipes for the same item; the planned one uses what the account holds most of. */
        other_recipes?: number;
    } | null;
    depth: number;
    children: PlanNode[];
}

export interface Gw2Plan {
    target: Gw2ItemSummary & { item_id: number; quantity: number; wiki?: Gw2WikiLink };
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
     * Recipes taught by a sheet that the plan needs and the account has not
     * learned. Null when the account's recipes were not read — which is not
     * the same as none missing.
     */
    recipes_to_learn?: {
        recipe_id: number;
        item_id: number;
        name: string | null;
        icon: string | null;
        disciplines: string[];
        wiki?: Gw2WikiLink;
    }[] | null;
    /**
     * Two buckets that must not be added together.
     *
     * §13.2 forbids collapsing gold and account-bound requirements into one
     * cost, and the price endpoint is the authority on which is which: 27,997
     * of the catalogue's 74,265 items appear in it, and an item absent from it
     * cannot be bought at any price. So `not_tradable` is a list, never a sum.
     *
     * Null when no prices have been loaded — saying nothing beats reporting a
     * total of zero, which reads as "free".
     */
    prices: {
        /** Copper. Buying outright at the lowest sell order. */
        buy_now: number;
        /** Copper. Bidding at the highest buy order and waiting. */
        bid_and_wait: number;
        tradable: {
            item_id: number;
            name: string | null;
            missing: number;
            sell_unit: number | null;
            buy_unit: number | null;
            sell_quantity: number;
        }[];
        not_tradable: { item_id: number; name: string | null; missing: number; wiki?: Gw2WikiLink }[];
        /** Wallet currencies a forge recipe still needs. No rate to gold, so never summed. */
        currencies?: { currency_id: number; name: string | null; missing: number }[];
        observed_at: string | null;
    } | null;
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
    wiki?: Gw2WikiLink | null;
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
    /** The waypoint's name. */
    waypoint: string | null;
    /** Its chat code, to paste in game. */
    waypoint_chat_link?: string | null;
    rewards: string | null;
    minutes_away: number;
    live_now: boolean;
    /** From this account's own read: killed since the daily reset. Null for anything that is not a world boss. */
    killed_today?: boolean | null;
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
    /** Moved here from the dashboard in the redesign of 28 October 2026 — what resets tonight, on the page about tonight. */
    vault?: Gw2Dashboard["cards"]["vault"];
    season?: Gw2VaultSeason | null;
    today?: Gw2Today;
    observed_at: string | null;
}

export interface RaidWing {
    raid: string;
    wing: string;
    wiki?: Gw2WikiLink | null;
    encounters: {
        id: string;
        name: string;
        type: string;
        cleared_this_week: boolean;
        ever_cleared: boolean;
        wiki?: Gw2WikiLink | null;
    }[];
    bosses: number;
    cleared_this_week: number;
    /** Since the day the account connected, never before — the API keeps no history. */
    ever_cleared: number;
}

export interface Gw2Content {
    raids: { wings: RaidWing[]; cleared_this_week: number; bosses_total: number };
    world_bosses: {
        bosses: { id: string; name: string; killed_today: boolean; ever_killed: boolean; wiki?: Gw2WikiLink | null }[];
        killed_today: number;
        total: number;
    };
    dungeons: {
        dungeons: {
            id: string;
            name: string;
            wiki?: Gw2WikiLink | null;
            paths: { id: string; name: string; type: string; run_today: boolean }[];
            run_today: number;
        }[];
        paths_today: number;
    };
    /**
     * Where the "ever" column starts.
     *
     * Not decoration. The game reports raids for the current week and bosses for
     * the current day and has no lifetime view of either, so everything before
     * this date is unknown to us and unknowable — an account connected yesterday
     * would otherwise appear to have done nothing in nine years of play.
     */
    tracked_since: string | null;
    observed_at: string | null;
}

/**
 * The public reference — read on the server, with no token.
 *
 * Everything here is the same for every player, so these are plain fetches
 * against the API with the internal header rather than calls through the
 * authenticated axios client. That is what lets the pages be server-rendered
 * and indexed: a crawler has no localStorage, and a page that needs one renders
 * nothing for it.
 */
export interface PublicMaterial {
    item_id: number;
    /** A wallet currency in a Mystic Forge recipe; not an item, so no page of its own. */
    currency_id?: number | null;
    name: string | null;
    slug: string | null;
    rarity: string | null;
    icon: string | null;
    wiki?: Gw2WikiLink | null;
    needed: number;
}

export interface PublicRecipe {
    item: Gw2ItemSummary & { item_id?: number; slug: string; wiki?: Gw2WikiLink };
    craftable: boolean;
    /**
     * Whether Google should be told about this page.
     *
     * All 13,024 stay reachable — the material tree and the "used in" links are
     * the graph a crawler walks — but only a reviewed subset is indexed. The
     * working document asks for reviewed data rather than thousands of
     * generated pages, and thirteen thousand unreviewed ones is the thing it
     * names.
     */
    indexable: boolean;
    requires: { disciplines: string[]; min_rating: number } | null;
    /** Made in the Mystic Forge from a checked recipe, with where the recipe came from. */
    forge?: PlanNode["forge"];
    /**
     * Trading post prices, read nightly and dated. Null when no price has
     * been read for anything on the page. Copper throughout.
     */
    prices?: {
        item: { sell_unit: number | null; buy_unit: number | null } | null;
        materials: {
            buy_now: number;
            bid_and_wait: number;
            per_item: Record<string, { sell_unit: number | null; buy_unit: number | null }>;
            not_tradable: number;
        } | null;
        observed_at: string | null;
        stale: boolean;
    } | null;
    tree: PlanNode;
    materials: PublicMaterial[];
    /** What this goes into. It is what turns 13,000 pages into a graph. */
    used_in: { id: number; name: string; slug: string; rarity: string | null; icon: string | null; wiki?: Gw2WikiLink }[];
}

export interface PublicMasteryRegion {
    region: string;
    catalogue_region: string;
    /**
     * False for the one catalogue region the account endpoint does not name.
     * Shown under its own heading rather than filed under a guess.
     */
    paired: boolean;
    points_total: number;
    tracks: {
        id: number;
        name: string;
        slug: string;
        requirement: string | null;
        wiki?: Gw2WikiLink | null;
        tiers: number;
        points_total: number;
        levels: { name: string; description: string | null; point_cost: number }[];
    }[];
}

export interface Gw2VaultSeason {
    title: string | null;
    starts_at: string | null;
    ends_at: string;
    days_left: number;
    /** Astral Acclaim in the wallet. */
    acclaim: number;
    /** Null when the account's vault purchases have never been read. */
    still_to_buy: {
        listings: {
            id: number;
            item_id: number;
            name: string | null;
            icon: string | null;
            rarity: string | null;
            count: number;
            type: "Featured" | "Normal" | "Legacy" | string | null;
            cost: number;
            /** Purchases left before the listing's limit. */
            left: number;
            affordable: boolean;
            wiki?: Gw2WikiLink | null;
        }[];
        cost_of_everything: number;
    } | null;
    /** Sourced statements about what happens at season end. */
    notes?: { text: string; source: string }[];
}

export interface Gw2DailyList {
    done: number;
    total: number;
    items: { id: string; name: string; done: boolean }[];
}

export interface Gw2Today {
    daily_reset_at: string;
    weekly_reset_at: string;
    daily: {
        world_bosses: { done: number; total: number };
        /** Null when the account has never been read for chests — not the same as none taken. */
        heros_choice_chests: Gw2DailyList | null;
        time_gated_crafts: Gw2DailyList | null;
        dungeon_paths: number;
    };
    weekly: { raid_encounters: number };
    /** Where the game's own lists are known to be short. */
    notes: { text: string; source: string }[];
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
        /**
         * The character every card is about — the player's choice when they
         * made one, our ranking when they did not. Compare the top-level
         * `featured_character` to tell which.
         */
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
            /**
             * The piece actually worn in each core slot.
             *
             * `slots` stays a bare rarity per slot because every count is
             * built on it; this is the layer that makes the panel a character
             * rather than a table.
             */
            items: Record<string, { id?: number; name: string; icon: string | null; rarity: string; wiki?: Gw2WikiLink }>;
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
        /** The Wizard's Vault season and what is left on its shelf. Null before the catalogue has a season. */
        season?: Gw2VaultSeason | null;
        /** What resets today and this week, and when. */
        today?: Gw2Today;
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
    /** Goals the player pinned, newest first. The first one is used whenever no goal is asked for. */
    pins: Gw2Pin[];
    /** The goal this answer was weighted for: the one asked for, else the top pin, else none. */
    goal_in_use: string | null;
    open_questions: Gw2OpenQuestion[];
    /** Every character on the account, for choosing which one the advice is about. */
    characters: Gw2CharacterOption[];
    /** The player's own choice, or null while our ranking picks. */
    featured_character: string | null;
    connection: Gw2Connection;
}

export interface Gw2Pin {
    slug: string;
    title: string;
    summary: string | null;
    domain: string | null;
    character_name: string | null;
    priority: number;
    pinned_at: string | null;
}

export interface Gw2CharacterOption {
    name: string;
    profession: string | null;
    level: number;
    ascended_core: number;
}

export interface Gw2OpenQuestion {
    subject: string;
    question: string;
    why: string;
    answer: "yes" | "no" | "unsure" | null;
    answered_at: string | null;
}

export interface Gw2StoryRow {
    id: number;
    name: string;
    timeline: string | null;
    level: number | null;
    /** Set where the chapter belongs to some races only, so nobody reads it as skipped. */
    races: string[];
    steps_seen: number;
    steps_total: number;
}

export interface Gw2StorySeason {
    name: string;
    order: number;
    stories: Gw2StoryRow[];
    steps_seen: number;
    /**
     * Null where the season branches. The API exposes neither the order nor the
     * biography choices that pick a branch, so a denominator would be wrong — a
     * missing number is honest and a wrong one is not.
     */
    steps_total: number | null;
    branches: boolean;
}

export interface Gw2Story {
    character: string;
    race?: string | null;
    /** False when nothing was read for this character — unknown, not "nothing done". */
    known: boolean;
    steps_seen?: number;
    seasons: Gw2StorySeason[];
    note: string;
    characters: { name: string; race: string | null; profession: string | null; level: number }[];
}

export interface Gw2Connection {
    connected: true;
    account_name: string | null;
    key_name: string | null;
    /** `subtoken`: a limited token with an end date. `key`: the player's own key. */
    token_kind?: "subtoken" | "key";
    token_expires_at?: string | null;
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
export interface Gw2GoalOption {
    slug: string;
    title: string;
    summary: string | null;
    domain: string | null;
    icon: string | null;
}

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
 * The dashboard, and the connection it was read through.
 *
 * `dashboard` is null while a freshly connected account is still being read —
 * the backend answers with the connection alone for the half minute the queued
 * sync takes, and the page says so rather than drawing an empty dashboard that
 * looks broken. The connection comes back either way, because it is what tells
 * "still reading" apart from "the read failed": this used to return a bare
 * null and throw the connection away, so a first read that failed looked like
 * one that was taking its time, for ever.
 */
export async function getDashboard(
    intent?: Gw2Intent
): Promise<{ dashboard: Gw2Dashboard | null; connection: Gw2Connection | null }> {
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

    if ("cards" in data.data) {
        const dashboard = data.data as Gw2Dashboard;

        return { dashboard, connection: dashboard.connection };
    }

    return { dashboard: null, connection: data.data.connection ?? null };
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

export async function getContent(): Promise<Gw2Content | null> {
    const { data } = await axiosInstance.get<Envelope<Gw2Content | null>>("/gw2/content");

    return data.data ?? null;
}

export interface Gw2Source {
    url: string;
    label: string | null;
}

export interface Gw2OwnedProduct {
    key: string;
    name: string;
    kind: "base" | "expansion" | "living_world" | string;
    /** null: the game does not say (Visions of Eternity), or nobody is signed in. */
    owned: boolean | null;
    how: "free" | "access" | "included" | "unknown" | null;
    /** The products it came with, when `how` is `included`. */
    with: string[];
    is_free: boolean;
    grants: string | null;
    grants_source: Gw2Source | null;
    note: string | null;
    source: Gw2Source | null;
}

export interface Gw2AccountOverview {
    ownership: Gw2OwnedProduct[];
    /** Null when the armory was never read — a key without `unlocks`. */
    legendary_armory: {
        owned: {
            item_id: number;
            name: string | null;
            icon: string | null;
            type: string | null;
            count: number;
            max_count: number | null;
            room: number | null;
            wiki?: Gw2WikiLink;
        }[];
        in_catalogue: number;
        owned_count: number;
    } | null;
    collections: {
        counts: Record<"skins" | "minis" | "outfits" | "titles", { have: number; total: number }>;
        cheapest: Record<
            "minis" | "outfits" | "skins",
            {
                piece_id: number;
                item_id: number;
                name: string | null;
                icon: string | null;
                item_name: string | null;
                item_icon: string | null;
                sell_unit: number;
                wiki?: Gw2WikiLink;
            }[]
        >;
        closest_titles: {
            title_id: number;
            title: string | null;
            achievement_id: number;
            achievement: string | null;
            current: number;
            max: number;
            wiki?: Gw2WikiLink | null;
        }[];
        prices_observed_at: string | null;
    } | null;
    trading_post: {
        waiting: {
            coins: number;
            items: { item_id: number; name: string | null; icon: string | null; count: number; wiki?: Gw2WikiLink }[];
        };
        buys: Gw2Order[];
        sells: Gw2Order[];
        in_buy_orders: number;
        listed_for: number;
        observed_at: string | null;
    } | null;
    /** What changed between our reads — moved here from the dashboard in the redesign. */
    history?: Gw2Dashboard["since_last_sync"];
}

export interface Gw2Order {
    item_id: number;
    name: string | null;
    icon: string | null;
    rarity: string | null;
    price: number;
    quantity: number;
    created: string | null;
    wiki?: Gw2WikiLink;
}

export interface Gw2Change {
    date: string;
    title: string;
    summary: string;
    applies_to: string;
    applies_to_name: string | null;
    category: string;
    source: Gw2Source;
    /** true: applies to this account. null: cannot be told from the key, or nobody is signed in. */
    yours: boolean | null;
}

export interface Gw2Legendaries {
    legendaries: {
        item_id: number;
        name: string | null;
        type: string | null;
        subtype: string | null;
        icon: string | null;
        max_count: number;
        held: number | null;
        /** `recipe`: a discipline recipe. `forge`: a sourced Mystic Forge recipe. null: not plannable yet. */
        plannable: "recipe" | "forge" | null;
        wiki?: Gw2WikiLink;
    }[];
    forge_recipes_checked: number;
    /** Where the forge recipes come from, largest first — credited on the page. */
    forge_sources?: {
        label: string | null;
        url: string | null;
        recipes: number;
        as_of: string | null;
        /** What the source does not cover, said once beside its credit. */
        note: string | null;
    }[];
    armory_known: boolean;
    today?: { id: string; item_id: number; name: string | null; missing: number; crafted_today: boolean | null }[];
}

export async function getAccountOverview(): Promise<Gw2AccountOverview | null> {
    const { data } = await axiosInstance.get<Envelope<Gw2AccountOverview | null>>("/gw2/account");

    return data.data ?? null;
}

export async function getWhatsNew(): Promise<{ returned_from: string | null; changes: Gw2Change[] } | null> {
    const { data } = await axiosInstance.get<Envelope<{ returned_from: string | null; changes: Gw2Change[] } | null>>(
        "/gw2/whats-new"
    );

    return data.data ?? null;
}

/** When the player last played before their break. Null clears it. */
export async function setReturnedFrom(date: string | null): Promise<void> {
    await axiosInstance.put("/gw2/returned", { date });
}

export async function getLegendaries(itemId?: number): Promise<Gw2Legendaries | null> {
    const { data } = await axiosInstance.get<Envelope<Gw2Legendaries | null>>(
        itemId ? `/gw2/legendary?item_id=${itemId}` : "/gw2/legendary"
    );

    return data.data ?? null;
}

/** One map's insights with this account's collected flags. */
export async function getInsightMap(mapId: number): Promise<InsightMap | null> {
    const { data } = await axiosInstance.get<Envelope<InsightMap | null>>(`/gw2/insights?map=${mapId}`);

    return data.data ?? null;
}

/** Every region's insights, counted against this account. `known` is false when the key cannot see mastery points. */
export async function getInsights(): Promise<{ regions: InsightRegion[]; known: boolean } | null> {
    const { data } = await axiosInstance.get<Envelope<{ regions: InsightRegion[]; known: boolean } | null>>("/gw2/insights");

    return data.data ?? null;
}

export async function getGoals(): Promise<Gw2GoalOption[]> {
    const { data } = await axiosInstance.get<Envelope<Gw2GoalOption[]>>("/gw2/goals");

    return data.data ?? [];
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

/**
 * Ask for a read. The message matters: a full read inside the hour is answered
 * with "read less than an hour ago" rather than queued, and the player should
 * hear that instead of a spinner that changes nothing.
 */
export async function requestSync(full = false): Promise<{ connection: Gw2Connection; message: string | null }> {
    const { data } = await axiosInstance.post<Envelope<Gw2Connection>>(
        `/gw2/sync${full ? "?full=1" : ""}`
    );

    return { connection: data.data, message: data.message ?? null };
}

export async function disconnect(): Promise<void> {
    await axiosInstance.delete("/gw2/connection");
}

/** Pin a goal so it outlives the tab. Answers with every pin, newest first. */
export async function pinGoal(goal: string): Promise<Gw2Pin[]> {
    const { data } = await axiosInstance.post<Envelope<Gw2Pin[]>>("/gw2/pins", { goal });

    return data.data ?? [];
}

export async function unpinGoal(goal: string): Promise<Gw2Pin[]> {
    const { data } = await axiosInstance.delete<Envelope<Gw2Pin[]>>(`/gw2/pins/${encodeURIComponent(goal)}`);

    return data.data ?? [];
}

/** Which character the advice is about. `null` hands the choice back to our ranking. */
export async function chooseCharacter(character: string | null): Promise<void> {
    await axiosInstance.put("/gw2/character", { character });
}

/**
 * Story detected on one character — never "account story completion", because
 * the game reports it per character and a player may have done a chapter on
 * another one. Null when no character has been read at all.
 */
export async function getStory(character?: string | null): Promise<Gw2Story | null> {
    const { data } = await axiosInstance.get<Envelope<Gw2Story | null>>(
        `/gw2/story${character ? `?character=${encodeURIComponent(character)}` : ""}`
    );

    return data.data ?? null;
}

/**
 * What the backend said, for the error a player is shown.
 *
 * The messages there are written for a reader — "read less than an hour ago",
 * "that character is not on this account" — and a generic toast would throw
 * them away. A 429 from the route's own throttle carries Laravel's stock
 * wording, so it is given a sentence of its own.
 */
export function gw2Error(e: unknown, fallback: string): string {
    const response = (e as { response?: { status?: number; data?: { message?: string } } }).response;

    if (response?.status === 429) {
        return "That was a lot of requests in a minute. Give it a moment and try again.";
    }

    return response?.data?.message ?? fallback;
}

/**
 * Copper into the game's own notation.
 *
 * Stored as copper because that is what the API gives and because converting
 * earlier would move a display decision into the database. 10,000 copper is a
 * gold; 100 is a silver.
 */
export { coin } from "@/lib/gw2format";

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
